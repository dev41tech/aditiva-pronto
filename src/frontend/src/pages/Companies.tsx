import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlass, ArrowRight, ArrowLeft, CheckCircle, Clock,
  Buildings, X, User, UsersThree, Prohibit,
} from '@phosphor-icons/react';
import {
  listCompanies,
  updateResponsavel as apiUpdateResponsavel,
  bulkUpdateResponsavelApi,
} from '../services/api';
import { maskCNPJ } from '../utils/validators';
import { useToast } from '../context/ToastContext';
import type { Company, CompanyStatus } from '../types';

const LIMIT = 20;

const RESPONSAVEIS = ['Colaboradora 1', 'Colaboradora 2', 'Colaboradora 3'];

const STATUS_LABELS: Record<CompanyStatus, string> = {
  all:     'Todas',
  pending: 'Pendentes',
  ready:   'Prontas',
  inativo: 'Inativas',
};

// ── Status badge ──────────────────────────────────────────────────

function StatusBadge({ company }: { company: Company }) {
  if (company.inativo) {
    return (
      <span className="badge-inativo">
        <Prohibit size={11} weight="fill" />
        Inativa
      </span>
    );
  }
  if (company.complement_id) {
    return (
      <span className="badge-ready">
        <CheckCircle size={11} weight="fill" />
        Pronta
      </span>
    );
  }
  return (
    <span className="badge-pending">
      <Clock size={11} weight="fill" />
      Pendente
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function Companies() {
  const navigate          = useNavigate();
  const qc                = useQueryClient();
  const { toast }         = useToast();
  const [params, setParams] = useSearchParams();

  // ── URL state ─────────────────────────────────────────────────
  const search           = params.get('search')      ?? '';
  const status           = (params.get('status')     ?? 'all') as CompanyStatus;
  const page             = Math.max(1, parseInt(params.get('page') ?? '1') || 1);
  const responsavelFilter = params.get('responsavel') ?? '';

  // ── Local state ───────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(search);
  const [pageInput,   setPageInput]   = useState(String(page));
  const [currentUser, setCurrentUser] = useState(
    () => localStorage.getItem('aditiva_current_user') ?? '',
  );

  // Mass assignment
  const [assignOpen,     setAssignOpen]     = useState(false);
  const [assignUser,     setAssignUser]     = useState('');
  const [assignFromPage, setAssignFromPage] = useState('1');
  const [assignToPage,   setAssignToPage]   = useState('1');
  const [isAssigning,    setIsAssigning]    = useState(false);

  // Sync pageInput when URL page changes (Anterior / Próxima)
  useEffect(() => { setPageInput(String(page)); }, [page]);

  // Persist current user to localStorage
  useEffect(() => {
    if (currentUser) localStorage.setItem('aditiva_current_user', currentUser);
    else             localStorage.removeItem('aditiva_current_user');
  }, [currentUser]);

  // ── Query ─────────────────────────────────────────────────────
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['companies', search, status, page, responsavelFilter],
    queryFn:  () =>
      listCompanies({
        search,
        status,
        page,
        limit: LIMIT,
        responsavel: responsavelFilter || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  // ── Mutations ─────────────────────────────────────────────────
  const assignMut = useMutation({
    mutationFn: ({ id, responsavel }: { id: string; responsavel: string | null }) =>
      apiUpdateResponsavel(id, responsavel),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
    onError:   (e: Error) => toast(e.message, 'error'),
  });

  // ── URL helpers ───────────────────────────────────────────────
  function setParam(key: string, value: string | null, resetPage = true) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value) next.delete(key);
      else        next.set(key, value);
      if (resetPage && key !== 'page') next.delete('page');
      return next;
    });
  }

  function goToPage(n: number) {
    const clamped = Math.max(1, Math.min(n, data?.pages ?? 1));
    setParam('page', String(clamped), false);
  }

  // ── Handlers ─────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam('search', searchInput.trim() || null);
  };

  const clearSearch = () => {
    setSearchInput('');
    setParam('search', null);
  };

  const handleStatusChange = (s: CompanyStatus) => {
    setParam('status', s === 'all' ? null : s);
  };

  const handleResponsavelFilter = (v: string) => {
    setParam('responsavel', v || null);
  };

  const handlePageInputGo = () => {
    const n = parseInt(pageInput);
    if (!n || isNaN(n)) { setPageInput(String(page)); return; }
    goToPage(n);
  };

  const handleQuickAssign = (id: string, responsavel: string | null) => {
    assignMut.mutate({ id, responsavel });
  };

  const handleMassAssign = async () => {
    if (!assignUser) { toast('Selecione um responsável.', 'error'); return; }

    const from  = Math.max(1, parseInt(assignFromPage) || 1);
    const to    = Math.max(from, parseInt(assignToPage) || from);
    const toC   = Math.min(to, data?.pages ?? 1);
    const batchLimit = (toC - from + 1) * LIMIT;

    setIsAssigning(true);
    try {
      const result = await listCompanies({
        search,
        status,
        responsavel: responsavelFilter || undefined,
        page:        from,
        limit:       batchLimit,
      });

      const ids = result.data.map((c: Company) => c.id);
      if (ids.length === 0) {
        toast('Nenhuma empresa encontrada nesse intervalo.', 'info');
        return;
      }

      const value = assignUser === '__clear__' ? null : assignUser;
      const { affected } = await bulkUpdateResponsavelApi(ids, value);
      toast(
        `${affected} empresa(s) ${value ? `atribuída(s) a ${value}` : 'com responsável removido'}.`,
        'success',
      );
      qc.invalidateQueries({ queryKey: ['companies'] });
      setAssignOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro ao atribuir responsável.', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Empresas</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            {data?.total !== undefined
              ? `${data.total} empresa${data.total !== 1 ? 's' : ''} encontrada${data.total !== 1 ? 's' : ''}`
              : 'Carregando…'}
          </p>
        </div>

        {/* Usuário atual */}
        <div className="flex items-center gap-2 shrink-0">
          <User size={15} className="text-gray-400 dark:text-zinc-500" />
          <select
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value)}
            className="input py-1.5 text-sm min-w-[160px]"
            aria-label="Usuário atual"
          >
            <option value="">Selecione usuário…</option>
            {RESPONSAVEIS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* ── Filtros — linha 1: busca + status ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none"
            />
            <input
              className="input pl-9 pr-8"
              placeholder="Buscar por Razão Social ou CNPJ…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2
                           text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary">Buscar</button>
        </form>

        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 shrink-0">
          {(Object.keys(STATUS_LABELS) as CompanyStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                status === s
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filtros — linha 2: responsável + atribuição em massa ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-zinc-400 whitespace-nowrap">
            Responsável:
          </label>
          <select
            value={responsavelFilter}
            onChange={(e) => handleResponsavelFilter(e.target.value)}
            className="input py-1.5 text-sm"
            aria-label="Filtrar por responsável"
          >
            <option value="">Todos</option>
            {RESPONSAVEIS.map((r) => <option key={r} value={r}>{r}</option>)}
            <option value="__none__">Sem responsável</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setAssignOpen((v) => !v)}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            assignOpen
              ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300'
              : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
          }`}
        >
          <UsersThree size={15} />
          Atribuição em Massa
        </button>
      </div>

      {/* ── Painel: Atribuição em Massa ── */}
      {assignOpen && (
        <div className="card mb-5 border-brand-200 dark:border-brand-800/50">
          <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <UsersThree size={16} className="text-brand-600 dark:text-brand-400" />
            Atribuição em Massa
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-zinc-400">Atribuir responsável</label>
              <select
                value={assignUser}
                onChange={(e) => setAssignUser(e.target.value)}
                className="input py-1.5 text-sm min-w-[180px]"
              >
                <option value="">Selecione…</option>
                {RESPONSAVEIS.map((r) => <option key={r} value={r}>{r}</option>)}
                <option value="__clear__">— Remover responsável —</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-zinc-400">Da página</label>
              <input
                type="number"
                min={1}
                max={data?.pages ?? 1}
                value={assignFromPage}
                onChange={(e) => setAssignFromPage(e.target.value)}
                className="input py-1.5 text-sm w-20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-zinc-400">Até página</label>
              <input
                type="number"
                min={1}
                max={data?.pages ?? 1}
                value={assignToPage}
                onChange={(e) => setAssignToPage(e.target.value)}
                className="input py-1.5 text-sm w-20"
              />
            </div>
            {data?.pages && (
              <p className="text-xs text-gray-400 dark:text-zinc-500 self-end pb-2">
                Páginas 1–{data.pages} · {LIMIT} empresas/página
              </p>
            )}
            <button
              type="button"
              className="btn-primary self-end"
              disabled={!assignUser || isAssigning}
              onClick={handleMassAssign}
            >
              {isAssigning ? 'Aplicando…' : 'Aplicar atribuição'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tabela ── */}
      <div className={`card p-0 overflow-hidden transition-opacity ${isFetching ? 'opacity-70' : ''}`}>
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-4 flex-1 bg-gray-100 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-32 bg-gray-100 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-20 bg-gray-100 dark:bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="py-16 px-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Buildings size={26} className="text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="font-medium text-gray-600 dark:text-zinc-300 mb-1">
              Nenhuma empresa encontrada
            </p>
            <p className="text-sm text-gray-400 dark:text-zinc-500 mb-4">
              {search ? `Sem resultados para "${search}"` : 'Importe uma planilha para começar'}
            </p>
            {search && (
              <button className="btn-ghost text-sm" onClick={clearSearch}>
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="table-head text-left">Razão Social</th>
                <th className="table-head text-left">CNPJ</th>
                <th className="table-head text-left">Status</th>
                <th className="table-head text-left">Responsável</th>
                <th className="table-head" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((company: Company) => (
                <tr
                  key={company.id}
                  className="table-row"
                  onClick={() => navigate(`/empresas/${company.id}`)}
                >
                  <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-zinc-100">
                    {company.razao_social}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-zinc-400 tabular-nums">
                    {maskCNPJ(company.cnpj)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge company={company} />
                  </td>
                  {/* Clique na célula de responsável não navega para detalhe */}
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={company.responsavel ?? ''}
                      onChange={(e) => handleQuickAssign(company.id, e.target.value || null)}
                      className="text-xs rounded-md px-2 py-1
                                 border border-transparent
                                 hover:border-gray-300 dark:hover:border-zinc-600
                                 focus:outline-none focus:border-brand-400 dark:focus:border-brand-600
                                 bg-transparent focus:bg-white dark:focus:bg-zinc-800
                                 text-gray-600 dark:text-zinc-300
                                 transition-colors cursor-pointer"
                    >
                      <option value="">Sem responsável</option>
                      {RESPONSAVEIS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ArrowRight size={15} className="text-gray-300 dark:text-zinc-600 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Paginação ── */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-zinc-400">Página</span>
            <input
              type="number"
              min={1}
              max={data.pages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputGo}
              onKeyDown={(e) => { if (e.key === 'Enter') handlePageInputGo(); }}
              className="input py-1 px-2 text-sm text-center w-16 tabular-nums"
              aria-label="Número da página"
            />
            <span className="text-gray-500 dark:text-zinc-400">de {data.pages}</span>
            <button
              type="button"
              className="btn-outline py-1 px-2.5 text-sm"
              onClick={handlePageInputGo}
            >
              Ir
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-outline py-1.5 px-3 text-sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ArrowLeft size={13} />
              Anterior
            </button>
            <button
              className="btn-outline py-1.5 px-3 text-sm"
              disabled={page >= data.pages}
              onClick={() => goToPage(page + 1)}
            >
              Próxima
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
