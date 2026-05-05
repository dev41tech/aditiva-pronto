import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { formatCNPJ, formatCPF, formatDatePtBr } from '../utils/formatters';
import { saveDocument } from '../repositories/companyRepository';
import { buildContratanteText } from './textBuilderService';

interface GeneratePayload {
  company:    { id: string; razao_social: string; cnpj: string };
  complement: Parameters<typeof buildContratanteText>[1];
}

export interface DocxResult {
  buffer:   Buffer;
  filePath: string;
  fileName: string;
}

// ── Configuração do Contador ──────────────────────────────────────────
// Pode ser sobrescrito via variáveis de ambiente no docker-compose
const CONTADOR_NAME = process.env.CONTADOR_NAME || 'OSVALDO MASSAHARU MAEOKA JUNIOR';
const CONTADOR_ROLE = process.env.CONTADOR_ROLE || 'Contador';
const CIDADE_DOC   = process.env.CIDADE_DOC    || 'Curitiba';

// ── Helpers de path ──────────────────────────────────────────────────

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
    .map(m => m[1]).join('');
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Reconstrói um parágrafo preservando pPr e rPr do primeiro run, substituindo o texto. */
function rebuildPara(originalXml: string, newText: string): string {
  const pPr = originalXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] ?? '';
  const rPr = originalXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)?.[0] ?? '';
  return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${xmlEscape(newText)}</w:t></w:r></w:p>`;
}

/**
 * Substitui texto dentro de cada parágrafo do documento.
 * Suporta string literal e RegExp como padrão de busca.
 */
function applyParagraphReplacements(
  docXml: string,
  replacements: Array<[string | RegExp, string]>,
): { xml: string; count: number } {
  let count = 0;

  const result = docXml.replace(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g, (paraXml) => {
    const text = extractParaText(paraXml);
    if (!text.trim()) return paraXml;

    let newText = text;
    let changed = false;

    for (const [from, to] of replacements) {
      if (typeof from === 'string') {
        if (newText.includes(from)) {
          newText = newText.split(from).join(to);
          changed = true;
        }
      } else {
        // reset lastIndex para evitar bugs com flags 'g'
        from.lastIndex = 0;
        if (from.test(newText)) {
          from.lastIndex = 0;
          newText = newText.replace(from, to);
          changed = true;
        }
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
 * Encontra o bloco CONTRATANTE (parágrafos entre "CONTRATANTE:" e a próxima seção)
 * e substitui pelo texto gerado dinamicamente.
 */
function replaceContratanteBlock(
  docXml: string,
  contratanteText: string,
): { xml: string; found: boolean } {
  const paraRegex = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;
  const paras: Array<{ xml: string; text: string; start: number; end: number }> = [];

  let m: RegExpExecArray | null;
  while ((m = paraRegex.exec(docXml)) !== null) {
    paras.push({ xml: m[0], text: extractParaText(m[0]), start: m.index, end: m.index + m[0].length });
  }

  const contratanteIdx = paras.findIndex(p => /CONTRATANTE\s*:/i.test(p.text));
  if (contratanteIdx === -1) return { xml: docXml, found: false };

  const nextSectionIdx = paras.findIndex((p, i) => {
    if (i <= contratanteIdx) return false;
    const t = p.text.trim();
    return /^(CONTRATADA\s*:|OBJETO\s*:|CL[ÁA]USULA|VALOR\s*:|DO\s+OBJETO|CONSIDERANDO)/i.test(t);
  });
  if (nextSectionIdx === -1) return { xml: docXml, found: false };

  const contratantePara = paras[contratanteIdx];
  const isLabelOnly = /^CONTRATANTE\s*:?\s*$/.test(contratantePara.text.trim());

  const insertStart = isLabelOnly ? contratantePara.end : contratantePara.start;
  const insertEnd   = paras[nextSectionIdx].start;

  const refParaXml = isLabelOnly
    ? (paras[contratanteIdx + 1]?.xml ?? contratantePara.xml)
    : contratantePara.xml;

  const newParaXml = rebuildPara(refParaXml, contratanteText);
  return { xml: docXml.slice(0, insertStart) + newParaXml + docXml.slice(insertEnd), found: true };
}

/**
 * Gera o XML de uma tabela de assinatura de duas colunas sem bordas.
 * Coluna esquerda: sócio (left-aligned)
 * Coluna direita:  contador (right-aligned)
 */
function buildSignatureTableXml(socioName: string): string {
  const half = 4819; // metade de 9638 twips (largura de conteúdo A4 com margem 1")
  const esc  = xmlEscape;

  const tcPr = (w: number) =>
    `<w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>` +
    `<w:tcBorders>` +
    `<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `</w:tcBorders></w:tcPr>`;

  return (
    `<w:tbl>` +
    `<w:tblPr>` +
    `<w:tblW w:w="${half * 2}" w:type="dxa"/>` +
    `<w:tblBorders>` +
    `<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `<w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
    `</w:tblBorders>` +
    `<w:tblLayout w:type="fixed"/>` +
    `</w:tblPr>` +
    `<w:tblGrid><w:gridCol w:w="${half}"/><w:gridCol w:w="${half}"/></w:tblGrid>` +
    // Linha 1: nomes (negrito)
    `<w:tr>` +
    `<w:tc>${tcPr(half)}<w:p><w:pPr><w:jc w:val="left"/></w:pPr>` +
    `<w:r><w:rPr><w:b/></w:rPr><w:t>${esc(socioName.toUpperCase())}</w:t></w:r></w:p></w:tc>` +
    `<w:tc>${tcPr(half)}<w:p><w:pPr><w:jc w:val="right"/></w:pPr>` +
    `<w:r><w:rPr><w:b/></w:rPr><w:t>${esc(CONTADOR_NAME)}</w:t></w:r></w:p></w:tc>` +
    `</w:tr>` +
    // Linha 2: cargos
    `<w:tr>` +
    `<w:tc>${tcPr(half)}<w:p><w:pPr><w:jc w:val="left"/></w:pPr>` +
    `<w:r><w:t>Sócio Administrador</w:t></w:r></w:p></w:tc>` +
    `<w:tc>${tcPr(half)}<w:p><w:pPr><w:jc w:val="right"/></w:pPr>` +
    `<w:r><w:t>${esc(CONTADOR_ROLE)}</w:t></w:r></w:p></w:tc>` +
    `</w:tr>` +
    `</w:tbl>`
  );
}

