import { getPool } from '../database/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

export interface CompanyRow extends RowDataPacket {
  id: string;
  razao_social: string;
  cnpj: string;
  source_file: string | null;
  created_at: Date;
  updated_at: Date;
  // campos do complement (via JOIN)
  nome_socio?: string | null;
  cpf_socio?: string | null;
  complement_id?: string | null;
}

export interface ComplementRow extends RowDataPacket {
  id: string;
  company_id: string;
  nome_socio: string;
  cpf_socio: string;
  endereco_empresa?: string | null;
  numero_empresa?: string | null;
  bairro_empresa?: string | null;
  cidade_empresa?: string | null;
  estado_empresa?: string | null;
  cep_empresa?: string | null;
  nacionalidade_socio?: string | null;
  estado_civil_socio?: string | null;
  profissao_socio?: string | null;
  endereco_socio?: string | null;
  numero_socio?: string | null;
  bairro_socio?: string | null;
  cidade_socio?: string | null;
  estado_socio?: string | null;
  cep_socio?: string | null;
  contato_administrativo_nome?: string | null;
  contato_administrativo_telefone?: string | null;
  contato_administrativo_email?: string | null;
  contato_financeiro_nome?: string | null;
  contato_financeiro_telefone?: string | null;
  contato_financeiro_email?: string | null;
  created_at: Date;
  updated_at: Date;
}

export type CompanyStatus = 'all' | 'pending' | 'ready';

export interface ListOptions {
  search?: string;
  status?: CompanyStatus;
  limit?: number;
  offset?: number;
}

// ── COMPANIES ────────────────────────────────────────────────────

