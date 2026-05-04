/**
 * Geração de DOCX usando docxtemplater.
 *
 * O template deve ter os seguintes placeholders no corpo do documento:
 *   {texto_contratante}  — bloco completo do texto da CONTRATANTE
 *   {nome_socio}         — nome do sócio (para assinatura no rodapé)
 *   {razao_social}       — razão social (caso usado em outros trechos)
 *   {cnpj}               — CNPJ formatado
 *   {data_extenso}       — data por extenso (ex: "04 de maio de 2026")
 *
 * Para modificar o template .docx, abra-o no Word e substitua o texto
 * do bloco CONTRATANTE por {texto_contratante}, etc.
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { formatCNPJ } from '../utils/formatters';
import { saveDocument } from '../repositories/companyRepository';
import { buildContratanteText } from './textBuilderService';

interface GeneratePayload {
  company: {
    id: string;
    razao_social: string;
    cnpj: string;
  };
  complement: Parameters<typeof buildContratanteText>[1];
}

const MONTHS_PT = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
];

function dateExtenso(): string {
  const now = new Date();
  return `${now.getDate().toString().padStart(2,'0')} de ${MONTHS_PT[now.getMonth()]} de ${now.getFullYear()}`;
}

function getTemplatePath(): string {
  const dir  = process.env.TEMPLATE_DIR  || path.join(process.cwd(), 'templates');
  const file = process.env.TEMPLATE_FILE || 'Template Termo Aditivo.docx';
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
): Promise<string> {
  const templatePath = getTemplatePath();

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Template não encontrado em: "${templatePath}"\n` +
      `Configure TEMPLATE_DIR e TEMPLATE_FILE no .env`,
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
      const details = JSON.stringify(e.properties.errors);
      throw new Error(`Erro no template DOCX: ${details}`);
    }
    throw err;
  }

  const outputDir  = getOutputDir();
  const outputPath = path.join(outputDir, outputFileName);

  const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outputPath, buf);

  logger.info(`[docx] gerado: "${outputPath}"`);

  // Persiste no histórico
  await saveDocument(payload.company.id, outputFileName, outputPath);

  return outputPath;
}
