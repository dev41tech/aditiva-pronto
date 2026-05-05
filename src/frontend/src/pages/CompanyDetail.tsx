import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, FileDoc, Download, Spinner } from '@phosphor-icons/react';
import {
  getCompany, saveComplement, getPreview,
  generateDocxBlob, triggerBlobDownload, downloadUrl,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import CompanyForm from '../components/CompanyForm';
import PreviewModal from '../components/PreviewModal';
import type { Complement } from '../types';
import { maskCNPJ } from '../utils/validators';

export default function CompanyDetail() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const { toast }  = useToast();
  const [showPreview, setShowPreview] = useState(false);

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
      // Dispara o download no navegador
      triggerBlobDownload(blob, fileName);
      // Atualiza histórico
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
        <button className="btn-ghost mt-4" onClick={() => navigate('/empresas')}>
          Voltar
        </button>
      </div>
    );
  }

  const { company, complement, documents } = data;
  const generating = generateMut.isPending;

  return (
    <div className="page-container max-w-4xl">
      {/* ── Voltar ── */}
      <button
        className="btn-ghost -ml-2 mb-5 text-sm"
        onClick={() => navigate('/empresas')}
      >
        <ArrowLeft size={15} />
        Voltar
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

        <div className="flex gap-2 shrink-0">
          <button
            className="btn-outline"
            onClick={() => setShowPreview(true)}
            disabled={!complement}
            title={!complement ? 'Preencha os dados obrigatórios primeiro' : 'Pré-visualizar texto'}
          >
            <Eye size={15} />
            Pré-visualizar
          </button>

          <button
            className="btn-primary"
            onClick={() => generateMut.mutate()}
            disabled={!complement || generating}
          >
            {generating
              ? <><Spinner size={15} className="animate-spin" /> Gerando…</>
              : <><FileDoc size={15} /> Gerar DOCX</>
            }
          </button>
        </div>
      </div>

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
          <h2 className="section-title">
            Histórico de documentos ({documents.length})
          </h2>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between py-2.5 px-3
                           rounded-lg bg-gray-50 dark:bg-zinc-800 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 dark:text-zinc-200 truncate">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    {new Date(doc.generated_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <a
                  href={downloadUrl(doc.id)}
                  className="btn-ghost py-1 px-2 text-xs ml-3 shrink-0"
                  download
                >
                  <Download size={13} />
                  Baixar
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
          loading={loadingPreview}
          onClose={() => setShowPreview(false)}
          onGenerate={() => {
            setShowPreview(false);
            generateMut.mutate();
          }}
          generating={generating}
        />
      )}
    </div>
  );
}
