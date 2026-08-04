"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ExamTypeTabs } from '@/components/questions/ExamTypeTabs';
import { PaperRow } from '@/components/questions/PaperRow';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';
export function SharedSubjectPapers({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('CAT 1');
  const [papers, setPapers] = useState<any[]>([]);
  const [studentPapers, setStudentPapers] = useState<{ currentYear: any[], previousYear: any[] } | null>(null);
  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const departmentId = searchParams.get('department');
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        // Fetch papers
        const { data } = await api.get(`/api/question-papers/${subjectId}/papers`, {
          params: departmentId ? { departmentId } : {},
        });
        
        if (data.papers) {
          setPapers(data.papers);
          setStudentPapers(null);
        } else {
          setStudentPapers({
            currentYear: data.currentYear || [],
            previousYear: data.previousYear || [],
          });
        }

        // Fetch subject info
        try {
          const subRes = await api.get(`/api/subjects`);
          const found = subRes.data.subjects?.find((s: any) => s.id === subjectId);
          if (found) setSubject(found);
        } catch (e) { }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPapers();
  }, [subjectId, departmentId]);

  // Exam type is stored as CAT1, CAT2, MODEL, UNIVERSITY in DB
  const backendTab = activeTab.replace('CIA', 'CAT');
  const formattedTab = backendTab.replace(/\s+/g, '').toUpperCase();
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
        ) : studentPapers ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-[14px] font-medium text-[#ECECEA] mb-3">Current Year</h2>
              {studentPapers.currentYear.filter((p: any) => p.examType === formattedTab).length === 0 ? (
                <div className="py-8 border border-[#3A3A38] rounded-lg bg-[#1F1F1E]">
                  <EmptyState icon={FileText} heading="No papers" subtext="No current year papers for this exam type" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {studentPapers.currentYear
                    .filter((p: any) => p.examType === formattedTab)
                    .map((p: any) => (
                      <PaperRow key={p.id} paper={{ ...p, academic_year: p.academicYear, exam_type: p.examType }} subjectId={subjectId} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-[14px] font-medium text-[#ECECEA] mb-3">Previous Year</h2>
              {studentPapers.previousYear.filter((p: any) => p.examType === formattedTab).length === 0 ? (
                <div className="py-8 border border-[#3A3A38] rounded-lg bg-[#1F1F1E]">
                  <EmptyState icon={FileText} heading="No papers" subtext="No previous year papers for this exam type" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {studentPapers.previousYear
                    .filter((p: any) => p.examType === formattedTab)
                    .map((p: any) => (
                      <PaperRow key={p.id} paper={{ ...p, academic_year: p.academicYear, exam_type: p.examType }} subjectId={subjectId} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            heading="No exam papers yet"
            subtext="No question papers found for this exam type"
          />
        ) : (
          filtered.map((p: any) => (
            <PaperRow key={p.id} paper={{ ...p, academic_year: p.academicYear, exam_type: p.examType }} subjectId={subjectId} />
          ))
        )}
      </div>
    </div>
  );
}
