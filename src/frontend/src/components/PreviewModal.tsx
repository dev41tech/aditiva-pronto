import { X, FileDoc, User, CalendarBlank, CheckCircle, Warning, Minus } from '@phosphor-icons/react';
import type { PreviewResponse, Complement } from '../types';
import { maskCNPJ } from '../utils/validators';

// ── Utilitários ──────────────────────────────────────────────────────

function formatDatePtBr(): string {
  try {
    const fmt = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day:   '2-digit',
      month: 'long',
      year:  'numeric',
    });
    const parts = fmt.formatToParts(new Date());
    const get   = (t: string) => parts.find(p => p.type === t)?.value ?? '';
    return `${get('day')} de ${get('month')} de ${get('year')}`;
  } catch {
    const M = ['janeiro','fevereiro','março','abril','maio','junho',
               'julho','agosto','setembro','outubro','novembro','dezembro'];
    const n = new Date();
    return `${String(n.getDate()).padStart(2,'0')} de ${M[n.getMonth()]} de ${n.getFullYear()}`;
  }
}

interface SectionInfo { name: string; status: 'included' | 'partial' | 'excluded' }

function getSectionStatuses(c: Complement | null | undefined): SectionInfo[] {
  if (!c) return [];
  const af = (...fs: (string | null | undefined)[]) => fs.every(f => f && f.trim().length > 0);
  const an = (...fs: (string | null | undefined)[]) => fs.some(f  => f && f.trim().length > 0);

  const defs: Array<{ name: string; fields: (string | null | undefined)[] }> = [
    { name: 'Endereço da Empresa',     fields: [c.endereco_empresa, c.numero_empresa, c.bairro_empresa, c.cidade_empresa, c.estado_empresa, c.cep_empresa] },
    { name: 'Dados Pessoais do Sócio', fields: [c.nacionalidade_socio, c.estado_civil_socio, c.profissao_socio] },
    { name: 'Endereço do Sócio',       fields: [c.endereco_socio, c.numero_socio, c.bairro_socio, c.cidade_socio, c.estado_socio, c.cep_socio] },
    { name: 'Contato Administrativo',  fields: [c.contato_administrativo_nome, c.contato_administrativo_telefone, c.contato_administrativo_email] },
    { name: 'Contato Financeiro',      fields: [c.contato_financeiro_nome, c.contato_financeiro_telefone, c.contato_financeiro_email] },
  ];

  return defs.map(({ name, fields }) => {
    if (af(...fields)) return { name, status: 'included' as const };
    if (an(...fields)) return { name, status: 'partial'  as const };
    return            { name, status: 'excluded' as const };
  });
}

// ── Props ────────────────────────────────────────────────────────────

interface Props {
  data:       PreviewResponse | null;
  complement: Complement | null | undefined;
  loading:    boolean;
  onClose:    () => void;
  onGenerate: () => void;
  generating: boolean;
}

// ── Componente ───────────────────────────────────────────────────────

