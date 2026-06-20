"use client";

import React, { useState } from 'react';
import { ChevronLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ExamTypeTabs } from '@/components/questions/ExamTypeTabs';
import { PaperRow } from '@/components/questions/PaperRow';
import { EmptyState } from '@/components/ui/EmptyState';

export function SubjectPapersClient({ subjectId, subjectName, subjectCode, papers }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('CAT 1');

  const filtered = papers.filter((p: any) => p.exam_type === activeTab);

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 w-full">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()}>
          <ChevronLeft size={16} className="text-[#8C8C8A]" />
        </button>
        <span className="text-[12px] text-[#8C8C8A]">Questions</span>
      </div>

      <div>
        <h1 className="text-[16px] font-medium text-[#ECECEA]">{subjectName}</h1>
        <p className="text-[12px] text-[#8C8C8A] mt-0.5">{subjectCode}</p>
      </div>

      <div className="mt-4">
        <ExamTypeTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="mt-3">
        {filtered.map((p: any) => (
          <PaperRow key={p.id} paper={p} subjectId={subjectId} />
        ))}
        {filtered.length === 0 && (
          <EmptyState 
            icon={FileText}
            heading="No papers yet"
            subtext="No question papers for this exam type" 
          />
        )}
      </div>
    </div>
  );
}