export async function findAll(opts: ListOptions = {}): Promise<CompanyRow[]> {
  const db = getPool();
  const { search = '', status = 'all', limit = 100, offset = 0 } = opts;

  let sql = `
    SELECT
      c.id, c.razao_social, c.cnpj, c.source_file, c.created_at, c.updated_at,
      cc.id           AS complement_id,
      cc.nome_socio,
      cc.cpf_socio
    FROM companies c
    LEFT JOIN company_complements cc ON cc.company_id = c.id
    WHERE 1=1
  `;

  const params: unknown[] = [];

  if (search) {
    sql += ` AND (c.razao_social LIKE ? OR c.cnpj LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status === 'pending') {
    sql += ` AND cc.id IS NULL`;
  } else if (status === 'ready') {
    sql += ` AND cc.id IS NOT NULL AND cc.nome_socio IS NOT NULL AND cc.cpf_socio IS NOT NULL`;
  }

  sql += ` ORDER BY c.razao_social ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await db.query<CompanyRow[]>(sql, params);
  return rows;
}

export async function countAll(opts: Pick<ListOptions, 'search' | 'status'> = {}): Promise<number> {
  const db = getPool();
  const { search = '', status = 'all' } = opts;

  let sql = `
    SELECT COUNT(*) AS total
    FROM companies c
    LEFT JOIN company_complements cc ON cc.company_id = c.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (search) {
    sql += ` AND (c.razao_social LIKE ? OR c.cnpj LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status === 'pending') sql += ` AND cc.id IS NULL`;
  else if (status === 'ready') sql += ` AND cc.id IS NOT NULL`;

  const [rows] = await db.query<(RowDataPacket & { total: number })[]>(sql, params);
  return rows[0]?.total ?? 0;
}

export async function findById(id: string): Promise<CompanyRow | null> {
  const db = getPool();
  const [rows] = await db.query<CompanyRow[]>(
    `SELECT c.*, cc.id AS complement_id, cc.nome_socio, cc.cpf_socio
     FROM companies c
     LEFT JOIN company_complements cc ON cc.company_id = c.id
     WHERE c.id = ?`,
    [id],
  );
  return rows[0] ?? null;
}

export async function findByCNPJ(cnpj: string): Promise<CompanyRow | null> {
  const db = getPool();
  const [rows] = await db.query<CompanyRow[]>(
    `SELECT * FROM companies WHERE cnpj = ?`,
    [cnpj],
  );
  return rows[0] ?? null;
}

/** Upsert: cria se não existe, atualiza razão social se CNPJ já estiver cadastrado. */
export async function upsertCompany(
  razaoSocial: string,
  cnpj: string,
  sourceFile: string | null,
): Promise<string> {
  const db = getPool();
  const existing = await findByCNPJ(cnpj);

  if (existing) {
    await db.query(
      `UPDATE companies SET razao_social = ?, source_file = ?, updated_at = NOW() WHERE id = ?`,
      [razaoSocial, sourceFile, existing.id],
    );
    return existing.id;
  }

  const id = uuidv4();
  await db.query<ResultSetHeader>(
    `INSERT INTO companies (id, razao_social, cnpj, source_file) VALUES (?, ?, ?, ?)`,
    [id, razaoSocial, cnpj, sourceFile],
  );
  return id;
}

// ── COMPLEMENTS ──────────────────────────────────────────────────

export async function findComplement(companyId: string): Promise<ComplementRow | null> {
  const db = getPool();
  const [rows] = await db.query<ComplementRow[]>(
    `SELECT * FROM company_complements WHERE company_id = ?`,
    [companyId],
  );
  return rows[0] ?? null;
}

export async function upsertComplement(
  companyId: string,
  data: Omit<ComplementRow, 'id' | 'company_id' | 'created_at' | 'updated_at'>,
): Promise<string> {
  const db = getPool();
  const existing = await findComplement(companyId);

  const fields = [
    'nome_socio', 'cpf_socio',
    'endereco_empresa', 'numero_empresa', 'bairro_empresa', 'cidade_empresa', 'estado_empresa', 'cep_empresa',
    'nacionalidade_socio', 'estado_civil_socio', 'profissao_socio',
    'endereco_socio', 'numero_socio', 'bairro_socio', 'cidade_socio', 'estado_socio', 'cep_socio',
    'contato_administrativo_nome', 'contato_administrativo_telefone', 'contato_administrativo_email',
    'contato_financeiro_nome', 'contato_financeiro_telefone', 'contato_financeiro_email',
  ] as const;

  if (existing) {
    const sets = fields.map((f) => `${f} = ?`).join(', ');
    const values = fields.map((f) => (data as Record<string, unknown>)[f] ?? null);
    await db.query(
      `UPDATE company_complements SET ${sets}, updated_at = NOW() WHERE company_id = ?`,
      [...values, companyId],
    );
    return existing.id;
  }

  const id = uuidv4();
  const cols = ['id', 'company_id', ...fields].join(', ');
  const placeholders = ['?', '?', ...fields.map(() => '?')].join(', ');
  const values = [id, companyId, ...fields.map((f) => (data as Record<string, unknown>)[f] ?? null)];
  await db.query(
    `INSERT INTO company_complements (${cols}) VALUES (${placeholders})`,
    values,
  );
  return id;
}

// ── DOCUMENTS ────────────────────────────────────────────────────

export async function saveDocument(
  companyId: string,
  fileName: string,
  filePath: string,
  generatedBy?: string,
): Promise<string> {
  const db = getPool();
  const id = uuidv4();
  await db.query(
    `INSERT INTO generated_documents (id, company_id, file_name, file_path, generated_by)
     VALUES (?, ?, ?, ?, ?)`,
    [id, companyId, fileName, filePath, generatedBy ?? null],
  );
  return id;
}

export async function findDocument(docId: string) {
  const db = getPool();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT * FROM generated_documents WHERE id = ?`,
    [docId],
  );
  return rows[0] ?? null;
}

export async function listDocuments(companyId: string) {
  const db = getPool();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT * FROM generated_documents WHERE company_id = ? ORDER BY generated_at DESC`,
    [companyId],
  );
  return rows;
}

// ── DASHBOARD STATS ──────────────────────────────────────────────

export async function getDashboardStats() {
  const db = getPool();
  const [totals] = await db.query<RowDataPacket[]>(`
    SELECT
      COUNT(*)                                                       AS total,
      SUM(CASE WHEN cc.id IS NOT NULL THEN 1 ELSE 0 END)            AS with_data,
      SUM(CASE WHEN cc.id IS NULL     THEN 1 ELSE 0 END)            AS pending,
      (SELECT source_file FROM companies ORDER BY created_at DESC LIMIT 1) AS last_file
    FROM companies c
    LEFT JOIN company_complements cc ON cc.company_id = c.id
  `);
  const [docs] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM generated_documents`,
  );
  return {
    totalCompanies:  totals[0]?.total    ?? 0,
    withData:        totals[0]?.with_data ?? 0,
    pending:         totals[0]?.pending   ?? 0,
    lastFile:        totals[0]?.last_file ?? null,
    totalDocuments:  docs[0]?.total       ?? 0,
  };
}
