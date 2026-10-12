import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  showToast: (type: ToastType, message: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const showToast = useCallback((type: ToastType, message: string) => {
    addToast(message, type);
  }, [addToast]);

  const success = useCallback((message: string, title?: string) => addToast(message, 'success', title), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast(message, 'error', title), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast(message, 'warning', title), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast(message, 'info', title), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, showToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const config = {
            success: {
              icon: <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />,
              border: 'border-emerald-500/30',
              bg: 'bg-zinc-900/95',
              glow: 'shadow-emerald-950/40',
            },
            error: {
              icon: <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />,
              border: 'border-rose-500/30',
              bg: 'bg-zinc-900/95',
              glow: 'shadow-rose-950/40',
            },
            warning: {
              icon: <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />,
              border: 'border-amber-500/30',
              bg: 'bg-zinc-900/95',
              glow: 'shadow-amber-950/40',
            },
            info: {
              icon: <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />,
              border: 'border-blue-500/30',
              bg: 'bg-zinc-900/95',
              glow: 'shadow-blue-950/40',
            },
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${config.border} ${config.bg} backdrop-blur-md shadow-xl ${config.glow} transition-all duration-300 animate-in fade-in slide-in-from-top-3`}
            >
              {config.icon}
              <div className="flex-1 min-w-0 pr-1">
                {t.title && (
                  <h4 className="text-xs font-semibold text-zinc-100 mb-0.5">{t.title}</h4>
                )}
                <p className="text-xs text-zinc-300 leading-relaxed break-words">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
