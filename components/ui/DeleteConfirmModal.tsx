"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Clean modal dialog for destructive delete confirmations.
 * Replaces window.confirm() / InlineConfirm for subject deletion.
 */
export function DeleteConfirmModal({
  open,
  title,
  description = "This action cannot be undone.",
  isDeleting = false,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-2xl">
        {/* Icon + Title */}
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-[14px] font-medium text-[#ECECEA]">{title}</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-[#8C8C8A]">
              {description}
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="mb-5 border-t border-[#2A2A28]" />

        {/* Actions */}
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg border border-[#3A3A38] px-4 py-2 text-[13px] text-[#B0B0AE] transition-colors hover:bg-[#2C2C2A] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-[13px] text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
