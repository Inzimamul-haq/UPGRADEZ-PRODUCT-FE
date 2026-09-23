"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Paper } from '@/lib/types';
import { ChevronRight } from 'lucide-react';

interface PaperRowProps {
  paper: Paper;
  kind?: 'important_questions' | 'exam_paper';
  subjectId: string;
}



export function PaperRow({ paper, kind, subjectId }: PaperRowProps) {
  const router = useRouter();
  const pathname = usePathname();

  const section = (paper as any).paperAssignments?.[0]?.assignedToSection;

  return (
    <div 
      onClick={() => router.push(`${pathname}/${paper.id}?kind=${paper.kind}`)}
      className="flex items-center justify-between bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-4 py-3 mb-2 cursor-pointer hover:bg-[#333331] transition-colors duration-150"
    >
      <div>
        <p className="text-[14px] font-medium text-[#ECECEA]">
          {paper.academic_year}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="inline-block text-[11px] text-[#8C8C8A] border border-[#3A3A38] rounded px-2 py-0.5">
            {paper.kind === 'IMPORTANT_QUESTIONS' ? 'Important Questions' : paper.kind === 'TOPIC_ASSIGNMENT' ? 'Important Topics' : 'Exam Paper'}
          </span>
          <span className="inline-block text-[11px] text-[#8C8C8A] border border-[#3A3A38] rounded px-2 py-0.5">
            {paper.source === 'historical' ? 'Previous year' : 'This year'}
          </span>
          {section && (
            <span className="inline-block text-[11px] text-[#8C8C8A] border border-[#3A3A38] rounded px-2 py-0.5">
              Section {section}
            </span>
          )}
          {(paper as any).creator?.name && (
            <span className="text-[11px] text-[#8C8C8A]">
              By {(paper as any).creator.name}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-[#5A5A58]" />
    </div>
  );
}