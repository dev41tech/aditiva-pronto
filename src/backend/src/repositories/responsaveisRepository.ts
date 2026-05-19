import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../database/connection';

export interface ResponsavelRow extends RowDataPacket {
  id:         string;
  nome:       string;
  created_at: Date;
}

export async function listResponsaveis(): Promise<ResponsavelRow[]> {
  const [rows] = await getPool().query<ResponsavelRow[]>(
    `SELECT id, nome, created_at FROM responsaveis ORDER BY nome ASC`,
  );
  return rows;
}

export async function createResponsavel(nome: string): Promise<string> {
  const id = uuidv4();
  await getPool().query<ResultSetHeader>(
    `INSERT INTO responsaveis (id, nome) VALUES (?, ?)`,
    [id, nome.trim()],
  );
  return id;
}

export async function updateResponsavelNome(id: string, nome: string): Promise<void> {
  await getPool().query(
    `UPDATE responsaveis SET nome = ? WHERE id = ?`,
    [nome.trim(), id],
  );
}

export async function deleteResponsavel(id: string): Promise<void> {
  await getPool().query(`DELETE FROM responsaveis WHERE id = ?`, [id]);
}
