/**
 * reportService — exportação de dados de empresas em CSV ou XLSX
 *
 * Segurança:
 *  - Whitelist rígida de campos permitidos (nenhum campo fora da lista chega ao output)
 *  - Parâmetros preparados em toda query SQL (sem concatenação de valores do usuário)
 *  - Campos dinâmicos resolvidos via objeto local, nunca interpolados na query
 *  - Nome do arquivo gerado internamente com timestamp — nunca vem do cliente
 */

import { getPool } from '../database/connection';
import { RowDataPacket } from 'mysql2';
import { utils, write } from 'xlsx';
import { logger } from '../utils/logger';

// ── Tipos públicos ────────────────────────────────────────────────────

export type ExportFormat = 'xlsx' | 'csv';
export type ExportStatus = 'all' | 'pending' | 'ready' | 'inativo';

export interface ExportPayload {
  format:  ExportFormat;
  status:  ExportStatus;
  search?: string;
  fields:  string[];
}

export interface ExportResult {
  buffer:      Buffer;
  fileName:    string;
  contentType: string;
}

// ── Whitelist de campos permitidos ────────────────────────────────────

/** Único lugar que define quais campos podem aparecer no export. */
export const ALLOWED_FIELDS = [
  'razao_social',
  'cnpj',
  'responsavel',
  'nome_socio',
  'cpf_socio',
  'endereco_empresa',
  'cidade_empresa',
  'estado_empresa',
  'cep_empresa',
  'contato_administrativo',
  'contato_financeiro',
  'status_complemento',
  'created_at',
  'updated_at',
  'ultimo_documento',
] as const;

export type AllowedField = (typeof ALLOWED_FIELDS)[number];

/** Labels em português para cabeçalho do arquivo exportado. */
const FIELD_LABELS: Record<AllowedField, string> = {
  razao_social:            'Razão Social',
  cnpj:                    'CNPJ',
  responsavel:             'Responsável',
  nome_socio:              'Nome Sócio',
  cpf_socio:               'CPF Sócio',
  endereco_empresa:        'Endereço da Empresa',
  cidade_empresa:          'Cidade',
  estado_empresa:          'Estado',
  cep_empresa:             'CEP',
  contato_administrativo:  'Contato Administrativo',
  contato_financeiro:      'Contato Financeiro',
  status_complemento:      'Status dos Dados',
  created_at:              'Data de Cadastro',
  updated_at:              'Última Atualização',
  ultimo_documento:        'Último Documento Gerado',
};

// ── Row do banco ──────────────────────────────────────────────────────

interface CompanyReportRow extends RowDataPacket {
  razao_social:                     string;
  cnpj:                             string;
  responsavel:                      string | null;
  inativo:                          number;
  nome_socio:                       string | null;
  cpf_socio:                        string | null;
  endereco_empresa:                 string | null;
  cidade_empresa:                   string | null;
  estado_empresa:                   string | null;
  cep_empresa:                      string | null;
  contato_adm_nome:                 string | null;
  contato_adm_telefone:             string | null;
  contato_adm_email:                string | null;
  contato_fin_nome:                 string | null;
  contato_fin_telefone:             string | null;
  contato_fin_email:                string | null;
  has_complement:                   number;
  created_at:                       Date;
  updated_at:                       Date;
  ultimo_documento:                 string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────

function formatDate(d: Date | null | undefined): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch {
    return String(d);
  }
}

/** Sanitiza célula para CSV: escapa aspas e envolve em aspas duplas. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/"/g, '""');
  // Envolve em aspas se contiver vírgula, quebra de linha ou aspas
  if (/[",\n\r]/.test(str)) return `"${str}"`;
  return str;
}

/** Gera nome de arquivo com timestamp local (Sao Paulo). */
function buildFileName(format: ExportFormat): string {
  const now = new Date();
  const ts = now
    .toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    .replace(/[-: ]/g, '')
    .replace('T', '_')
    .slice(0, 15); // YYYYMMDD_HHmmss
  return `clientes_exportados_${ts}.${format}`;
}

// ── Mapeamento de row → valor de campo ───────────────────────────────

function resolveField(row: CompanyReportRow, field: AllowedField): string {
  switch (field) {
    case 'razao_social':
      return row.razao_social ?? '';
    case 'cnpj':
      return row.cnpj ?? '';
    case 'responsavel':
      return row.responsavel ?? '';
    case 'nome_socio':
      return row.nome_socio ?? '';
    case 'cpf_socio':
      return row.cpf_socio ?? '';
    case 'endereco_empresa':
      return row.endereco_empresa ?? '';
    case 'cidade_empresa':
      return row.cidade_empresa ?? '';
    case 'estado_empresa':
      return row.estado_empresa ?? '';
    case 'cep_empresa':
      return row.cep_empresa ?? '';
    case 'contato_administrativo': {
      const parts = [row.contato_adm_nome, row.contato_adm_telefone, row.contato_adm_email]
        .filter(Boolean);
      return parts.join(' | ');
    }
    case 'contato_financeiro': {
      const parts = [row.contato_fin_nome, row.contato_fin_telefone, row.contato_fin_email]
        .filter(Boolean);
      return parts.join(' | ');
    }
    case 'status_complemento':
      if (row.inativo) return 'Inativa';
      return row.has_complement ? 'Pronta' : 'Pendente';
    case 'created_at':
      return formatDate(row.created_at);
    case 'updated_at':
      return formatDate(row.updated_at);
    case 'ultimo_documento':
      return row.ultimo_documento ?? '';
  }
}

