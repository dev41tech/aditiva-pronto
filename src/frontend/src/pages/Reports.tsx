import { useState } from 'react';
import {
  DownloadSimple, MagnifyingGlass, X, Spinner,
  FileXls, FileCsv, CheckSquare, Square,
} from '@phosphor-icons/react';
import { exportCompaniesReport } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { ReportFormat, ReportStatus } from '../types';

// ── Definição dos campos exportáveis ─────────────────────────────────

interface FieldDef {
  key:   string;
  label: string;
}

interface FieldGroup {
  title:  string;
  fields: FieldDef[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    title: 'Dados principais',
    fields: [
      { key: 'razao_social', label: 'Razão Social'  },
      { key: 'cnpj',         label: 'CNPJ'          },
      { key: 'responsavel',  label: 'Responsável'   },
    ],
  },
  {
    title: 'Dados complementares',
    fields: [
      { key: 'nome_socio',            label: 'Nome Sócio'              },
      { key: 'cpf_socio',             label: 'CPF Sócio'               },
      { key: 'endereco_empresa',      label: 'Endereço da Empresa'     },
      { key: 'cidade_empresa',        label: 'Cidade'                  },
      { key: 'estado_empresa',        label: 'Estado'                  },
      { key: 'cep_empresa',           label: 'CEP'                     },
      { key: 'contato_administrativo',label: 'Contato Administrativo'  },
      { key: 'contato_financeiro',    label: 'Contato Financeiro'      },
    ],
  },
  {
    title: 'Dados operacionais',
    fields: [
      { key: 'status_complemento', label: 'Status dos dados complementares' },
      { key: 'created_at',         label: 'Data de cadastro'                },
      { key: 'updated_at',         label: 'Data da última atualização'      },
      { key: 'ultimo_documento',   label: 'Último documento gerado'         },
    ],
  },
];

const ALL_KEYS = FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

// ── Sub-componentes ───────────────────────────────────────────────────

interface CheckboxProps {
  id:       string;
  label:    string;
  checked:  boolean;
  onChange: (checked: boolean) => void;
}

function Checkbox({ id, label, checked, onChange }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2.5 cursor-pointer group
                 text-sm text-gray-700 dark:text-zinc-300
                 hover:text-gray-900 dark:hover:text-zinc-100
                 select-none"
    >
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-checked={checked}
      />
      <span
        aria-hidden="true"
        className={`shrink-0 transition-colors ${
          checked
            ? 'text-brand-600 dark:text-brand-400'
            : 'text-gray-300 dark:text-zinc-600 group-hover:text-gray-400'
        }`}
      >
        {checked
          ? <CheckSquare size={18} weight="fill" />
          : <Square      size={18} />
        }
      </span>
      {label}
    </label>
  );
}

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: 'all',     label: 'Todas (exceto inativas)'      },
  { value: 'pending', label: 'Dados pendentes'              },
  { value: 'ready',   label: 'Prontas para gerar termo'     },
  { value: 'inativo', label: 'Inativas'                     },
];

const FORMAT_OPTIONS: { value: ReportFormat; label: string }[] = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv',  label: 'CSV (.csv)'    },
];

/**
 * Classes do botão de formato — alto contraste nos dois temas.
 * Ativo:    fundo azul sólido + texto branco (razão ≥ 4.5:1).
 * Inativo:  fundo neutro + texto escuro/claro conforme tema.
 */
const formatClass = (active: boolean) =>
  active
    ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-600 dark:text-white'
    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-zinc-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white';

// ── Página principal ──────────────────────────────────────────────────

