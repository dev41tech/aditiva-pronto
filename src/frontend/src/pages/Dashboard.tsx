import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import {
  Buildings, CheckCircle, Clock, File, ArrowRight, Upload, FolderOpen,
} from '@phosphor-icons/react';
import { getStats, importFile, syncFromDir } from '../services/api';
import type { DashboardStats } from '../types';

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const importMut = useMutation({
    mutationFn: importFile,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['companies'] });
      alert(
        `Importação concluída!\n` +
        `Total: ${data.total} | Inseridas: ${data.inserted} | ` +
        `Atualizadas: ${data.updated} | Ignoradas: ${data.skipped}` +
        (data.errors?.length ? `\n\nErros:\n${data.errors.join('\n')}` : ''),
      );
    },
    onError: (e: Error) => alert(`Erro na importação: ${e.message}`),
  });

  const syncMut = useMutation({
    mutationFn: syncFromDir,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['companies'] });
      const msg =
        data.message ??
        `Arquivo: "${data.sourceFile}"\n` +
        `Inseridas: ${data.inserted} | Atualizadas: ${data.updated} | Ignoradas: ${data.skipped}`;
      alert(`✅ Sincronização concluída!\n\n${msg}` +
        (data.errors?.length ? `\n\nAvisos:\n${data.errors.slice(0, 5).join('\n')}` : ''));
    },
    onError: (e: Error) => alert(`❌ Erro ao sincronizar:\n\n${e.message}`),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importMut.mutate(file);
    e.target.value = '';
  };

  const busy = importMut.isPending || syncMut.isPending;

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestão de Termos Aditivos — 41 Contábil
          </p>
        </div>

        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            className="btn-ghost flex items-center gap-2"
            onClick={() => syncMut.mutate()}
            disabled={busy}
          >
            <FolderOpen size={16} />
            Sincronizar pasta
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <Upload size={16} />
            {importMut.isPending ? 'Importando…' : 'Importar planilha'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Buildings size={22} className="text-blue-600" />}
            label="Total de empresas"
            value={stats?.totalCompanies ?? 0}
            color="bg-blue-50"
          />
          <StatCard
            icon={<CheckCircle size={22} className="text-green-600" />}
            label="Com dados"
            value={stats?.withData ?? 0}
            color="bg-green-50"
          />
          <StatCard
            icon={<Clock size={22} className="text-amber-600" />}
            label="Pendentes"
            value={stats?.pending ?? 0}
            color="bg-amber-50"
          />
          <StatCard
            icon={<File size={22} className="text-purple-600" />}
            label="Documentos gerados"
            value={stats?.totalDocuments ?? 0}
            color="bg-purple-50"
          />
        </div>
      )}

      {/* Last file */}
      {stats?.lastFile && (
        <div className="card mb-8 flex items-center gap-3 text-sm text-gray-500">
          <File size={16} className="shrink-0" />
          <span>Última importação: <span className="font-medium text-gray-700">{stats.lastFile}</span></span>
        </div>
      )}

      {/* Quick actions */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Ações rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/empresas?status=pending')}
            className="flex items-center justify-between p-4 rounded-lg border border-amber-100 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
          >
            <div>
              <p className="font-medium text-amber-900">Empresas pendentes</p>
              <p className="text-xs text-amber-700 mt-0.5">Preencher dados e gerar termos</p>
            </div>
            <ArrowRight size={18} className="text-amber-600 shrink-0" />
          </button>

          <button
            onClick={() => navigate('/empresas?status=ready')}
            className="flex items-center justify-between p-4 rounded-lg border border-green-100 bg-green-50 hover:bg-green-100 transition-colors text-left"
          >
            <div>
              <p className="font-medium text-green-900">Prontos para gerar</p>
              <p className="text-xs text-green-700 mt-0.5">Todos os campos preenchidos</p>
            </div>
            <ArrowRight size={18} className="text-green-600 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
