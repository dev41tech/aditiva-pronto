import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, ArrowRight, CheckCircle, Clock } from '@phosphor-icons/react';
import { listCompanies } from '../services/api';
import { maskCNPJ } from '../utils/validators';
import type { Company, CompanyStatus } from '../types';

const LIMIT = 20;

const statusLabels: Record<CompanyStatus, string> = {
  all: 'Todas',
  pending: 'Pendentes',
  ready: 'Prontas',
};

export default function Companies() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState(params.get('search') ?? '');
  const [status, setStatus] = useState<CompanyStatus>(
    (params.get('status') as CompanyStatus) ?? 'all',
  );
  const [page, setPage] = useState(1);

  // Sync URL params → state on mount
  useEffect(() => {
    const s = params.get('status') as CompanyStatus | null;
    if (s && s !== status) setStatus(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['companies', search, status, page],
    queryFn: () => listCompanies({ search, status, page, limit: LIMIT }),
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

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data?.total ?? '…'} empresa(s) encontrada(s)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              className="input pl-9"
              placeholder="Buscar por Razão Social ou CNPJ…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">Buscar</button>
        </form>

        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {(Object.keys(statusLabels) as CompanyStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                status === s
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className={`transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando…</div>
          ) : !data?.data.length ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-sm">Nenhuma empresa encontrada.</p>
              {search && (
                <button
                  className="mt-2 text-blue-600 text-sm hover:underline"
                  onClick={() => { setSearch(''); setPage(1); }}
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-medium text-gray-500">Razão Social</th>
                  <th className="px-5 py-3 font-medium text-gray-500">CNPJ</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((company: Company) => (
                  <tr
                    key={company.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/empresas/${company.id}`)}
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {company.razao_social}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 tabular-nums">
                      {maskCNPJ(company.cnpj)}
                    </td>
                    <td className="px-5 py-3.5">
                      {company.complement_id ? (
                        <span className="badge-ready flex items-center gap-1 w-fit">
                          <CheckCircle size={11} weight="fill" />
                          Pronta
                        </span>
                      ) : (
                        <span className="badge-pending flex items-center gap-1 w-fit">
                          <Clock size={11} weight="fill" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ArrowRight size={16} className="text-gray-300 ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            Página {data.page} de {data.pages}
          </span>
          <div className="flex gap-2">
            <button
              className="btn-ghost py-1.5 px-3"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </button>
            <button
              className="btn-ghost py-1.5 px-3"
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
