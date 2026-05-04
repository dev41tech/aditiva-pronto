/**
 * Importação de planilhas Excel exportadas do Domínio Registro.
 *
 * Estratégia de detecção de colunas:
 *   Tenta múltiplos nomes de cabeçalho para CNPJ e Razão Social,
 *   pois o Domínio pode variar o header dependendo da versão.
 */

import * as XLSX from 'xlsx';
import path from 'path';
import { upsertCompany } from '../repositories/companyRepository';
import { isValidCNPJ, onlyDigits } from '../utils/validators';
import { formatCNPJ } from '../utils/formatters';
import { logger } from '../utils/logger';

const CNPJ_HEADERS   = ['CNPJ', 'cnpj', 'Cnpj', 'C.N.P.J', 'CPF/CNPJ'];
const RAZAO_HEADERS  = ['RAZÃO SOCIAL', 'RAZAO SOCIAL', 'Razão Social', 'Razao Social', 'NOME', 'Nome'];

interface ImportResult {
  total:     number;
  inserted:  number;
  updated:   number;
  skipped:   number;
  errors:    string[];
  fileName:  string;
}

function findColumnIndex(headerRow: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headerRow.findIndex(
      (h) => h?.toString().trim().toLowerCase() === candidate.toLowerCase(),
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

export async function importFromBuffer(
  buffer: Buffer,
  originalFileName: string,
): Promise<ImportResult> {
  const result: ImportResult = {
    total: 0, inserted: 0, updated: 0, skipped: 0,
    errors: [], fileName: originalFileName,
  };

  const workbook = XLSX.read(buffer, { type: 'buffer', cellText: true, raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Planilha vazia ou formato inválido.');

  const sheet = workbook.Sheets[sheetName];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as string[][];

  if (rows.length < 2) throw new Error('Planilha não contém dados suficientes (mínimo 2 linhas).');

  // Detecta cabeçalhos na primeira linha
  const headerRow = rows[0].map((h) => h?.toString().trim());
  const cnpjIdx  = findColumnIndex(headerRow, CNPJ_HEADERS);
  const razaoIdx = findColumnIndex(headerRow, RAZAO_HEADERS);

  if (cnpjIdx === -1)  throw new Error(`Coluna CNPJ não encontrada. Esperado: ${CNPJ_HEADERS.join(' | ')}`);
  if (razaoIdx === -1) throw new Error(`Coluna Razão Social não encontrada. Esperado: ${RAZAO_HEADERS.join(' | ')}`);

  logger.info(`[import] colunas detectadas — CNPJ:${cnpjIdx} RazaoSocial:${razaoIdx}`);

  // Processa linhas de dados (ignora cabeçalho)
  const dataRows = rows.slice(1);
  result.total = dataRows.filter((r) => r.some((c) => c?.toString().trim())).length;

  for (const [lineIdx, row] of dataRows.entries()) {
    const rawCNPJ  = row[cnpjIdx]?.toString().trim() ?? '';
    const rawRazao = row[razaoIdx]?.toString().trim() ?? '';

    if (!rawCNPJ && !rawRazao) continue; // linha completamente vazia

    if (!rawCNPJ) {
      result.errors.push(`Linha ${lineIdx + 2}: CNPJ vazio — "${rawRazao}"`);
      result.skipped++;
      continue;
    }

    if (!rawRazao) {
      result.errors.push(`Linha ${lineIdx + 2}: Razão Social vazia — CNPJ "${rawCNPJ}"`);
      result.skipped++;
      continue;
    }

    const cnpjDigits = onlyDigits(rawCNPJ);

    if (!isValidCNPJ(cnpjDigits)) {
      result.errors.push(`Linha ${lineIdx + 2}: CNPJ inválido "${rawCNPJ}" — "${rawRazao}"`);
      result.skipped++;
      continue;
    }

    const cnpjFormatted = formatCNPJ(cnpjDigits);

    try {
      const wasNew = await upsertAndDetect(rawRazao, cnpjFormatted, originalFileName);
      if (wasNew) result.inserted++;
      else        result.updated++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Linha ${lineIdx + 2}: ${msg}`);
      result.skipped++;
    }
  }

  logger.info(
    `[import] "${originalFileName}" — total:${result.total} inseridos:${result.inserted} atualizados:${result.updated} pulados:${result.skipped}`,
  );
  return result;
}

/** Upsert e retorna true se foi novo registro. */
async function upsertAndDetect(
  razaoSocial: string,
  cnpj: string,
  sourceFile: string,
): Promise<boolean> {
  const { findByCNPJ } = await import('../repositories/companyRepository');
  const existing = await findByCNPJ(cnpj);
  await upsertCompany(razaoSocial, cnpj, path.basename(sourceFile));
  return !existing;
}

/** Importa diretamente de um caminho no sistema de arquivos (para sync automático). */
export async function importFromPath(filePath: string): Promise<ImportResult> {
  const fs = await import('fs');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: "${filePath}"`);
  }
  const buffer = fs.readFileSync(filePath);
  return importFromBuffer(buffer, path.basename(filePath));
}
