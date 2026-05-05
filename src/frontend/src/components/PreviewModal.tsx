import { X, FileDoc, User } from '@phosphor-icons/react';
import type { PreviewResponse } from '../types';
import { maskCNPJ } from '../utils/validators';

interface Props {
  data:       PreviewResponse | null;
  loading:    boolean;
  onClose:    () => void;
  onGenerate: () => void;
  generating: boolean;
}

export default function PreviewModal({ data, loading, onClose, onGenerate, generating }: Props) {
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
                       hover:bg-gray-100 dark:hover:bg-zinc-800
                       hover:text-gray-700 dark:hover:text-zinc-200
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
                <div
                  key={i}
                  className="h-3.5 bg-gray-100 dark:bg-zinc-800 rounded"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          ) : data ? (
            <>
              {/* Bloco contratante — estilo documento */}
              <div>
                <p className="section-title mb-3">Texto do Contratante</p>
                <div className="relative rounded-xl border border-gray-200 dark:border-zinc-700
                                bg-gray-50 dark:bg-zinc-800/50 p-5">
                  {/* Linha decorativa lateral estilo Word */}
                  <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-brand-400 dark:bg-brand-500 rounded-r" />
                  <p className="text-sm text-gray-700 dark:text-zinc-300
                                leading-relaxed whitespace-pre-wrap
                                font-[Georgia,_'Times_New_Roman',_serif] pl-3">
                    {data.texto_contratante}
                  </p>
                </div>
              </div>

              {/* Dados de identificação */}
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

              {/* Sócio assina */}
              <div className="flex items-center gap-3 rounded-xl bg-brand-50 dark:bg-brand-900/30
                              border border-brand-100 dark:border-brand-800/50 px-4 py-3">
                <User size={18} weight="duotone" className="text-brand-600 dark:text-brand-400 shrink-0" />
                <div className="text-sm">
                  <span className="text-brand-600 dark:text-brand-400 font-medium">Assina como: </span>
                  <span className="font-semibold text-brand-800 dark:text-brand-300">
                    {data.nome_socio}
                  </span>
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
          <button className="btn-ghost" onClick={onClose}>
            Fechar
          </button>
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
