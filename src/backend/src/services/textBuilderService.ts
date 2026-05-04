/**
 * Monta dinamicamente o texto do bloco CONTRATANTE do termo aditivo.
 *
 * Regra: campos opcionais não preenchidos NÃO geram vírgulas, espaços
 * ou trechos quebrados no texto final.
 */

import { formatCNPJ, formatCPF, formatCEP, formatPhone } from '../utils/formatters';

interface Company {
  razao_social: string;
  cnpj: string;
}

interface Complement {
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
}

/** Verifica se todos os campos de uma lista estão preenchidos. */
const allFilled = (...fields: (string | null | undefined)[]): boolean =>
  fields.every((f) => f && f.trim().length > 0);

export function buildContratanteText(company: Company, c: Complement): string {
  const cnpjFmt = formatCNPJ(company.cnpj);
  const cpfFmt  = formatCPF(c.cpf_socio);

  const hasEmpresaAddr = allFilled(
    c.endereco_empresa, c.numero_empresa, c.bairro_empresa,
    c.cidade_empresa, c.estado_empresa, c.cep_empresa,
  );

  const hasSocioPersonal = allFilled(
    c.nacionalidade_socio, c.estado_civil_socio, c.profissao_socio,
  );

  const hasSocioAddr = allFilled(
    c.endereco_socio, c.numero_socio, c.bairro_socio,
    c.cidade_socio, c.estado_socio, c.cep_socio,
  );

  const hasAdmContact = allFilled(
    c.contato_administrativo_nome,
    c.contato_administrativo_telefone,
    c.contato_administrativo_email,
  );

  const hasFinContact = allFilled(
    c.contato_financeiro_nome,
    c.contato_financeiro_telefone,
    c.contato_financeiro_email,
  );

  // ── Cabeçalho base ──────────────────────────────────────────
  let text = `${company.razao_social}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${cnpjFmt}`;

  // ── Endereço da empresa ─────────────────────────────────────
  if (hasEmpresaAddr) {
    text += `, estabelecida na ${c.endereco_empresa}, n° ${c.numero_empresa}, Bairro ${c.bairro_empresa} – ${c.cidade_empresa}/${c.estado_empresa}, CEP ${formatCEP(c.cep_empresa!)}`;
  }

  // ── Representante (sócio) ───────────────────────────────────
  text += `, neste ato representado por seu Sócio Administrador ${c.nome_socio}`;

  if (hasSocioPersonal) {
    text += `, ${c.nacionalidade_socio}, ${c.estado_civil_socio}, ${c.profissao_socio}`;
  }

  text += `, portador do CPF ${cpfFmt}`;

  // ── Endereço residencial do sócio ───────────────────────────
  if (hasSocioAddr) {
    text += `, residente e domiciliado na ${c.endereco_socio}, n° ${c.numero_socio}, Bairro ${c.bairro_socio}, Cidade ${c.cidade_socio} – ${c.estado_socio}, CEP ${formatCEP(c.cep_socio!)}`;
  }

  // ── Contatos ────────────────────────────────────────────────
  const contacts: string[] = [];

  if (hasAdmContact) {
    contacts.push(
      `Contato administrativo: ${c.contato_administrativo_nome} ${formatPhone(c.contato_administrativo_telefone!)}, E-mail: ${c.contato_administrativo_email}`,
    );
  }

  if (hasFinContact) {
    contacts.push(
      `Contato financeiro: ${c.contato_financeiro_nome} ${formatPhone(c.contato_financeiro_telefone!)}, E-mail: ${c.contato_financeiro_email}`,
    );
  }

  if (contacts.length > 0) {
    text += `. ${contacts.join('. ')}`;
    text += ';';
  } else {
    text += '.';
  }

  return text;
}
