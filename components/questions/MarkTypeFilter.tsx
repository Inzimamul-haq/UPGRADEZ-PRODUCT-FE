"use client";

import React from 'react';

interface MarkTypeFilterProps {
  active: string;
  onChange: (type: string) => void;
}

const TYPES = ['All', '2M', '5M', '13M'];

export function MarkTypeFilter({ active, onChange }: MarkTypeFilterProps) {
  return (
    <div className="flex gap-2">
      {TYPES.map(type => {
        const isActive = active === type;
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`rounded px-3 py-1 text-[13px] cursor-pointer transition-colors duration-150 ${
              isActive 
                ? 'bg-[#2C2C2A] border border-[#ECECEA] text-[#ECECEA]' 
                : 'border border-[#3A3A38] text-[#8C8C8A] hover:bg-[#333331]'
            }`}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
}
