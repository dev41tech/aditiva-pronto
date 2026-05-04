import { Outlet, NavLink } from 'react-router-dom';
import { House, Buildings, FileText } from '@phosphor-icons/react';

export default function Layout() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText size={22} weight="duotone" className="text-blue-600" />
            <span className="font-semibold text-gray-900 leading-tight">
              Termos<br />
              <span className="text-blue-600">Aditivos</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <NavLink to="/" end className={navClass}>
            <House size={18} />
            Dashboard
          </NavLink>
          <NavLink to="/empresas" className={navClass}>
            <Buildings size={18} />
            Empresas
          </NavLink>
        </nav>

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">41 Contábil © 2025</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
