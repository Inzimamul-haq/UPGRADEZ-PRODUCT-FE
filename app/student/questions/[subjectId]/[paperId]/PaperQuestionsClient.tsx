"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { MarkTypeFilter } from '@/components/questions/MarkTypeFilter';
import { QuestionRow } from '@/components/questions/QuestionRow';
import { Question } from '@/lib/types';

export function PaperQuestionsClient({ subjectId, paperId, subjectName, examType, academicYear, questions }: any) {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 pb-24 w-full">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()}>
          <ChevronLeft size={16} className="text-[#8C8C8A]" />
        </button>
        <span className="text-[12px] text-[#8C8C8A]">Papers</span>
      </div>

      <div>
        <h1 className="text-[16px] font-medium text-[#ECECEA]">
          {subjectName} — {examType} {academicYear}
        </h1>
      </div>

      <div className="mt-4 flex flex-col">
        {questions.map((q: Question, i: number) => (
          <QuestionRow key={q.id} question={q} index={i + 1} />
        ))}
        {questions.length === 0 && (
          <p className="text-[13px] text-[#8C8C8A] mt-4">No questions found.</p>
        )}
      </div>

      <div className="mt-12 flex justify-center pb-8">
        <button 
          onClick={() => router.push(`/chat/new?paperId=${paperId}&subjectId=${subjectId}&examType=${encodeURIComponent(examType)}&mode=study-paper`)}
          className="text-[14px] text-[#1C1C1B] bg-[#ECECEA] border border-[#ECECEA] font-medium rounded-lg px-6 py-2.5 hover:bg-white transition-colors duration-150 flex items-center gap-2"
        >
          Study this paper in chat &rarr;
        </button>
      </div>
    </div>
  );
}
