import React from 'react';
import { StatCardProps } from '@/lib/types';

export function StatCard({ value, label, subtext, valueColor }: StatCardProps) {
  return (
    <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-2 sm:px-4 py-2.5 sm:py-4 min-h-[64px] sm:min-h-[96px] flex flex-col justify-center">
      <p className={`text-[18px] sm:text-[24px] font-medium truncate ${valueColor ?? 'text-[#ECECEA]'}`}>
        {value}
      </p>
      <p className="text-[10px] sm:text-[12px] text-[#8C8C8A] mt-0.5 truncate">
        {label}
      </p>
      {subtext && (
        <p className="text-[9px] sm:text-[11px] text-[#5A5A58] mt-0.5 sm:mt-1 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
}