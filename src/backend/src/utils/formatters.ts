import { onlyDigits } from './validators';

export function formatCNPJ(raw: string): string {
  const d = onlyDigits(raw).padStart(14, '0');
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

export function formatCPF(raw: string): string {
  const d = onlyDigits(raw).padStart(11, '0');
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function formatCEP(raw: string): string {
  const d = onlyDigits(raw).padStart(8, '0');
  return `${d.slice(0, 5)}-${d.slice(5, 8)}`;
}

export function formatPhone(raw: string): string {
  const d = onlyDigits(raw);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

/**
 * Formata uma data em português brasileiro (fuso America/Sao_Paulo).
 * Resultado: "05 de maio de 2026"
 */
export function formatDatePtBr(date: Date = new Date()): string {
  try {
    const fmt = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day:   '2-digit',
      month: 'long',
      year:  'numeric',
    });
    const parts = fmt.formatToParts(date);
    const get   = (type: string) => parts.find(p => p.type === type)?.value ?? '';
    return `${get('day')} de ${get('month')} de ${get('year')}`;
  } catch {
    const M = ['janeiro','fevereiro','março','abril','maio','junho',
               'julho','agosto','setembro','outubro','novembro','dezembro'];
    return `${String(date.getDate()).padStart(2,'0')} de ${M[date.getMonth()]} de ${date.getFullYear()}`;
  }
}

/** Gera nome de arquivo seguro a partir de razão social + CNPJ. */
export function safeFileName(razaoSocial: string, cnpj: string): string {
  const safe = razaoSocial
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase()
    .slice(0, 80);
  const cnpjClean = onlyDigits(cnpj);
  return `Termo_Aditivo_${safe}_${cnpjClean}.docx`;
}