/**
 * Tenta substituir a seção de assinatura do documento por uma tabela de duas colunas.
 * Tenta primeiro tabelas existentes, depois parágrafos.
 */
function replaceSignatureSection(
  docXml: string,
  socioName: string,
): { xml: string; found: boolean } {
  const tableXml = buildSignatureTableXml(socioName);

  // 1. Tenta substituir tabela já existente que contenha "Sócio Administrador"
  let found = false;
  const afterTable = docXml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, (tbl) => {
    const text = [...tbl.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)]
      .map(m => m[1]).join(' ');
    if (/S[oó]cio\s+Administrador/i.test(text) || /Nome\s+S[oó]cio/i.test(text)) {
      found = true;
      return tableXml;
    }
    return tbl;
  });

  if (found) {
    logger.info('[docx] tabela de assinatura substituída (modo tabela)');
    return { xml: afterTable, found: true };
  }

  // 2. Tenta substituir parágrafos com "Sócio Administrador" + "Contador"
  const paraRegex = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;
  const paras: Array<{ xml: string; text: string; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = paraRegex.exec(docXml)) !== null) {
    paras.push({ xml: m[0], text: extractParaText(m[0]), start: m.index, end: m.index + m[0].length });
  }

  const socioRoleIdx = paras.findIndex(p => /S[oó]cio\s+Administrador/i.test(p.text));
  const contRoleIdx  = paras.findIndex(p => new RegExp(CONTADOR_ROLE, 'i').test(p.text));

  if (socioRoleIdx !== -1 && contRoleIdx !== -1) {
    const nameIdx     = Math.max(0, socioRoleIdx - 1);
    const minParaIdx  = Math.min(nameIdx, Math.max(0, contRoleIdx - 1));
    const maxParaIdx  = Math.max(socioRoleIdx, contRoleIdx);
    const insertStart = paras[minParaIdx].start;
    const insertEnd   = paras[maxParaIdx].end;
    logger.info('[docx] tabela de assinatura inserida (modo parágrafos)');
    return { xml: docXml.slice(0, insertStart) + tableXml + docXml.slice(insertEnd), found: true };
  }

  return { xml: docXml, found: false };
}

