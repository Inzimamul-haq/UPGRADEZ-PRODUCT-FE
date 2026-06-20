"use client";

import React from 'react';

interface ExamTypeTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

const TABS = ['CAT 1', 'CAT 2', 'Model', 'University'];

export function ExamTypeTabs({ activeTab, onChange }: ExamTypeTabsProps) {
  return (
    <div className="flex gap-6 border-b border-[#2E2E2C]">
      {TABS.map(tab => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`pb-2 text-[14px] transition-colors duration-150 ${
              isActive 
                ? 'border-b-2 border-[#ECECEA] text-[#ECECEA]' 
                : 'text-[#8C8C8A] hover:text-[#ECECEA]'
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
