-- ============================================================
-- Aditiva Pronto — Schema inicial
-- Compatível com MySQL 8.0+
-- Execute: mysql -u root -p < scripts/init.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS aditiva_pronto
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aditiva_pronto;

-- ------------------------------------------------------------
-- 1. companies — empresas importadas da Relação de Empresas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  razao_social VARCHAR(300) NOT NULL,
  cnpj         VARCHAR(18)  NOT NULL,       -- formato: XX.XXX.XXX/XXXX-XX
  source_file  VARCHAR(500) NULL,           -- nome do arquivo de importação
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_cnpj (cnpj),
  INDEX idx_razao_social (razao_social),
  INDEX idx_created_at   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. company_complements — dados complementares preenchidos
--    pelo usuário para geração do termo aditivo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_complements (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  company_id   CHAR(36)     NOT NULL,

  -- Obrigatórios
  nome_socio   VARCHAR(200) NOT NULL,
  cpf_socio    VARCHAR(14)  NOT NULL,       -- formato: XXX.XXX.XXX-XX

  -- Endereço da empresa (opcionais)
  endereco_empresa    VARCHAR(300) NULL,
  numero_empresa      VARCHAR(20)  NULL,
  bairro_empresa      VARCHAR(150) NULL,
  cidade_empresa      VARCHAR(150) NULL,
  estado_empresa      CHAR(2)      NULL,
  cep_empresa         VARCHAR(9)   NULL,    -- formato: XXXXX-XXX

  -- Dados pessoais do sócio (opcionais)
  nacionalidade_socio  VARCHAR(100) NULL,
  estado_civil_socio   VARCHAR(50)  NULL,
  profissao_socio      VARCHAR(150) NULL,

  -- Endereço residencial do sócio (opcionais)
  endereco_socio  VARCHAR(300) NULL,
  numero_socio    VARCHAR(20)  NULL,
  bairro_socio    VARCHAR(150) NULL,
  cidade_socio    VARCHAR(150) NULL,
  estado_socio    CHAR(2)      NULL,
  cep_socio       VARCHAR(9)   NULL,

  -- Contato administrativo (opcionais)
  contato_administrativo_nome      VARCHAR(200) NULL,
  contato_administrativo_telefone  VARCHAR(20)  NULL,
  contato_administrativo_email     VARCHAR(200) NULL,

  -- Contato financeiro (opcionais)
  contato_financeiro_nome      VARCHAR(200) NULL,
  contato_financeiro_telefone  VARCHAR(20)  NULL,
  contato_financeiro_email     VARCHAR(200) NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_company (company_id),
  CONSTRAINT fk_complement_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. generated_documents — histórico de documentos gerados
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS generated_documents (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  company_id   CHAR(36)     NOT NULL,
  file_name    VARCHAR(500) NOT NULL,
  file_path    VARCHAR(1000) NOT NULL,
  generated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generated_by VARCHAR(200) NULL,           -- usuário/IP, para auditoria futura

  PRIMARY KEY (id),
  INDEX idx_company   (company_id),
  INDEX idx_generated (generated_at),
  CONSTRAINT fk_document_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
