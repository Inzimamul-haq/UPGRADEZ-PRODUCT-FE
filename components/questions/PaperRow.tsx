"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Paper } from '@/lib/types';
import { ChevronRight } from 'lucide-react';

interface PaperRowProps {
  paper: Paper;
  subjectId: string;
}

export function PaperRow({ paper, subjectId }: PaperRowProps) {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(`/student/questions/${subjectId}/${paper.id}`)}
      className="flex items-center justify-between bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-4 py-3 mb-2 cursor-pointer hover:bg-[#333331] transition-colors duration-150"
    >
      <div>
        <p className="text-[14px] font-medium text-[#ECECEA]">
          {paper.academic_year}
        </p>
        <span className="inline-block mt-1 text-[11px] text-[#8C8C8A] border border-[#3A3A38] rounded px-2 py-0.5">
          {paper.source === 'historical' ? 'Previous year' : 'This year'}
        </span>
      </div>
      <ChevronRight size={16} className="text-[#5A5A58]" />
    </div>
  );
}
