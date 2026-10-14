import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import type { ToastType, ToastItem } from '../../stores/uiStore';
export { useToast } from '../../hooks/useToast';
export type { ToastType };
export type Toast = ToastItem;

export function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        const config = {
          success: {
            icon: <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />,
            border: 'border-emerald-500/30',
            bg: 'bg-zinc-900/95',
            glow: 'shadow-emerald-950/40',
            badge: 'bg-emerald-500/10 text-emerald-400',
          },
          error: {
            icon: <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />,
            border: 'border-rose-500/30',
            bg: 'bg-zinc-900/95',
            glow: 'shadow-rose-950/40',
            badge: 'bg-rose-500/10 text-rose-400',
          },
          warning: {
            icon: <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />,
            border: 'border-amber-500/30',
            bg: 'bg-zinc-900/95',
            glow: 'shadow-amber-950/40',
            badge: 'bg-amber-500/10 text-amber-400',
          },
          info: {
            icon: <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />,
            border: 'border-blue-500/30',
            bg: 'bg-zinc-900/95',
            glow: 'shadow-blue-950/40',
            badge: 'bg-blue-500/10 text-blue-400',
          },
        }[t.type];

        return (
          <div
            key={t.id}
            role="status"
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
              aria-label="Dismiss notification"
              className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors p-1 rounded-md"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
