"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ExamTypeTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export function ExamTypeTabs({ activeTab, onChange }: ExamTypeTabsProps) {
  const { user } = useAuth();
  const isEngineering = user?.college?.name?.toLowerCase().includes('engineering') ?? true;
  
  const TABS = isEngineering 
    ? ['CAT 1', 'CAT 2', 'Model', 'University']
    : ['CIA 1', 'CIA 2', 'Model', 'University'];

  // Map internal activeTab (which might still be CAT 1 due to DB) to the display version
  // If activeTab is 'CAT 1' but we are not engineering, we should maybe display 'CIA 1'
  return (
    <div className="flex gap-6 border-b border-[#2E2E2C]">
      {TABS.map(tab => {
        // Because backend/db might still store CAT1/CAT2, activeTab passed down might be CAT 1
        // even for Arts colleges if they click it, so let's normalize check
        const normalizedTab = tab.replace('CIA', 'CAT');
        const isActive = activeTab === tab || activeTab === normalizedTab;
        
        return (
          <button
            key={tab}
            onClick={() => {
              // We pass the display string up, the parent components handle mapping to DB format
              onChange(tab);
            }}
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
