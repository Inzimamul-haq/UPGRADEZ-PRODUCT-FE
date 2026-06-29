"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ExamTypeTabs } from '@/components/questions/ExamTypeTabs';
import { PaperRow } from '@/components/questions/PaperRow';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';

export function SharedSubjectPapers({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('CAT 1');
  const [papers, setPapers] = useState<any[]>([]);
  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        // Fetch papers
        const { data } = await api.get(`/api/question-papers/${subjectId}/papers`);
        setPapers(data.papers || []);
        
        // Let's also fetch subject info. If there's an API for it, else just fallback
        try {
          const subRes = await api.get(`/api/subjects`);
          const found = subRes.data.subjects?.find((s: any) => s.id === subjectId);
          if (found) setSubject(found);
        } catch (e) {}

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPapers();
  }, [subjectId]);

  // Exam type is stored as CAT1, CAT2, MODEL, UNIVERSITY in DB according to prisma schema
  const formattedTab = activeTab.replace(/\s+/g, '').toUpperCase();
  const filtered = papers.filter((p: any) => p.examType === formattedTab);

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 w-full">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()}>
          <ChevronLeft size={16} className="text-[#8C8C8A]" />
        </button>
        <span className="text-[12px] text-[#8C8C8A]">Questions</span>
      </div>

      <div>
        <h1 className="text-[16px] font-medium text-[#ECECEA]">{subject?.name || 'Subject Details'}</h1>
        <p className="text-[12px] text-[#8C8C8A] mt-0.5">{subject?.code || ''}</p>
      </div>

      <div className="mt-4">
        <ExamTypeTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="py-12 border border-[#3A3A38] rounded-lg bg-[#1F1F1E] flex justify-center">
            <span className="text-[13px] text-[#5A5A58]">Loading papers...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState 
            icon={FileText}
            heading="No papers yet"
            subtext="No question papers for this exam type" 
          />
        ) : (
          filtered.map((p: any) => (
            <PaperRow key={p.id} paper={{...p, academic_year: p.academicYear, exam_type: p.examType}} subjectId={subjectId} />
          ))
        )}
      </div>
    </div>
  );
}
