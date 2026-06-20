import React from 'react';

interface StatCardProps {
  value: string | number;
  label: string;
  subtext?: string;
  valueColor?: string;
}

export function StatCard({ value, label, subtext, valueColor }: StatCardProps) {
  return (
    <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-4 py-4">
      <p className={`text-[24px] font-medium ${valueColor ?? 'text-[#ECECEA]'}`}>
        {value}
      </p>
      <p className="text-[12px] text-[#8C8C8A] mt-0.5">{label}</p>
      {subtext && (
        <p className="text-[11px] text-[#5A5A58] mt-1">{subtext}</p>
      )}
    </div>
  );
}
