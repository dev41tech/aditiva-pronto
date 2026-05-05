import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { formatCNPJ } from '../utils/formatters';
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
  // TEMPLATE_PATH tem precedência (usado no docker-compose)
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

  const content = fs.readFileSync(templatePath, 'binary');
  const zip     = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks:    true,
    errorLogging:  false,
  });

  const textoContratante = buildContratanteText(payload.company, payload.complement);

  doc.setData({
    texto_contratante: textoContratante,
    nome_socio:        payload.complement.nome_socio,
    razao_social:      payload.company.razao_social,
    cnpj:              formatCNPJ(payload.company.cnpj),
    data_extenso:      dateExtenso(),
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

  const buf        = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  const outputDir  = getOutputDir();
  const outputPath = path.join(outputDir, outputFileName);

  fs.writeFileSync(outputPath, buf);
  logger.info(`[docx] gerado: "${outputPath}" (${buf.length} bytes)`);

  // Persiste no histórico do banco
  await saveDocument(payload.company.id, outputFileName, outputPath);

  return { buffer: buf, filePath: outputPath, fileName: outputFileName };
}
