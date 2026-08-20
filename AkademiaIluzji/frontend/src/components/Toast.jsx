import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info, Sparkles, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border border-white/10 shadow-2xl bg-zinc-900/95 text-white backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
            
            <div className="text-sm font-medium leading-tight">
              {toast.message}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {toast.xp > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Sparkles className="w-3 h-3 text-amber-400" />
                +{toast.xp} XP
              </span>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
