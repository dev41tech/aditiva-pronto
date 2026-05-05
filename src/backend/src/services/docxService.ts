/**
 * docxService — geração de Termos Aditivos
 *
 * Estratégia de substituição:
 *  1. Para a assinatura: substitui {{NOME_SOCIO_ASSINATURA}} diretamente no XML,
 *     preservando integralmente a tabela de 2 colunas já existente no template.
 *  2. Para o bloco CONTRATANTE: substitui o parágrafo de descrição dinamicamente.
 *  3. Para campos pontuais (CNPJ, CPF, data): substituição literal/regex por parágrafo.
 *
 * Jamais reconstrói nem injeta novas tabelas de assinatura.
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { formatCNPJ, formatCPF, formatDatePtBr } from '../utils/formatters';
import { saveDocument } from '../repositories/companyRepository';
import { buildContratanteText } from './textBuilderService';

// ── Tipos ─────────────────────────────────────────────────────────────

interface GeneratePayload {
  company:    { id: string; razao_social: string; cnpj: string };
  complement: Parameters<typeof buildContratanteText>[1];
}

export interface DocxResult {
  buffer:   Buffer;
  filePath: string;
  fileName: string;
}

// ── Constantes ────────────────────────────────────────────────────────

/** Placeholder exato que deve constar na célula esquerda da tabela de assinatura. */
const SIGNATURE_PLACEHOLDER = '{{NOME_SOCIO_ASSINATURA}}';

/** Cidade usada na linha de data ("Curitiba, DD de mês de AAAA."). */
const CIDADE_DOC = process.env.CIDADE_DOC || 'Curitiba';

// ── Helpers de path ───────────────────────────────────────────────────

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

// ── Helpers XML ───────────────────────────────────────────────────────

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Extrai o texto visível de um elemento <w:p> concatenando todos os <w:t>. */
function extractParaText(paraXml: string): string {
  return [...paraXml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)]
    .map(m => m[1])
    .join('');
}

/**
 * Reconstrói um <w:p> substituindo todo o texto visível, mas preservando
 * <w:pPr> (alinhamento, indentação) e o <w:rPr> do primeiro run (negrito, fonte, cor…).
 */
function rebuildPara(originalXml: string, newText: string): string {
  const pPr = originalXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] ?? '';
  const rPr = originalXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)?.[0] ?? '';
  return (
    `<w:p>` +
    `${pPr}` +
    `<w:r>${rPr}<w:t xml:space="preserve">${xmlEscape(newText)}</w:t></w:r>` +
    `</w:p>`
  );
}

/**
 * Substitui texto em cada parágrafo individualmente.
 * Suporta string literal ou RegExp como padrão de busca.
 * NÃO toca na estrutura de tabelas — trabalha dentro de <w:p>.
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
 * Substitui o bloco de descrição CONTRATANTE pelo texto gerado dinamicamente.
 * Procura o parágrafo que começa com "CONTRATANTE:" e substitui o conteúdo
 * até a próxima seção (CONTRATADA:, CLÁUSULA, etc.).
 */
function replaceContratanteBlock(
  docXml: string,
  contratanteText: string,
): { xml: string; found: boolean } {
  const paraRegex = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;
  const paras: Array<{ xml: string; text: string; start: number; end: number }> = [];

  let m: RegExpExecArray | null;
  while ((m = paraRegex.exec(docXml)) !== null) {
    paras.push({
      xml: m[0], text: extractParaText(m[0]),
      start: m.index, end: m.index + m[0].length,
    });
  }

  const contIdx = paras.findIndex(p => /CONTRATANTE\s*:/i.test(p.text));
  if (contIdx === -1) return { xml: docXml, found: false };

  const nextIdx = paras.findIndex((p, i) => {
    if (i <= contIdx) return false;
    return /^(CONTRATADA\s*:|OBJETO\s*:|CL[ÁA]USULA|VALOR\s*:|DO\s+OBJETO|CONSIDERANDO)/i.test(p.text.trim());
  });
  if (nextIdx === -1) return { xml: docXml, found: false };

  const cPara      = paras[contIdx];
  const isLabel    = /^CONTRATANTE\s*:?\s*$/.test(cPara.text.trim());
  const insertStart = isLabel ? cPara.end : cPara.start;
  const insertEnd   = paras[nextIdx].start;
  const refXml      = isLabel ? (paras[contIdx + 1]?.xml ?? cPara.xml) : cPara.xml;

  return {
    xml:   docXml.slice(0, insertStart) + rebuildPara(refXml, contratanteText) + docXml.slice(insertEnd),
    found: true,
  };
}

