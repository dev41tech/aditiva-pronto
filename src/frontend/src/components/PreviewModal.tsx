import { X, FileDoc } from '@phosphor-icons/react';
import type { PreviewResponse } from '../types';
import { maskCNPJ } from '../utils/validators';

interface Props {
  data: PreviewResponse | null;
  loading: boolean;
  onClose: () => void;
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Pré-visualização do Termo</h2>
          <button
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
            onClick={onClose}
            aria-label="Fechar pré-visualização"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-4/6 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded mt-4" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
            </div>
          ) : data ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Contratante
                </p>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-[Georgia,serif]">
                  {data.texto_contratante}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Identificação
                </p>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-400 text-xs">Razão Social</dt>
                    <dd className="font-medium text-gray-800 mt-0.5">{data.razao_social}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 text-xs">CNPJ</dt>
                    <dd className="font-medium text-gray-800 mt-0.5 tabular-nums">{maskCNPJ(data.cnpj)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 text-xs">Nome do Sócio</dt>
                    <dd className="font-medium text-gray-800 mt-0.5">{data.nome_socio}</dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Não foi possível carregar a pré-visualização.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button className="btn-ghost" onClick={onClose}>
            Fechar
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={onGenerate}
            disabled={generating || loading || !data}
          >
            <FileDoc size={16} />
            {generating ? 'Gerando…' : 'Gerar DOCX'}
          </button>
        </div>
      </div>
    </div>
  );
}
