-- ============================================================
-- Migration 001 — Adicionar responsavel e inativo em companies
-- Compatível com MySQL 8.0+
-- Idempotente: pode ser executado mais de uma vez sem falhar.
-- ============================================================
-- Execute: mysql -u <user> -p <database> < scripts/migrations/001-add-responsavel-inativo.sql
-- ============================================================

USE aditiva_pronto;

-- ------------------------------------------------------------
-- 1. Coluna: responsavel
--    VARCHAR(100) NULL — nome da colaboradora responsável pelo
--    preenchimento desta empresa. NULL = sem responsável.
-- ------------------------------------------------------------
SET @col_responsavel = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'companies'
    AND COLUMN_NAME  = 'responsavel'
);

SET @sql_responsavel = IF(
  @col_responsavel = 0,
  'ALTER TABLE companies ADD COLUMN responsavel VARCHAR(100) NULL',
  'SELECT ''[skip] coluna responsavel já existe'' AS migration_note'
);

PREPARE stmt FROM @sql_responsavel;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 2. Coluna: inativo
--    TINYINT(1) NOT NULL DEFAULT 0 — marcador persistente de
--    inatividade. 0 = ativa, 1 = inativa.
--    Ortogonal ao status derivado (pending/ready): uma empresa
--    pode ter complemento preenchido e ainda ser inativa.
-- ------------------------------------------------------------
SET @col_inativo = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'companies'
    AND COLUMN_NAME  = 'inativo'
);

SET @sql_inativo = IF(
  @col_inativo = 0,
  'ALTER TABLE companies ADD COLUMN inativo TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT ''[skip] coluna inativo já existe'' AS migration_note'
);

PREPARE stmt FROM @sql_inativo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 3. Índice: idx_companies_responsavel
--    Otimiza filtros e listagens por responsável.
-- ------------------------------------------------------------
SET @idx_responsavel = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'companies'
    AND INDEX_NAME   = 'idx_companies_responsavel'
);

SET @sql_idx_responsavel = IF(
  @idx_responsavel = 0,
  'CREATE INDEX idx_companies_responsavel ON companies (responsavel)',
  'SELECT ''[skip] índice idx_companies_responsavel já existe'' AS migration_note'
);

PREPARE stmt FROM @sql_idx_responsavel;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 4. Índice: idx_companies_inativo
--    Otimiza filtros de empresas ativas/inativas.
-- ------------------------------------------------------------
SET @idx_inativo = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'companies'
    AND INDEX_NAME   = 'idx_companies_inativo'
);

SET @sql_idx_inativo = IF(
  @idx_inativo = 0,
  'CREATE INDEX idx_companies_inativo ON companies (inativo)',
  'SELECT ''[skip] índice idx_companies_inativo já existe'' AS migration_note'
);

PREPARE stmt FROM @sql_idx_inativo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- Verificação final
-- ------------------------------------------------------------
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME   = 'companies'
  AND COLUMN_NAME IN ('responsavel', 'inativo')
ORDER BY COLUMN_NAME;
