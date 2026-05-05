import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Buildings, CheckCircle, Clock, Files,
  ArrowRight, ArrowsClockwise, FileXls, CalendarBlank,
} from '@phosphor-icons/react';
import { getStats, syncFromDir } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { DashboardStats } from '../types';

// ── Sub-componentes ──────────────────────────────────────────────────

interface StatCardProps {
  icon:    React.ReactNode;
  label:   string;
  value:   number | string;
  accent:  string;
  sub?:    string;
}

function StatCard({ icon, label, value, accent, sub }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl shrink-0 ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tabular-nums">
          {value}
        </p>
        <p className="text-sm text-gray-500 dark:text-zinc-400 truncate">{label}</p>
        {sub && (
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{sub}</p>
        )}
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

function formatRelative(isoStr: string | null): string {
  if (!isoStr) return 'nunca';
  try {
    const diff = Date.now() - new Date(isoStr).getTime();
    const min  = Math.floor(diff / 60_000);
    if (min < 1)   return 'agora mesmo';
    if (min < 60)  return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)    return `há ${h}h`;
    const d = Math.floor(h / 24);
    return `há ${d} dia${d !== 1 ? 's' : ''}`;
  } catch {
    return isoStr;
  }
}

// ── Página principal ─────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['stats'],
    queryFn:  getStats,
    refetchInterval: 60_000, // atualiza a cada minuto
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

  return (
    <div className="page-container">

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Os arquivos são recebidos automaticamente na pasta configurada.
            Clique em <strong className="font-medium text-gray-700 dark:text-zinc-300">Sincronizar pasta</strong> para atualizar a base.
          </p>
        </div>

        <button
          className="btn-outline shrink-0"
          onClick={() => syncMut.mutate()}
          disabled={syncMut.isPending}
          title="Importa o arquivo XLSX mais recente da pasta configurada no servidor"
        >
          <ArrowsClockwise
            size={15}
            className={syncMut.isPending ? 'animate-spin' : ''}
          />
          {syncMut.isPending ? 'Sincronizando…' : 'Sincronizar pasta'}
        </button>
      </div>

      {/* ── Stat cards — linha 1 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
              label="Prontas para gerar"
              value={stats?.withData ?? 0}
              accent="bg-green-50 dark:bg-green-900/30"
              sub="com Nome Sócio e CPF"
            />
            <StatCard
              icon={<Clock size={22} weight="fill" className="text-amber-600 dark:text-amber-400" />}
              label="Pendentes"
              value={stats?.pending ?? 0}
              accent="bg-amber-50 dark:bg-amber-900/30"
              sub="aguardando preenchimento"
            />
            <StatCard
              icon={<Files size={22} weight="fill" className="text-purple-600 dark:text-purple-400" />}
              label="Documentos gerados"
              value={stats?.totalDocuments ?? 0}
              accent="bg-purple-50 dark:bg-purple-900/30"
              sub={`${stats?.docsThisMonth ?? 0} este mês`}
            />
          </>
        )}
      </div>

      {/* ── Stat cards — linha 2 (info de sincronização) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {isLoading ? (
          [...Array(2)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            {stats?.lastFile && (
              <div className="card flex items-center gap-3 py-3">
                <FileXls size={20} weight="duotone" className="text-green-600 dark:text-green-400 shrink-0" />
                <div className="text-sm min-w-0">
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-0.5">Último arquivo importado</p>
                  <p className="font-medium text-gray-800 dark:text-zinc-200 truncate">{stats.lastFile}</p>
                </div>
              </div>
            )}
            <div className="card flex items-center gap-3 py-3">
              <CalendarBlank size={20} weight="duotone" className="text-brand-600 dark:text-brand-400 shrink-0" />
              <div className="text-sm">
                <p className="text-xs text-gray-400 dark:text-zinc-500 mb-0.5">Última sincronização</p>
                <p className="font-medium text-gray-800 dark:text-zinc-200">
                  {formatRelative(stats?.lastSync ?? null)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

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
                Ver pendentes
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {stats?.pending ?? '…'} empresa{stats?.pending !== 1 ? 's' : ''} aguardando dados
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
                Prontas para gerar
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                {stats?.withData ?? '…'} empresa{stats?.withData !== 1 ? 's' : ''} com dados completos
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
