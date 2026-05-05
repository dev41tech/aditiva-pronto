import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlass, ArrowRight, CheckCircle, Clock,
  Buildings, X,
} from '@phosphor-icons/react';
import { listCompanies } from '../services/api';
import { maskCNPJ } from '../utils/validators';
import type { Company, CompanyStatus } from '../types';

const LIMIT = 20;

const STATUS_LABELS: Record<CompanyStatus, string> = {
  all:     'Todas',
  pending: 'Pendentes',
  ready:   'Prontas',
};

export default function Companies() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState(params.get('search') ?? '');
  const [status, setStatus] = useState<CompanyStatus>(
    (params.get('status') as CompanyStatus) ?? 'all',
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    const s = params.get('status') as CompanyStatus | null;
    if (s && s !== status) setStatus(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['companies', search, status, page],
    queryFn:  () => listCompanies({ search, status, page, limit: LIMIT }),
    placeholderData: (prev) => prev,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleStatusChange = (s: CompanyStatus) => {
    setStatus(s);
    setPage(1);
    setParams(s === 'all' ? {} : { status: s });
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Empresas</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
          {data?.total !== undefined
            ? `${data.total} empresa${data.total !== 1 ? 's' : ''} encontrada${data.total !== 1 ? 's' : ''}`
            : 'Carregando…'}
        </p>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none"
            />
            <input
              className="input pl-9 pr-8"
              placeholder="Buscar por Razão Social ou CNPJ…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
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
                    {company.complement_id ? (
                      <span className="badge-ready">
                        <CheckCircle size={11} weight="fill" />
                        Pronta
                      </span>
                    ) : (
                      <span className="badge-pending">
                        <Clock size={11} weight="fill" />
                        Pendente
                      </span>
                    )}
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
          <span className="text-gray-500 dark:text-zinc-400">
            Página {data.page} de {data.pages}
          </span>
          <div className="flex gap-2">
            <button
              className="btn-outline py-1.5 px-3 text-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <button
              className="btn-outline py-1.5 px-3 text-sm"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
