import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Buildings, CheckCircle, Clock, Files, ArrowRight,
  Upload, ArrowsClockwise, FileXls,
} from '@phosphor-icons/react';
import { getStats, importFile, syncFromDir } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { DashboardStats } from '../types';

interface StatCardProps {
  icon:    React.ReactNode;
  label:   string;
  value:   number | string;
  accent:  string; // bg color classes
}

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl shrink-0 ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tabular-nums">
          {value}
        </p>
        <p className="text-sm text-gray-500 dark:text-zinc-400 truncate">{label}</p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-6 w-16 bg-gray-100 dark:bg-zinc-800 rounded" />
        <div className="h-4 w-28 bg-gray-100 dark:bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const fileRef  = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['stats'],
    queryFn:  getStats,
  });

  const importMut = useMutation({
    mutationFn: importFile,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['companies'] });
      const msg = `Inseridas: ${data.inserted} · Atualizadas: ${data.updated} · Ignoradas: ${data.skipped}`;
      toast(msg, 'success');
      if (data.errors?.length) {
        toast(`${data.errors.length} linha(s) com erro — verifique o arquivo.`, 'error');
      }
    },
    onError: (e: Error) => toast(`Erro na importação: ${e.message}`, 'error'),
  });

  const syncMut = useMutation({
    mutationFn: syncFromDir,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast(
        data.message ??
        `"${data.sourceFile}" · Inseridas: ${data.inserted} · Atualizadas: ${data.updated}`,
        'success',
      );
    },
    onError: (e: Error) => toast(e.message, 'error'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importMut.mutate(file);
    e.target.value = '';
  };

  const busy = importMut.isPending || syncMut.isPending;

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Gestão de Termos Aditivos · 41 Tech
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            className="btn-outline"
            onClick={() => syncMut.mutate()}
            disabled={busy}
            title="Importar o xlsx mais recente da pasta configurada no servidor"
          >
            <ArrowsClockwise
              size={15}
              className={syncMut.isPending ? 'animate-spin' : ''}
            />
            {syncMut.isPending ? 'Sincronizando…' : 'Sincronizar pasta'}
          </button>

          <button
            className="btn-primary"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <Upload size={15} />
            {importMut.isPending ? 'Importando…' : 'Importar planilha'}
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={<Buildings size={22} className="text-brand-600 dark:text-brand-400" />}
              label="Total de empresas"
              value={stats?.totalCompanies ?? 0}
              accent="bg-brand-50 dark:bg-brand-900/30"
            />
            <StatCard
              icon={<CheckCircle size={22} weight="fill" className="text-green-600 dark:text-green-400" />}
              label="Com dados"
              value={stats?.withData ?? 0}
              accent="bg-green-50 dark:bg-green-900/30"
            />
            <StatCard
              icon={<Clock size={22} weight="fill" className="text-amber-600 dark:text-amber-400" />}
              label="Pendentes"
              value={stats?.pending ?? 0}
              accent="bg-amber-50 dark:bg-amber-900/30"
            />
            <StatCard
              icon={<Files size={22} weight="fill" className="text-purple-600 dark:text-purple-400" />}
              label="Documentos gerados"
              value={stats?.totalDocuments ?? 0}
              accent="bg-purple-50 dark:bg-purple-900/30"
            />
          </>
        )}
      </div>

      {/* ── Última importação ── */}
      {stats?.lastFile && (
        <div className="card mb-6 flex items-center gap-3">
          <FileXls size={18} weight="duotone" className="text-green-600 dark:text-green-400 shrink-0" />
          <div className="text-sm">
            <span className="text-gray-500 dark:text-zinc-400">Última importação: </span>
            <span className="font-medium text-gray-800 dark:text-zinc-200">{stats.lastFile}</span>
          </div>
        </div>
      )}

      {/* ── Ações rápidas ── */}
      <div className="card">
        <h2 className="section-title">Ações rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/empresas?status=pending')}
            className="group flex items-center justify-between p-4 rounded-xl
                       border border-amber-200 dark:border-amber-800/50
                       bg-amber-50 dark:bg-amber-900/20
                       hover:bg-amber-100 dark:hover:bg-amber-900/40
                       transition-colors text-left"
          >
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-300 text-sm">
                Empresas pendentes
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {stats?.pending ?? '…'} aguardando preenchimento
              </p>
            </div>
            <ArrowRight
              size={18}
              className="text-amber-500 dark:text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform"
            />
          </button>

          <button
            onClick={() => navigate('/empresas?status=ready')}
            className="group flex items-center justify-between p-4 rounded-xl
                       border border-green-200 dark:border-green-800/50
                       bg-green-50 dark:bg-green-900/20
                       hover:bg-green-100 dark:hover:bg-green-900/40
                       transition-colors text-left"
          >
            <div>
              <p className="font-semibold text-green-900 dark:text-green-300 text-sm">
                Prontos para gerar
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                {stats?.withData ?? '…'} com todos os dados preenchidos
              </p>
            </div>
            <ArrowRight
              size={18}
              className="text-green-500 dark:text-green-400 shrink-0 group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
