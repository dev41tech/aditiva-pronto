-- Migration 002: tabela responsaveis
-- Idempotente: só cria se não existir.

CREATE TABLE IF NOT EXISTS responsaveis (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_responsaveis_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed inicial — substitua pelos nomes reais antes de rodar.
-- INSERT IGNORE INTO responsaveis (id, nome) VALUES
--   (UUID(), 'Colaboradora 1'),
--   (UUID(), 'Colaboradora 2'),
--   (UUID(), 'Colaboradora 3');

SELECT 'Migration 002 aplicada com sucesso.' AS status;
