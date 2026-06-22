"use client";

import React from 'react';
import { ToastProviderCore, useToast } from '@/context/ToastContext';
import { CheckCircle, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

function ToastContainer() {
  const { toasts } = useToast();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-4 py-3 flex items-center gap-2.5 min-w-[260px] animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
          {toast.type === 'success' ? (
            <CheckCircle size={14} className="text-[#8C8C8A]" />
          ) : (
            <XCircle size={14} className="text-red-400" />
          )}
          <span className="text-[13px] text-[#ECECEA]">{toast.message}</span>
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