// ── Query ─────────────────────────────────────────────────────────────

async function fetchRows(payload: ExportPayload): Promise<CompanyReportRow[]> {
  const db = getPool();

  const params: unknown[] = [];

  let sql = `
    SELECT
      c.razao_social,
      c.cnpj,
      c.responsavel,
      c.inativo,
      c.created_at,
      c.updated_at,
      cc.nome_socio,
      cc.cpf_socio,
      cc.endereco_empresa,
      cc.cidade_empresa,
      cc.estado_empresa,
      cc.cep_empresa,
      cc.contato_administrativo_nome     AS contato_adm_nome,
      cc.contato_administrativo_telefone AS contato_adm_telefone,
      cc.contato_administrativo_email    AS contato_adm_email,
      cc.contato_financeiro_nome         AS contato_fin_nome,
      cc.contato_financeiro_telefone     AS contato_fin_telefone,
      cc.contato_financeiro_email        AS contato_fin_email,
      (cc.id IS NOT NULL)                AS has_complement,
      (
        SELECT gd.file_name
        FROM   generated_documents gd
        WHERE  gd.company_id = c.id
        ORDER  BY gd.generated_at DESC
        LIMIT  1
      )                                  AS ultimo_documento
    FROM companies c
    LEFT JOIN company_complements cc ON cc.company_id = c.id
    WHERE 1=1
  `;

  // Filtro de status
  if (payload.status === 'inativo') {
    sql += ` AND c.inativo = 1`;
  } else if (payload.status === 'all') {
    sql += ` AND c.inativo = 0`;
  } else if (payload.status === 'pending') {
    sql += ` AND c.inativo = 0 AND cc.id IS NULL`;
  } else if (payload.status === 'ready') {
    sql += ` AND c.inativo = 0 AND cc.id IS NOT NULL AND cc.nome_socio IS NOT NULL AND cc.cpf_socio IS NOT NULL`;
  }

  // Filtro de busca — parâmetros preparados, nunca interpolados
  if (payload.search?.trim()) {
    sql += ` AND (c.razao_social LIKE ? OR c.cnpj LIKE ?)`;
    const term = `%${payload.search.trim()}%`;
    params.push(term, term);
  }

  sql += ` ORDER BY c.razao_social ASC`;

  const [rows] = await db.query<CompanyReportRow[]>(sql, params);
  return rows;
}

// ── Geradores de arquivo ──────────────────────────────────────────────

function buildCsv(rows: CompanyReportRow[], fields: AllowedField[]): Buffer {
  // BOM UTF-8 para compatibilidade com Excel
  const BOM = '﻿';

  const header = fields.map((f) => csvCell(FIELD_LABELS[f])).join(',');
  const lines  = rows.map((row) =>
    fields.map((f) => csvCell(resolveField(row, f))).join(','),
  );

  return Buffer.from(BOM + [header, ...lines].join('\r\n'), 'utf-8');
}

function buildXlsx(rows: CompanyReportRow[], fields: AllowedField[]): Buffer {
  const header = fields.map((f) => FIELD_LABELS[f]);

  const data = rows.map((row) =>
    fields.map((f) => resolveField(row, f)),
  );

  const ws = utils.aoa_to_sheet([header, ...data]);

  // Largura automática por coluna (max 60 chars)
  ws['!cols'] = header.map((_, i) => {
    const maxLen = Math.max(
      header[i]?.length ?? 10,
      ...data.map((r) => String(r[i] ?? '').length),
    );
    return { wch: Math.min(maxLen + 2, 60) };
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Clientes');

  return Buffer.from(write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

// ── Entry point ───────────────────────────────────────────────────────

export async function exportCompanies(payload: ExportPayload): Promise<ExportResult> {
  // Filtra apenas campos da whitelist — impede que campos não autorizados cheguem ao output
  const safeFields = payload.fields.filter((f): f is AllowedField =>
    (ALLOWED_FIELDS as readonly string[]).includes(f),
  );

  if (safeFields.length === 0) {
    throw new Error('Selecione ao menos um campo para exportar.');
  }

  logger.info('[report] exportando', {
    format: payload.format,
    status: payload.status,
    fields: safeFields,
    search: payload.search ?? '',
  });

  const rows     = await fetchRows(payload);
  const fileName = buildFileName(payload.format);

  logger.info(`[report] ${rows.length} empresa(s) encontrada(s)`);

  if (payload.format === 'csv') {
    return {
      buffer:      buildCsv(rows, safeFields),
      fileName,
      contentType: 'text/csv; charset=utf-8',
    };
  }

  return {
    buffer:      buildXlsx(rows, safeFields),
    fileName,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}