// ── Geração principal ─────────────────────────────────────────────────

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

  const docXmlRaw: string = zip.files['word/document.xml']?.asText() ?? '';
  if (!docXmlRaw) throw new Error('O arquivo .docx não contém word/document.xml válido.');

  const hasDocxtemplaterTags = /\{[a-z_]+\}/i.test(docXmlRaw);
  logger.info(`[docx] modo: ${hasDocxtemplaterTags ? 'docxtemplater' : 'substituição XML direta'}`);

  const textoContratante = buildContratanteText(payload.company, payload.complement);
  const cnpjFormatted    = formatCNPJ(payload.company.cnpj);
  const cpfFormatted     = formatCPF(payload.complement.cpf_socio ?? '');
  const dataExtenso      = formatDatePtBr(); // sempre data de hoje, fuso SP
  const socioUpperCase   = (payload.complement.nome_socio ?? '').toUpperCase();

  let buf: Buffer;

  if (hasDocxtemplaterTags) {
    // ── Modo 1: docxtemplater ──────────────────────────────────────
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks:    true,
      errorLogging:  false,
    });

    doc.setData({
      texto_contratante: textoContratante,
      nome_socio:        socioUpperCase,            // CAIXA ALTA na assinatura
      razao_social:      payload.company.razao_social,
      cnpj:              cnpjFormatted,
      cpf:               cpfFormatted,
      data_extenso:      dataExtenso,
      cidade:            CIDADE_DOC,
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
    // ── Modo 2: substituição XML direta ───────────────────────────
    let docXml = docXmlRaw;

    // 1. Substitui bloco CONTRATANTE inteiro pelo texto dinâmico
    const blockResult = replaceContratanteBlock(docXml, textoContratante);
    if (blockResult.found) {
      logger.info('[docx] bloco CONTRATANTE substituído');
      docXml = blockResult.xml;
    } else {
      logger.warn('[docx] marcador CONTRATANTE: não encontrado — usando substituições pontuais');
    }

    // 2. Substitui campos pontuais (campos que ficam fora do bloco contratante,
    //    ex: assinatura, cabeçalho, data)
    const dateRegex = new RegExp(
      `${CIDADE_DOC},\\s+\\d+\\s+de\\s+\\w+\\s+de\\s+\\d{4}\\.`, 'gi',
    );

    const { xml: xmlAfterFields, count } = applyParagraphReplacements(docXml, [
      // Campos literais de placeholder
      ['Razão Social',          payload.company.razao_social],
      ['XX.XXX.XXX/XXXX-XX',   cnpjFormatted],
      ['Nome Sócio',            socioUpperCase],       // CAIXA ALTA
      ['XXX.XXX.XXX-XX',        cpfFormatted],
      ['DD de mês de AAAA',     dataExtenso],
      // Data fixa no formato "Curitiba, DD de mês de AAAA." → data de hoje
      [dateRegex, `${CIDADE_DOC}, ${dataExtenso}.`],
    ]);
    docXml = xmlAfterFields;
    logger.info(`[docx] ${count} parágrafo(s) com substituições pontuais`);

    // 3. Substitui ou cria tabela de assinatura de duas colunas
    const sigResult = replaceSignatureSection(docXml, payload.complement.nome_socio ?? '');
    if (sigResult.found) {
      docXml = sigResult.xml;
    } else {
      logger.warn('[docx] seção de assinatura não encontrada no template — mantenha "Sócio Administrador" no template');
    }

    if (!blockResult.found && count === 0 && !sigResult.found) {
      logger.warn('[docx] nenhuma substituição aplicada — verifique os placeholders do template');
    }

    // Escreve XML modificado de volta no ZIP
    zip.file('word/document.xml', docXml);
    buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  }

  // Diagnóstico: buffer idêntico ao template?
  if (buf.equals(templateBuffer)) {
    logger.warn('[docx] buffer idêntico ao template — nenhuma substituição detectada');
  } else {
    logger.info(`[docx] gerado com sucesso (${buf.length} bytes)`);
  }

  const outputDir  = getOutputDir();
  const outputPath = path.join(outputDir, outputFileName);
  fs.writeFileSync(outputPath, buf);
  logger.info(`[docx] salvo: "${outputPath}"`);

  await saveDocument(payload.company.id, outputFileName, outputPath);
  return { buffer: buf, filePath: outputPath, fileName: outputFileName };
}
