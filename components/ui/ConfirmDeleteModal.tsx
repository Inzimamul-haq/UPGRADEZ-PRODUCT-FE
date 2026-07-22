"use client";

import React from "react";

interface ConfirmDeleteModalProps {
  name: string;
  entityLabel?: string; // e.g. "Student", "Faculty"
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function ConfirmDeleteModal({
  name,
  entityLabel = "item",
  onConfirm,
  onClose,
  loading = false,
}: ConfirmDeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-xl">
        <h2 className="mb-2 text-[14px] font-medium text-[#ECECEA]">
          Delete {entityLabel}
        </h2>
        <p className="text-[13px] text-[#8C8C8A]">
          Delete <span className="text-[#ECECEA]">{name}</span>? This cannot be
          undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[13px] text-[#8C8C8A] hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-2 text-[13px] text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
