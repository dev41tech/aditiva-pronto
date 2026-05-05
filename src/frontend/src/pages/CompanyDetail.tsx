import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Eye, FileDoc, Download, Spinner, Warning, X,
} from '@phosphor-icons/react';
import {
  getCompany, saveComplement, getPreview,
  generateDocxBlob, triggerBlobDownload, downloadUrl,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import CompanyForm, { checkPartialSections } from '../components/CompanyForm';
import PreviewModal from '../components/PreviewModal';
import type { Complement } from '../types';
import { maskCNPJ } from '../utils/validators';

// ── Modal de confirmação de seções parciais ──────────────────────────

interface PartialModalProps {
  sections:  string[];
  onConfirm: () => void;
  onCancel:  () => void;
}

function PartialSectionsModal({ sections, onConfirm, onCancel }: PartialModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Seções incompletas"
    >
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl
                      border border-gray-100 dark:border-zinc-800 max-w-md w-full p-6">
        <button
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400
                     hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          onClick={onCancel}
          aria-label="Fechar"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 shrink-0">
            <Warning size={20} weight="fill" className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-zinc-100 text-base">
              Seções opcionais incompletas
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              As seções abaixo estão parcialmente preenchidas e{' '}
              <strong className="text-gray-700 dark:text-zinc-300">não serão incluídas</strong> no documento.
            </p>
          </div>
        </div>

        <ul className="mb-5 space-y-1.5">
          {sections.map(s => (
            <li
              key={s}
              className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300
                         bg-amber-50 dark:bg-amber-900/20
                         border border-amber-200 dark:border-amber-800/50
                         rounded-lg px-3 py-2"
            >
              <Warning size={12} weight="fill" className="shrink-0" />
              {s}
            </li>
          ))}
        </ul>

        <p className="text-xs text-gray-400 dark:text-zinc-500 mb-5">
          O DOCX será gerado com os dados obrigatórios. Para incluir essas seções, volte
          ao formulário e preencha todos os campos de cada bloco.
        </p>

        <div className="flex gap-3 justify-end">
          <button className="btn-ghost" onClick={onCancel}>Voltar e corrigir</button>
          <button className="btn-primary" onClick={onConfirm}>
            <FileDoc size={15} />
            Gerar assim mesmo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────

export default function CompanyDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const { toast } = useToast();

  const [showPreview,      setShowPreview]      = useState(false);
  const [showPartialModal, setShowPartialModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn:  () => getCompany(id!),
    enabled:  !!id,
  });

  const saveMut = useMutation({
    mutationFn: (c: Complement) => saveComplement(id!, c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', id] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast('Dados salvos com sucesso!', 'success');
    },
    onError: (e: Error) => toast(`Erro ao salvar: ${e.message}`, 'error'),
  });

  const generateMut = useMutation({
    mutationFn: () => generateDocxBlob(id!),
    onSuccess: ({ blob, fileName }) => {
      triggerBlobDownload(blob, fileName);
      qc.invalidateQueries({ queryKey: ['company', id] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast(`Download iniciado: ${fileName}`, 'success');
    },
    onError: (e: Error) => toast(`Erro ao gerar DOCX: ${e.message}`, 'error'),
  });

  const { data: preview, isFetching: loadingPreview } = useQuery({
    queryKey: ['preview', id],
    queryFn:  () => getPreview(id!),
    enabled:  showPreview && !!id,
  });

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="animate-pulse space-y-5">
          <div className="h-6 w-48 bg-gray-200 dark:bg-zinc-800 rounded" />
          <div className="h-72 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <p className="text-gray-500 dark:text-zinc-400">Empresa não encontrada.</p>
        <button className="btn-ghost mt-4" onClick={() => navigate('/empresas')}>Voltar</button>
      </div>
    );
  }

  const { company, complement, documents } = data;
  const generating    = generateMut.isPending;
  const partialSects  = checkPartialSections(complement);

  function handleGenerateClick() {
    if (partialSects.length > 0) {
      setShowPartialModal(true);
    } else {
      generateMut.mutate();
    }
  }

  return (
    <div className="page-container max-w-4xl">

      {/* ── Voltar ── */}
      <button className="btn-ghost -ml-2 mb-5 text-sm" onClick={() => navigate('/empresas')}>
        <ArrowLeft size={15} /> Voltar
      </button>

      {/* ── Header da empresa ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
            {company.razao_social}
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 tabular-nums">
            {maskCNPJ(company.cnpj)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            className="btn-outline"
            onClick={() => setShowPreview(true)}
            disabled={!complement}
            title={!complement ? 'Preencha os dados obrigatórios primeiro' : 'Pré-visualizar texto'}
          >
            <Eye size={15} /> Pré-visualizar
          </button>

          <button
            className="btn-primary"
            onClick={handleGenerateClick}
            disabled={!complement || generating}
          >
            {generating
              ? <><Spinner size={15} className="animate-spin" /> Gerando…</>
              : <><FileDoc size={15} /> Gerar DOCX</>
            }
          </button>
        </div>
      </div>

      {/* ── Alerta de seções parciais ── */}
      {partialSects.length > 0 && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl
                        bg-amber-50 dark:bg-amber-900/20
                        border border-amber-200 dark:border-amber-800/50 px-4 py-3">
          <Warning size={15} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>{partialSects.length} seção{partialSects.length > 1 ? 'ões' : ''} incompleta{partialSects.length > 1 ? 's' : ''}</strong> e serão omitidas do DOCX:{' '}
            {partialSects.join(', ')}. Preencha todos os campos de cada bloco para incluí-las.
          </p>
        </div>
      )}

      {/* ── Formulário ── */}
      <CompanyForm
        company={company}
        defaultValues={complement ?? undefined}
        isSaving={saveMut.isPending}
        onSave={(vals) => saveMut.mutate(vals)}
      />

      {/* ── Histórico de documentos ── */}
      {documents.length > 0 && (
        <div className="card mt-6">
          <h2 className="section-title">Histórico de documentos ({documents.length})</h2>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between py-2.5 px-3
                           rounded-lg bg-gray-50 dark:bg-zinc-800 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 dark:text-zinc-200 truncate">{doc.file_name}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    {new Date(doc.generated_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <a href={downloadUrl(doc.id)} className="btn-ghost py-1 px-2 text-xs ml-3 shrink-0" download>
                  <Download size={13} /> Baixar
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal de pré-visualização ── */}
      {showPreview && (
        <PreviewModal
          data={preview ?? null}
          complement={complement}
          loading={loadingPreview}
          onClose={() => setShowPreview(false)}
          onGenerate={() => {
            setShowPreview(false);
            handleGenerateClick();
          }}
          generating={generating}
        />
      )}

      {/* ── Modal de seções parciais ── */}
      {showPartialModal && (
        <PartialSectionsModal
          sections={partialSects}
          onConfirm={() => { setShowPartialModal(false); generateMut.mutate(); }}
          onCancel={() => setShowPartialModal(false)}
        />
      )}
    </div>
  );
}
