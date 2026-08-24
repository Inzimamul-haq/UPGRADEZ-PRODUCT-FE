"use client";

import React from 'react';
import { ToastProviderCore, useToast } from '@/context/ToastContext';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';

function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-start gap-3 min-w-[300px] max-w-[380px]
            rounded-xl border px-4 py-3 shadow-2xl
            backdrop-blur-sm
            animate-in slide-in-from-bottom-3 fade-in duration-300
            ${toast.type === 'success'
              ? 'bg-[#1a2a1a]/90 border-[#2a4a2a] text-[#ECECEA]'
              : 'bg-[#2a1a1a]/90 border-[#4a2a2a] text-[#ECECEA]'
            }
          `}
        >
          {/* Icon */}
          <div className="mt-0.5 shrink-0">
            {toast.type === 'success' ? (
              <CheckCircle2 size={15} className="text-emerald-400" />
            ) : (
              <XCircle size={15} className="text-red-400" />
            )}
          </div>

          {/* Message */}
          <span className="flex-1 text-[13px] leading-snug text-[#ECECEA]">
            {toast.message}
          </span>

          {/* Dismiss */}
          <button
            onClick={() => removeToast(toast.id)}
            className="mt-0.5 ml-2 flex-shrink-0 p-1 text-[#ECECEA] opacity-50 hover:opacity-100 hover:bg-[#3A3A38] rounded-md transition-all"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastProviderCore>
      {children}
      <ToastContainer />
    </ToastProviderCore>
  );
}
