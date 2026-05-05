export interface Company {
  id:           string;
  razao_social: string;
  cnpj:         string;
  source_file:  string | null;
  created_at:   string;
  updated_at:   string;
  // joined
  complement_id?: string | null;
  nome_socio?:    string | null;
  cpf_socio?:     string | null;
}

export interface Complement {
  id?:         string;
  company_id?: string;

  nome_socio:  string;
  cpf_socio:   string;

  endereco_empresa?:  string;
  numero_empresa?:    string;
  bairro_empresa?:    string;
  cidade_empresa?:    string;
  estado_empresa?:    string;
  cep_empresa?:       string;

  nacionalidade_socio?: string;
  estado_civil_socio?:  string;
  profissao_socio?:     string;

  endereco_socio?: string;
  numero_socio?:   string;
  bairro_socio?:   string;
  cidade_socio?:   string;
  estado_socio?:   string;
  cep_socio?:      string;

  contato_administrativo_nome?:      string;
  contato_administrativo_telefone?:  string;
  contato_administrativo_email?:     string;

  contato_financeiro_nome?:      string;
  contato_financeiro_telefone?:  string;
  contato_financeiro_email?:     string;
}

export interface GeneratedDocument {
  id:           string;
  company_id:   string;
  file_name:    string;
  file_path:    string;
  generated_at: string;
  generated_by: string | null;
}

export interface DashboardStats {
  totalCompanies: number;
  withData:       number;
  pending:        number;
  lastFile:       string | null;
  lastSync:       string | null;   // ISO timestamp da última sincronização
  totalDocuments: number;
  docsThisMonth:  number;
}

export interface ListResponse {
  data:  Company[];
  total: number;
  page:  number;
  pages: number;
}

export interface PreviewResponse {
  texto_contratante: string;
  nome_socio:        string;
  razao_social:      string;
  cnpj:              string;
}

export type CompanyStatus = 'all' | 'pending' | 'ready';
