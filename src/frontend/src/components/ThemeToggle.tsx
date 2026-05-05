import { Sun, Moon } from '@phosphor-icons/react';
import type { Theme } from '../hooks/useTheme';

interface Props {
  theme:    Theme;
  onToggle: () => void;
  size?:    'sm' | 'md';
}

export function ThemeToggle({ theme, onToggle, size = 'md' }: Props) {
  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <button
      onClick={onToggle}
      className={`rounded-lg transition-colors
        text-gray-500 dark:text-zinc-400
        hover:bg-gray-100 dark:hover:bg-zinc-800
        focus:outline-none focus:ring-2 focus:ring-brand-500
        ${size === 'sm' ? 'p-1.5' : 'p-2'}`}
      aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
    >
      {theme === 'dark'
        ? <Sun  size={iconSize} weight="bold" />
        : <Moon size={iconSize} weight="bold" />}
    </button>
  );
}
