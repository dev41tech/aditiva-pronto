/**
 * docxService — geração de Termos Aditivos via docxtemplater
 *
 * Placeholders esperados no template (chaves simples, caixa alta):
 *   {CONTRATANTE_TEXTO}     — bloco completo do contratante
 *   {DATA_DOCUMENTO}        — "Curitiba, 05 de maio de 2026."
 *   {NOME_SOCIO_ASSINATURA} — nome do sócio em caixa alta (célula da tabela)
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { formatCNPJ, formatDatePtBr } from '../utils/formatters';
import { saveDocument } from '../repositories/companyRepository';
import { buildContratanteText } from './textBuilderService';

// ── Tipos ─────────────────────────────────────────────────────────────

interface CompanyInput {
  id:           string;
  razao_social: string;
  cnpj:         string;
}

interface ComplementInput {
  nome_socio:   string;
  cpf_socio:    string;
  endereco_empresa?:               string | null;
  numero_empresa?:                 string | null;
  bairro_empresa?:                 string | null;
  cidade_empresa?:                 string | null;
  estado_empresa?:                 string | null;
  cep_empresa?:                    string | null;
  nacionalidade_socio?:            string | null;
  estado_civil_socio?:             string | null;
  profissao_socio?:                string | null;
  endereco_socio?:                 string | null;
  numero_socio?:                   string | null;
  bairro_socio?:                   string | null;
  cidade_socio?:                   string | null;
  estado_socio?:                   string | null;
  cep_socio?:                      string | null;
  contato_administrativo_nome?:    string | null;
  contato_administrativo_telefone?: string | null;
  contato_administrativo_email?:   string | null;
  contato_financeiro_nome?:        string | null;
  contato_financeiro_telefone?:    string | null;
  contato_financeiro_email?:       string | null;
}

interface GeneratePayload {
  company:    CompanyInput;
  complement: ComplementInput;
}

export interface DocxResult {
  buffer:   Buffer;
  filePath: string;
  fileName: string;
}

// ── Constantes ────────────────────────────────────────────────────────

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

// ── Helper de validação ───────────────────────────────────────────────

/**
 * Garante que um valor existe e não é vazio após trim.
 * Lança erro 400-friendly com o nome do campo se ausente.
 */
function requiredString(value: unknown, fieldName: string): string {
  const finalValue = (value === null || value === undefined)
    ? ''
    : String(value).trim();

  if (!finalValue) {
    throw new Error(`Campo obrigatório ausente para DOCX: ${fieldName}`);
  }

  return finalValue;
}

// ── Geração principal ─────────────────────────────────────────────────

export async function generateDocx(
  payload: GeneratePayload,
  outputFileName: string,
): Promise<DocxResult> {

  // ── Log diagnóstico: dados brutos do banco ────────────────────────
  logger.info('[docx] company raw', payload.company);
  logger.info('[docx] complement raw', payload.complement);

  // ── Validação e extração dos campos obrigatórios ──────────────────
  const razaoSocial = requiredString(payload.company?.razao_social,   'razao_social');
  const cnpj        = requiredString(payload.company?.cnpj,           'cnpj');
  const nomeSocio   = requiredString(payload.complement?.nome_socio,  'nome_socio');
  const cpfSocio    = requiredString(payload.complement?.cpf_socio,   'cpf_socio');

  // ── Valores derivados ─────────────────────────────────────────────
  const nomeSocioAssinatura = nomeSocio.toUpperCase();

  // "Curitiba, 05 de maio de 2026." — incluindo cidade e ponto final
  const dataDocumento = `${CIDADE_DOC}, ${formatDatePtBr(new Date())}.`;

  // Texto completo do bloco CONTRATANTE
  const textoContratante = buildContratanteText(
    { razao_social: razaoSocial, cnpj },
    { ...payload.complement, nome_socio: nomeSocio, cpf_socio: cpfSocio },
  );

  // ── Template data — chaves IDÊNTICAS aos placeholders do DOCX ─────
  const templateData = {
    CONTRATANTE_TEXTO:     textoContratante,
    DATA_DOCUMENTO:        dataDocumento,
    NOME_SOCIO_ASSINATURA: nomeSocioAssinatura,
  };

  // ── Validação explícita antes de renderizar ───────────────────────
  if (!templateData.CONTRATANTE_TEXTO)     throw new Error('CONTRATANTE_TEXTO vazio');
  if (!templateData.DATA_DOCUMENTO)        throw new Error('DATA_DOCUMENTO vazio');
  if (!templateData.NOME_SOCIO_ASSINATURA) throw new Error('NOME_SOCIO_ASSINATURA vazio');

  // ── Log do templateData final (confirmar ausência de undefined) ───
  logger.info('[docx] templateData final', {
    CONTRATANTE_TEXTO:     templateData.CONTRATANTE_TEXTO,
    DATA_DOCUMENTO:        templateData.DATA_DOCUMENTO,
    NOME_SOCIO_ASSINATURA: templateData.NOME_SOCIO_ASSINATURA,
  });

  // ── Leitura do template ───────────────────────────────────────────
  const templatePath = getTemplatePath();

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Template não encontrado em: "${templatePath}". ` +
      `Configure TEMPLATE_PATH (ou TEMPLATE_DIR + TEMPLATE_FILE) no .env.`,
    );
  }

  const templateBuffer = fs.readFileSync(templatePath);
  const zip            = new PizZip(templateBuffer);

  if (!zip.files['word/document.xml']) {
    throw new Error('Arquivo .docx inválido: word/document.xml não encontrado no ZIP.');
  }

  // ── Renderização via docxtemplater ────────────────────────────────
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks:    true,
    errorLogging:  false,
  });

  try {
    doc.render(templateData);
  } catch (err: unknown) {
    const e = err as { properties?: { errors?: unknown[] }; message?: string };
    logger.error('[docx] erro ao renderizar template', {
      error:  e.message,
      errors: e?.properties?.errors,
    });
    if (e?.properties?.errors?.length) {
      throw new Error(
        `Erro no template DOCX: ${JSON.stringify(e.properties.errors, null, 2)}\n` +
        `Verifique se os placeholders {CONTRATANTE_TEXTO}, {DATA_DOCUMENTO} e ` +
        `{NOME_SOCIO_ASSINATURA} estão presentes no arquivo template.`,
      );
    }
    throw err;
  }

  const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

  // ── Diagnóstico final ─────────────────────────────────────────────
  if (buf.equals(templateBuffer)) {
    logger.warn(
      '[docx] ATENÇÃO: buffer gerado é idêntico ao template — ' +
      'nenhum placeholder foi substituído. ' +
      'Verifique se o template contém {CONTRATANTE_TEXTO}, {DATA_DOCUMENTO} e {NOME_SOCIO_ASSINATURA}.',
    );
  } else {
    logger.info(`[docx] gerado com sucesso (${buf.length} bytes)`);
  }

  // ── Persistência em disco e banco ─────────────────────────────────
  const outputDir  = getOutputDir();
  const outputPath = path.join(outputDir, outputFileName);
  fs.writeFileSync(outputPath, buf);
  logger.info(`[docx] arquivo salvo em: "${outputPath}"`);

  await saveDocument(payload.company.id, outputFileName, outputPath);

  return { buffer: buf, filePath: outputPath, fileName: outputFileName };
}
