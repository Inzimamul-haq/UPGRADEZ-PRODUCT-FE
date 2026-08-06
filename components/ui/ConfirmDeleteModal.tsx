"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (secret?: string) => void;
  title: string;
  description: string;
  loading?: boolean;
  requireSecret?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  loading = false,
  requireSecret = false,
}: ConfirmDeleteModalProps) {
  const [secret, setSecret] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(requireSecret ? secret : undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-[#2C2C2A] shadow-2xl">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          
          <h2 className="mb-2 text-xl font-bold text-[#ECECEA]">{title}</h2>
          <p className="mb-6 text-sm text-[#8C8C8A]">{description}</p>
          
          {requireSecret && (
            <div className="mb-6 text-left">
              <label className="mb-2 block text-sm font-medium text-[#ECECEA]">
                Super Admin Secret
              </label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter secret to confirm"
                className="w-full rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-3 text-[#ECECEA] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg bg-[#3A3A38] py-3 text-sm font-medium text-[#ECECEA] transition-colors hover:bg-[#4A4A48] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || (requireSecret && !secret)}
              className="flex-1 rounded-lg bg-red-500 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
