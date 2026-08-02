import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#3A3A38] bg-[#1A1A19] shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#2E2E2C]">
          <h2 className="text-[16px] font-medium text-[#ECECEA] flex items-center gap-2">
            {isDestructive && <AlertTriangle size={18} className="text-red-400" />}
            {title}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#5A5A58] hover:text-[#ECECEA] transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="text-[14px] text-[#8C8C8A] leading-relaxed">
            {message}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2E2E2C] bg-[#222221] rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-[13px] font-medium text-[#ECECEA] bg-transparent hover:bg-[#333331] rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
              isDestructive
                ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                : 'bg-amber-400/10 text-amber-400 border border-amber-400/20 hover:bg-amber-400/20'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
