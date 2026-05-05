import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { formatCNPJ, formatCPF } from '../utils/formatters';
import { saveDocument } from '../repositories/companyRepository';
import { buildContratanteText } from './textBuilderService';

interface GeneratePayload {
  company: { id: string; razao_social: string; cnpj: string };
  complement: Parameters<typeof buildContratanteText>[1];
}

export interface DocxResult {
  buffer:   Buffer;
  filePath: string;
  fileName: string;
}

const MONTHS_PT = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
];

function dateExtenso(): string {
  const now = new Date();
  return `${now.getDate().toString().padStart(2, '0')} de ${MONTHS_PT[now.getMonth()]} de ${now.getFullYear()}`;
}

function getTemplatePath(): string {
  if (process.env.TEMPLATE_PATH) return process.env.TEMPLATE_PATH;
  const dir  = process.env.TEMPLATE_DIR  || path.join(process.cwd(), 'templates');
  const file = process.env.TEMPLATE_FILE || 'termo_aditivo.docx';
  return path.join(dir, file);
}

function getOutputDir(): string {
  const dir = process.env.GENERATED_DIR || path.join(process.cwd(), 'generated');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ── XML helpers ──────────────────────────────────────────────────────

function extractParaText(paraXml: string): string {
  return [...paraXml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)]
    .map(m => m[1])
    .join('');
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rebuildPara(originalXml: string, newText: string): string {
  const pPr = originalXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] ?? '';
  const rPr = originalXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)?.[0] ?? '';
  return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${xmlEscape(newText)}</w:t></w:r></w:p>`;
}

/**
 * Replace literal placeholder strings within each paragraph.
 * Handles text split across multiple <w:r> runs by working on extracted text,
 * then rebuilding the paragraph preserving paragraph/run properties.
 */
function applyParagraphReplacements(
  docXml: string,
  replacements: Array<[string, string]>,
): { xml: string; count: number } {
  let count = 0;

  const result = docXml.replace(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g, (paraXml) => {
    const text = extractParaText(paraXml);
    if (!text.trim()) return paraXml;

    let newText = text;
    let changed = false;

    for (const [from, to] of replacements) {
      if (newText.includes(from)) {
        newText = newText.split(from).join(to);
        changed = true;
      }
    }

    if (changed) {
      count++;
      return rebuildPara(paraXml, newText);
    }
    return paraXml;
  });

  return { xml: result, count };
}

/**
 * Find the CONTRATANTE description block (paragraphs between the "CONTRATANTE:"
 * label and the next section marker) and replace with generated text.
 * Returns the modified XML and whether a replacement was made.
 */
function replaceContratanteBlock(
  docXml: string,
  contratanteText: string,
): { xml: string; found: boolean } {
  // Collect all paragraph positions
  const paraRegex = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;
  const paras: Array<{ xml: string; text: string; start: number; end: number }> = [];

  let m: RegExpExecArray | null;
  while ((m = paraRegex.exec(docXml)) !== null) {
    paras.push({ xml: m[0], text: extractParaText(m[0]), start: m.index, end: m.index + m[0].length });
  }

  const contratanteIdx = paras.findIndex(p => /CONTRATANTE\s*:/i.test(p.text));
  if (contratanteIdx === -1) return { xml: docXml, found: false };

  // Next major section heading after CONTRATANTE
  const nextSectionIdx = paras.findIndex((p, i) => {
    if (i <= contratanteIdx) return false;
    const t = p.text.trim();
    return /^(CONTRATADA\s*:|OBJETO\s*:|CL[ÁA]USULA|VALOR\s*:|DO\s+OBJETO|CONSIDERANDO)/i.test(t);
  });
  if (nextSectionIdx === -1) return { xml: docXml, found: false };

  const contratantePara = paras[contratanteIdx];
  const isLabelOnly = /^CONTRATANTE\s*:?\s*$/.test(contratantePara.text.trim());

  let insertStart: number;
  let insertEnd: number;

  if (isLabelOnly) {
    // Label on its own line — replace paragraphs after it
    insertStart = contratantePara.end;
    insertEnd   = paras[nextSectionIdx].start;
  } else {
    // Label and text in same paragraph — replace from this para up to next section
    insertStart = contratantePara.start;
    insertEnd   = paras[nextSectionIdx].start;
  }

  // Use the formatting of the first body paragraph (first para after label, or label itself)
  const refParaXml = isLabelOnly
    ? (paras[contratanteIdx + 1]?.xml ?? contratantePara.xml)
    : contratantePara.xml;

  const newParaXml = rebuildPara(refParaXml, contratanteText);
  const result = docXml.slice(0, insertStart) + newParaXml + docXml.slice(insertEnd);
  return { xml: result, found: true };
}

// ── Main export ──────────────────────────────────────────────────────

export async function generateDocx(
  payload: GeneratePayload,
  outputFileName: string,
): Promise<DocxResult> {
  const templatePath = getTemplatePath();

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Template não encontrado em: "${templatePath}". ` +
      `Configure TEMPLATE_PATH no .env apontando para o arquivo .docx.`,
    );
  }

  const templateBuffer = fs.readFileSync(templatePath);
  const zip = new PizZip(templateBuffer);

  // Read the main document XML to decide which strategy to use
  const docXmlRaw: string = zip.files['word/document.xml']?.asText() ?? '';
  const hasDocxtemplaterTags = /\{[a-z_]+\}/i.test(docXmlRaw);

  logger.info(`[docx] modo: ${hasDocxtemplaterTags ? 'docxtemplater' : 'substituição XML'}`);

  const textoContratante = buildContratanteText(payload.company, payload.complement);
  const cnpjFormatted    = formatCNPJ(payload.company.cnpj);
  const cpfFormatted     = formatCPF(payload.complement.cpf_socio ?? '');
  const dataExtenso      = dateExtenso();

  let buf: Buffer;

  if (hasDocxtemplaterTags) {
    // ── Modo 1: docxtemplater ────────────────────────────────────────
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks:    true,
      errorLogging:  false,
    });

    doc.setData({
      texto_contratante: textoContratante,
      nome_socio:        payload.complement.nome_socio,
      razao_social:      payload.company.razao_social,
      cnpj:              cnpjFormatted,
      cpf:               cpfFormatted,
      data_extenso:      dataExtenso,
    });

    try {
      doc.render();
    } catch (err: unknown) {
      const e = err as { properties?: { errors?: unknown[] }; message?: string };
      logger.error('[docx] erro ao renderizar template', { error: e.message });
      if (e?.properties?.errors?.length) {
        throw new Error(`Erro no template DOCX: ${JSON.stringify(e.properties.errors)}`);
      }
      throw err;
    }

    buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

  } else {
    // ── Modo 2: substituição XML direta ──────────────────────────────
    let docXml = docXmlRaw;

    // Tenta substituir o bloco CONTRATANTE inteiro
    const blockResult = replaceContratanteBlock(docXml, textoContratante);
    if (blockResult.found) {
      logger.info('[docx] bloco CONTRATANTE substituído');
      docXml = blockResult.xml;
    } else {
      logger.warn('[docx] marcador CONTRATANTE: não encontrado — usando substituições pontuais');
    }

    // Substituições ponto-a-ponto para campos que aparecem fora do bloco
    const replacements: Array<[string, string]> = [
      ['Razão Social',         payload.company.razao_social],
      ['XX.XXX.XXX/XXXX-XX',  cnpjFormatted],
      ['Nome Sócio',           payload.complement.nome_socio ?? ''],
      ['XXX.XXX.XXX-XX',       cpfFormatted],
      ['DD de mês de AAAA',    dataExtenso],
    ];

    const { xml: xmlAfterFields, count } = applyParagraphReplacements(docXml, replacements);
    docXml = xmlAfterFields;
    logger.info(`[docx] ${count} parágrafo(s) substituído(s) por campos literais`);

    if (!blockResult.found && count === 0) {
      logger.warn('[docx] nenhuma substituição foi aplicada — verifique os placeholders do template');
    }

    // Grava o XML modificado de volta no ZIP
    zip.file('word/document.xml', docXml);
    buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  }

  // Valida que o buffer difere do template original
  if (buf.equals(templateBuffer)) {
    logger.warn('[docx] buffer gerado é idêntico ao template — nenhuma substituição ocorreu');
  } else {
    logger.info(`[docx] buffer gerado com sucesso (${buf.length} bytes, diff do template: ${buf.length - templateBuffer.length} bytes)`);
  }

  const outputDir  = getOutputDir();
  const outputPath = path.join(outputDir, outputFileName);

  fs.writeFileSync(outputPath, buf);
  logger.info(`[docx] salvo em: "${outputPath}"`);

  await saveDocument(payload.company.id, outputFileName, outputPath);

  return { buffer: buf, filePath: outputPath, fileName: outputFileName };
}
