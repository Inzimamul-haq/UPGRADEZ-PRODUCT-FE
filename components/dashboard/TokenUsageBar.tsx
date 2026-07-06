import { TokenUsageBarProps } from '@/lib/types';
import React from 'react';

export function TokenUsageBar({ used, limit, showLabel }: TokenUsageBarProps) {
  const pct = Math.min((used / limit) * 100, 100);
  const isWarning = pct > 90;

  const formatK = (num: number) => `${Math.floor(num / 1000)}k`;

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-[12px] text-[#8C8C8A]">Token Usage</span>
          <span className="text-[12px] text-[#5A5A58]">
            {formatK(used)} / {formatK(limit)}
          </span>
        </div>
      )}
      <div className="h-1.5 bg-[#3A3A38] rounded-full w-full">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isWarning ? 'bg-red-400' : 'bg-[#ECECEA]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isWarning && (
        <p className="text-[11px] text-red-400 mt-1">Approaching limit</p>
      )}
    </div>
  );
}
