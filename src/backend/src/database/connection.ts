import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host:               process.env.DB_HOST || 'localhost',
      port:               parseInt(process.env.DB_PORT || '3306'),
      user:               process.env.DB_USER || 'aditiva',
      password:           process.env.DB_PASS || '',
      database:           process.env.DB_NAME || 'aditiva_pronto',
      waitForConnections: true,
      connectionLimit:    10,
      queueLimit:         0,
      charset:            'utf8mb4',
      timezone:           '+00:00',
    });
    logger.info('Pool MySQL criado');
  }
  return pool;
}

export async function testConnection(): Promise<void> {
  const db = getPool();
  const conn = await db.getConnection();
  await conn.query('SELECT 1');
  conn.release();
  logger.info('Conexão com MySQL verificada ✓');
}
