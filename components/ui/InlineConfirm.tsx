"use client";

import { InlineConfirmProps } from '@/lib/types';
import React, { useEffect } from 'react';

export function InlineConfirm({ message, confirmLabel, onConfirm, onCancel }: InlineConfirmProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onCancel();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onCancel]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] text-[#8C8C8A]">{message}</span>
      <button onClick={onConfirm} className="text-[13px] text-red-400 hover:text-red-300 transition-colors">
        {confirmLabel}
      </button>
      <button onClick={onCancel} className="text-[13px] text-[#5A5A58] hover:text-[#8C8C8A] transition-colors">
        Cancel
      </button>
    </div>
  );
}