export default function Reports() {
  const { toast } = useToast();

  // Campos selecionados — começa com todos marcados
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(ALL_KEYS),
  );

  const [status,    setStatus]    = useState<ReportStatus>('all');
  const [format,    setFormat]    = useState<ReportFormat>('xlsx');
  const [search,    setSearch]    = useState('');
  const [exporting, setExporting] = useState(false);

  // ── Handlers de checkbox ────────────────────────────────────────
  function toggleField(key: string, checked: boolean) {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      checked ? next.add(key) : next.delete(key);
      return next;
    });
  }

  function toggleGroup(keys: string[], allChecked: boolean) {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (allChecked ? next.delete(k) : next.add(k)));
      return next;
    });
  }

  function selectAll()   { setSelectedFields(new Set(ALL_KEYS)); }
  function deselectAll() { setSelectedFields(new Set()); }

  const allSelected  = selectedFields.size === ALL_KEYS.length;
  const noneSelected = selectedFields.size === 0;

  // ── Export ──────────────────────────────────────────────────────
  async function handleExport() {
    if (noneSelected) {
      toast('Selecione ao menos um campo para exportar.', 'error');
      return;
    }

    setExporting(true);
    try {
      await exportCompaniesReport({
        format,
        status,
        search: search.trim() || undefined,
        fields: [...selectedFields],
      });
      toast('Arquivo exportado com sucesso!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao exportar dados.';
      toast(msg, 'error');
    } finally {
      setExporting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="page-container max-w-4xl">

      {/* ── Cabeçalho ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
          Relatórios
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Exporte dados dos clientes conforme os filtros selecionados.
        </p>
      </div>

      {/* ── Card principal ── */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 dark:text-zinc-200 mb-5">
          Exportar dados de clientes
        </h2>

        <div className="space-y-6">

          {/* ── Filtro de status ── */}
          <fieldset>
            <legend className="label mb-2">Empresas a exportar</legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro de status">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  aria-pressed={status === opt.value}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    status === opt.value
                      ? 'bg-brand-600 dark:bg-brand-500 text-white border-brand-600 dark:border-brand-500'
                      : 'border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* ── Busca ── */}
          <div>
            <label htmlFor="report-search" className="label">
              Buscar por Razão Social ou CNPJ
            </label>
            <div className="relative max-w-sm">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="report-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome ou CNPJ..."
                className="input pl-9 pr-9"
                aria-label="Buscar por Razão Social ou CNPJ"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                  aria-label="Limpar busca"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── Seleção de campos ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label mb-0">Campos a exportar</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={allSelected}
                  className="text-xs font-medium
                             text-blue-700 hover:text-blue-900 hover:underline
                             dark:text-blue-300 dark:hover:text-blue-100
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                >
                  Selecionar todos
                </button>
                <span className="text-slate-300 dark:text-slate-600 text-xs select-none">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  disabled={noneSelected}
                  className="text-xs font-medium
                             text-slate-600 hover:text-slate-900 hover:underline
                             dark:text-slate-300 dark:hover:text-white
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
                >
                  Desmarcar todos
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {FIELD_GROUPS.map((group) => {
                const groupKeys   = group.fields.map((f) => f.key);
                const allChecked  = groupKeys.every((k) => selectedFields.has(k));
                const someChecked = groupKeys.some((k)  => selectedFields.has(k));

                return (
                  <div key={group.title}
                       className="rounded-xl border border-gray-100 dark:border-zinc-800 p-4">

                    {/* Cabeçalho do grupo — checkbox de grupo */}
                    <label
                      className="flex items-center gap-2.5 cursor-pointer mb-3
                                 text-xs font-semibold uppercase tracking-wider
                                 text-gray-400 dark:text-zinc-500
                                 hover:text-gray-600 dark:hover:text-zinc-300
                                 select-none"
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                        onChange={() => toggleGroup(groupKeys, allChecked)}
                        aria-label={`Selecionar todos os campos de ${group.title}`}
                      />
                      <span
                        aria-hidden="true"
                        className={`shrink-0 transition-colors ${
                          allChecked
                            ? 'text-brand-600 dark:text-brand-400'
                            : someChecked
                            ? 'text-brand-400 dark:text-brand-500'
                            : 'text-gray-300 dark:text-zinc-600'
                        }`}
                      >
                        {allChecked
                          ? <CheckSquare size={16} weight="fill" />
                          : <Square      size={16} />
                        }
                      </span>
                      {group.title}
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-1">
                      {group.fields.map((field) => (
                        <Checkbox
                          key={field.key}
                          id={`field-${field.key}`}
                          label={field.label}
                          checked={selectedFields.has(field.key)}
                          onChange={(v) => toggleField(field.key, v)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contador de campos selecionados */}
            <p className="mt-2 text-xs text-gray-400 dark:text-zinc-500">
              {selectedFields.size} de {ALL_KEYS.length} campo{ALL_KEYS.length !== 1 ? 's' : ''} selecionado{selectedFields.size !== 1 ? 's' : ''}
            </p>
          </div>

          {/* ── Formato de exportação ── */}
          <fieldset>
            <legend className="label mb-2">Formato de exportação</legend>
            <div className="flex gap-3" role="group" aria-label="Formato do arquivo">
              {FORMAT_OPTIONS.map((opt) => {
                const active = format === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border cursor-pointer
                                 transition-colors select-none text-sm font-semibold
                                 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
                                 dark:focus-within:ring-offset-zinc-900
                                 ${formatClass(active)}`}
                  >
                    <input
                      type="radio"
                      name="export-format"
                      value={opt.value}
                      checked={active}
                      onChange={() => setFormat(opt.value)}
                      className="sr-only"
                      aria-label={opt.label}
                    />
                    {/* Ícone sem cor fixa — herda currentColor do label (branco se ativo) */}
                    {opt.value === 'xlsx'
                      ? <FileXls size={18} weight="duotone" aria-hidden="true" />
                      : <FileCsv size={18} weight="duotone" aria-hidden="true" />
                    }
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* ── Aviso: nenhum campo selecionado ── */}
          {noneSelected && (
            <p
              role="alert"
              className="text-sm text-amber-700 dark:text-amber-400
                         bg-amber-50 dark:bg-amber-900/20
                         border border-amber-200 dark:border-amber-800/50
                         rounded-lg px-3 py-2"
            >
              Selecione ao menos um campo para habilitar a exportação.
            </p>
          )}

          {/* ── Botão de exportação ── */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
            <button
              type="button"
              className="btn-primary"
              onClick={handleExport}
              disabled={exporting || noneSelected}
              aria-busy={exporting}
            >
              {exporting
                ? <><Spinner size={16} className="animate-spin" aria-hidden="true" /> Exportando…</>
                : <><DownloadSimple size={16} aria-hidden="true" /> Exportar dados</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