// ── Substituição da assinatura ─────────────────────────────────────────

/**
 * Substitui {{NOME_SOCIO_ASSINATURA}} pelo nome do sócio em caixa alta,
 * preservando integralmente a tabela de 2 colunas do template.
 *
 * Tentativa 1 — substituição direta no XML raw (preserva 100% da formatação).
 * Tentativa 2 — substituição via extração de parágrafo (fallback para texto fragmentado).
 *
 * Lança erro amigável se o placeholder não for encontrado.
 */
function replaceSignaturePlaceholder(
  docXml: string,
  socioUpperCase: string,
): string {
  // ── Tentativa 1: substituição direta (placeholder em um único <w:t>) ──
  const direct = docXml.replace(
    /\{\{NOME_SOCIO_ASSINATURA\}\}/g,
    xmlEscape(socioUpperCase),
  );

  if (direct !== docXml) {
    logger.info('[docx] {{NOME_SOCIO_ASSINATURA}} substituído — modo direto');
    return direct;
  }

  // ── Tentativa 2: parágrafo-level (texto fragmentado em múltiplos <w:r>) ──
  // Word pode dividir o texto do placeholder em runs separados ao editar.
  const { xml: paraXml, count } = applyParagraphReplacements(docXml, [
    [SIGNATURE_PLACEHOLDER, socioUpperCase],
  ]);

  if (count > 0) {
    logger.info('[docx] {{NOME_SOCIO_ASSINATURA}} substituído — modo parágrafo (texto fragmentado)');
    return paraXml;
  }

  // ── Placeholder não encontrado → erro amigável ────────────────────────
  throw new Error(
    `O template DOCX não contém o placeholder "${SIGNATURE_PLACEHOLDER}".\n` +
    `Para corrigir:\n` +
    `  1. Abra o template (${path.basename(getTemplatePath())}) no Word.\n` +
    `  2. Localize a tabela de assinatura no final do documento.\n` +
    `  3. Na célula esquerda (nome do sócio), substitua o conteúdo por: ${SIGNATURE_PLACEHOLDER}\n` +
    `  4. Salve o arquivo e faça upload novamente para o servidor.`,
  );
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
  const zip            = new PizZip(templateBuffer);
  const docXmlRaw      = zip.files['word/document.xml']?.asText() ?? '';

  if (!docXmlRaw) {
    throw new Error('Arquivo .docx inválido: word/document.xml não encontrado.');
  }

  // ── Dados calculados ────────────────────────────────────────────────
  const textoContratante = buildContratanteText(payload.company, payload.complement);
  const cnpjFormatted    = formatCNPJ(payload.company.cnpj);
  const cpfFormatted     = formatCPF(payload.complement.cpf_socio ?? '');
  const dataExtenso      = formatDatePtBr(); // hoje, fuso America/Sao_Paulo
  const socioUpperCase   = (payload.complement.nome_socio ?? '').toUpperCase();

  const hasDocxtemplaterTags = /\{[a-z_]+\}/i.test(docXmlRaw);
  logger.info(
    `[docx] template: ${path.basename(templatePath)} | ` +
    `modo: ${hasDocxtemplaterTags ? 'docxtemplater' : 'XML direto'} | ` +
    `sócio: "${socioUpperCase}" | data: "${dataExtenso}"`,
  );

  let buf: Buffer;

  if (hasDocxtemplaterTags) {
    // ══════════════════════════════════════════════════════════════════
    // MODO 1 — docxtemplater ({placeholder} com chaves simples)
    // O template define {texto_contratante}, {nome_socio}, {data_extenso}…
    // ══════════════════════════════════════════════════════════════════
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks:    true,
      errorLogging:  false,
    });

    doc.setData({
      texto_contratante:       textoContratante,
      nome_socio:              socioUpperCase,  // usado no corpo e na assinatura
      nome_socio_assinatura:   socioUpperCase,  // alias explícito para a assinatura
      razao_social:            payload.company.razao_social,
      cnpj:                    cnpjFormatted,
      cpf:                     cpfFormatted,
      data_extenso:            dataExtenso,
      cidade:                  CIDADE_DOC,
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

    // Aplica substituição do placeholder de assinatura mesmo no modo docxtemplater,
    // caso o template misture os dois estilos.
    if (buf.toString('utf8').includes(SIGNATURE_PLACEHOLDER)) {
      logger.info('[docx] {{NOME_SOCIO_ASSINATURA}} detectado após docxtemplater — aplicando substituição complementar');
      const zip2   = new PizZip(buf);
      const docXml2 = zip2.files['word/document.xml']?.asText() ?? '';
      const fixed   = replaceSignaturePlaceholder(docXml2, socioUpperCase);
      zip2.file('word/document.xml', fixed);
      buf = zip2.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    }

  } else {
    // ══════════════════════════════════════════════════════════════════
    // MODO 2 — substituição XML direta ({{PLACEHOLDER}} com chaves duplas
    //          ou literais como "Razão Social", "XX.XXX.XXX/XXXX-XX")
    // ══════════════════════════════════════════════════════════════════
    let docXml = docXmlRaw;

    // 1. Assinatura — substitui {{NOME_SOCIO_ASSINATURA}} preservando a tabela
    //    (lança erro amigável se o placeholder não existir)
    docXml = replaceSignaturePlaceholder(docXml, socioUpperCase);

    // 2. Bloco CONTRATANTE — substitui parágrafo de descrição
    const blockResult = replaceContratanteBlock(docXml, textoContratante);
    if (blockResult.found) {
      logger.info('[docx] bloco CONTRATANTE substituído');
      docXml = blockResult.xml;
    } else {
      logger.warn('[docx] marcador CONTRATANTE: não encontrado — tentando substituições pontuais');
    }

    // 3. Campos pontuais (data, CNPJ, CPF, nome se não coberto acima)
    const dateRegex = new RegExp(
      `${CIDADE_DOC},\\s+\\d{1,2}\\s+de\\s+\\w+\\s+de\\s+\\d{4}\\.`,
      'gi',
    );

    const { xml: xmlAfter, count } = applyParagraphReplacements(docXml, [
      ['Razão Social',         payload.company.razao_social],
      ['XX.XXX.XXX/XXXX-XX',  cnpjFormatted],
      ['XXX.XXX.XXX-XX',       cpfFormatted],
      ['Nome Sócio',           socioUpperCase],
      ['DD de mês de AAAA',    dataExtenso],
      [dateRegex,              `${CIDADE_DOC}, ${dataExtenso}.`],
    ]);
    docXml = xmlAfter;

    if (count > 0) {
      logger.info(`[docx] ${count} parágrafo(s) com substituições pontuais`);
    }

    zip.file('word/document.xml', docXml);
    buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  }

  // ── Diagnóstico final ──────────────────────────────────────────────
  if (buf.equals(templateBuffer)) {
    logger.warn('[docx] ATENÇÃO: buffer gerado é idêntico ao template — nenhuma substituição aplicada');
  } else {
    logger.info(`[docx] gerado com sucesso (${buf.length} bytes)`);
  }

  // ── Persistência ───────────────────────────────────────────────────
  const outputDir  = getOutputDir();
  const outputPath = path.join(outputDir, outputFileName);
  fs.writeFileSync(outputPath, buf);
  logger.info(`[docx] arquivo salvo em: "${outputPath}"`);

  await saveDocument(payload.company.id, outputFileName, outputPath);
  return { buffer: buf, filePath: outputPath, fileName: outputFileName };
}
