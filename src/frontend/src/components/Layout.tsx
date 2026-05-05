import { Outlet, NavLink } from 'react-router-dom';
import { House, Buildings } from '@phosphor-icons/react';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from './ThemeToggle';

export default function Layout() {
  const { theme, toggle } = useTheme();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'
        : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">

      {/* ── Top Header ────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 flex items-center px-5 gap-4 z-10">
        {/* Logo + nome */}
        <div className="flex items-center gap-3">
          <img
            src="/favicon.png"
            alt="41 Tech"
            className="h-7 w-7 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="leading-none">
            <span className="font-bold text-gray-900 dark:text-zinc-100 text-base tracking-tight">
              Aditiva Pronto
            </span>
            <span className="block text-[10px] text-gray-400 dark:text-zinc-500 font-medium tracking-widest uppercase">
              41 Tech
            </span>
          </div>
        </div>

        <div className="flex-1" />

        <ThemeToggle theme={theme} onToggle={toggle} />
      </header>

      {/* ── Body (sidebar + main) ──────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside className="w-52 shrink-0 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 flex flex-col">
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
            <NavLink to="/" end className={navClass}>
              <House size={17} weight="duotone" />
              Dashboard
            </NavLink>
            <NavLink to="/empresas" className={navClass}>
              <Buildings size={17} weight="duotone" />
              Empresas
            </NavLink>
          </nav>

          <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800">
            <p className="text-[11px] text-gray-400 dark:text-zinc-600">
              41 Tech © {new Date().getFullYear()}
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
