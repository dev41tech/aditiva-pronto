import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from 'react';
import { X, CheckCircle, Warning, Info } from '@phosphor-icons/react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id:      number;
  message: string;
  type:    ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let _nextId = 0;

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} weight="fill" />,
  error:   <Warning     size={18} weight="fill" />,
  info:    <Info        size={18} weight="fill" />,
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-green-600  border-green-500',
  error:   'bg-red-600    border-red-500',
  info:    'bg-zinc-800   border-zinc-700  dark:bg-zinc-700',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 5000);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-label="Notificações"
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-full max-w-sm"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg
              text-sm font-medium text-white
              ${COLORS[t.type]}
              animate-in slide-in-from-right-4 duration-200`}
          >
            <span className="shrink-0 mt-px">{ICONS[t.type]}</span>
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 ml-1 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