export default function PreviewModal({ data, complement, loading, onClose, onGenerate, generating }: Props) {
  const today    = formatDatePtBr();
  const sections = getSectionStatuses(complement);
  const included = sections.filter(s => s.status === 'included');
  const partial  = sections.filter(s => s.status === 'partial');
  const excluded = sections.filter(s => s.status === 'excluded');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pré-visualização do Termo Aditivo"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl
                      border border-gray-100 dark:border-zinc-800
                      max-w-2xl w-full max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
            Pré-visualização do Termo
          </h2>
          <button
            className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500
                       hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-200
                       transition-colors"
            onClick={onClose}
            aria-label="Fechar pré-visualização"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[100, 90, 75, 95, 80, 60].map((w, i) => (
                <div key={i} className="h-3.5 bg-gray-100 dark:bg-zinc-800 rounded" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : data ? (
            <>
              {/* Texto do contratante */}
              <div>
                <p className="section-title mb-3">Texto do Contratante</p>
                <div className="relative rounded-xl border border-gray-200 dark:border-zinc-700
                                bg-gray-50 dark:bg-zinc-800/50 p-5">
                  <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-brand-400 dark:bg-brand-500 rounded-r" />
                  <p className="text-sm text-gray-700 dark:text-zinc-300
                                leading-relaxed whitespace-pre-wrap
                                font-[Georgia,_'Times_New_Roman',_serif] pl-3">
                    {data.texto_contratante}
                  </p>
                </div>
              </div>

              {/* Identificação */}
              <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                <p className="section-title mb-3">Identificação</p>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-zinc-500 mb-0.5">Razão Social</dt>
                    <dd className="font-medium text-gray-800 dark:text-zinc-200">{data.razao_social}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-zinc-500 mb-0.5">CNPJ</dt>
                    <dd className="font-medium text-gray-800 dark:text-zinc-200 tabular-nums">
                      {maskCNPJ(data.cnpj)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Sócio + Data — no DOCX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-xl bg-brand-50 dark:bg-brand-900/30
                                border border-brand-100 dark:border-brand-800/50 px-4 py-3">
                  <User size={18} weight="duotone" className="text-brand-600 dark:text-brand-400 shrink-0" />
                  <div className="text-sm min-w-0">
                    <span className="text-brand-600 dark:text-brand-400 font-medium block text-xs mb-0.5">
                      Assina como
                    </span>
                    <span className="font-bold text-brand-800 dark:text-brand-300 uppercase tracking-wide">
                      {data.nome_socio}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-zinc-800
                                border border-gray-100 dark:border-zinc-700 px-4 py-3">
                  <CalendarBlank size={18} weight="duotone" className="text-gray-500 dark:text-zinc-400 shrink-0" />
                  <div className="text-sm">
                    <span className="text-gray-400 dark:text-zinc-500 font-medium block text-xs mb-0.5">
                      Data no DOCX
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-zinc-200">{today}</span>
                  </div>
                </div>
              </div>

              {/* Seções opcionais — status */}
              <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                <p className="section-title mb-3">Seções opcionais</p>
                <div className="space-y-1.5">
                  {included.map(s => (
                    <div key={s.name} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400
                                                  bg-green-50 dark:bg-green-900/20
                                                  border border-green-100 dark:border-green-800/40
                                                  rounded-lg px-3 py-2">
                      <CheckCircle size={13} weight="fill" className="shrink-0" />
                      <span>{s.name}</span>
                      <span className="ml-auto text-xs opacity-60">será incluída</span>
                    </div>
                  ))}
                  {partial.map(s => (
                    <div key={s.name} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400
                                                  bg-amber-50 dark:bg-amber-900/20
                                                  border border-amber-200 dark:border-amber-800/50
                                                  rounded-lg px-3 py-2">
                      <Warning size={13} weight="fill" className="shrink-0" />
                      <span>{s.name}</span>
                      <span className="ml-auto text-xs opacity-60">incompleta — omitida</span>
                    </div>
                  ))}
                  {excluded.map(s => (
                    <div key={s.name} className="flex items-center gap-2 text-sm text-gray-400 dark:text-zinc-500
                                                  bg-gray-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
                      <Minus size={13} className="shrink-0" />
                      <span>{s.name}</span>
                      <span className="ml-auto text-xs opacity-60">vazia — omitida</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Não foi possível carregar a pré-visualização.
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4
                        border-t border-gray-100 dark:border-zinc-800">
          <button className="btn-ghost" onClick={onClose}>Fechar</button>
          <button
            className="btn-primary"
            onClick={onGenerate}
            disabled={generating || loading || !data}
          >
            <FileDoc size={16} />
            {generating ? 'Gerando…' : 'Gerar e Baixar DOCX'}
          </button>
        </div>
      </div>
    </div>
  );
}
