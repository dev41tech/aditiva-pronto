import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, FileDoc, Download } from '@phosphor-icons/react';
import { getCompany, saveComplement, getPreview, generateDocx, downloadUrl } from '../services/api';
import CompanyForm from '../components/CompanyForm';
import PreviewModal from '../components/PreviewModal';
import type { Complement } from '../types';
import { maskCNPJ } from '../utils/validators';

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => getCompany(id!),
    enabled: !!id,
  });

  const saveMut = useMutation({
    mutationFn: (c: Complement) => saveComplement(id!, c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company', id] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (e: Error) => alert(`Erro ao salvar: ${e.message}`),
  });

  const generateMut = useMutation({
    mutationFn: () => generateDocx(id!),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['company', id] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      alert(`Documento gerado: ${res.fileName}`);
    },
    onError: (e: Error) => alert(`Erro ao gerar documento: ${e.message}`),
  });

  const { data: preview, isFetching: loadingPreview } = useQuery({
    queryKey: ['preview', id],
    queryFn: () => getPreview(id!),
    enabled: showPreview && !!id,
  });

  if (isLoading) {
    return (
      <div className="px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-8 py-8">
        <p className="text-gray-500">Empresa não encontrada.</p>
        <button className="btn-ghost mt-4" onClick={() => navigate('/empresas')}>
          Voltar
        </button>
      </div>
    );
  }

  const { company, complement, documents } = data;

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          className="btn-ghost flex items-center gap-1.5 mb-4 -ml-2 text-sm"
          onClick={() => navigate('/empresas')}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.razao_social}</h1>
            <p className="text-sm text-gray-500 mt-1 tabular-nums">{maskCNPJ(company.cnpj)}</p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              className="btn-ghost flex items-center gap-2"
              onClick={() => setShowPreview(true)}
              disabled={!complement}
              title={!complement ? 'Preencha os dados obrigatórios primeiro' : undefined}
            >
              <Eye size={16} />
              Pré-visualizar
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => generateMut.mutate()}
              disabled={!complement || generateMut.isPending}
            >
              <FileDoc size={16} />
              {generateMut.isPending ? 'Gerando…' : 'Gerar DOCX'}
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <CompanyForm
        company={company}
        defaultValues={complement ?? undefined}
        isSaving={saveMut.isPending}
        onSave={(vals) => saveMut.mutate(vals)}
      />

      {/* Documents history */}
      {documents.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Documentos gerados ({documents.length})
          </h2>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">{doc.file_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(doc.generated_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <a
                  href={downloadUrl(doc.id)}
                  className="btn-ghost py-1 px-2 flex items-center gap-1 text-xs"
                  download
                >
                  <Download size={14} />
                  Baixar
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {showPreview && (
        <PreviewModal
          data={preview ?? null}
          loading={loadingPreview}
          onClose={() => setShowPreview(false)}
          onGenerate={() => {
            setShowPreview(false);
            generateMut.mutate();
          }}
          generating={generateMut.isPending}
        />
      )}
    </div>
  );
}
