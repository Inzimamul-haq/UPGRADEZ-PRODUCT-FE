"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { QuestionRow } from '@/components/questions/QuestionRow';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

export function SharedPaperQuestions({ subjectId, paperId }: { subjectId: string, paperId: string }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [paper, setPaper] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/question-papers/${paperId}/questions`);
        setPaper(data.paper);
        setQuestions(data.paper?.questions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [paperId]);

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
          {paper?.subject?.name || 'Subject'} — {paper?.examType} {paper?.academicYear}
        </h1>
        {paper?.creator?.name && (
          <p className="text-[12px] text-[#8C8C8A] mt-0.5">
            Assigned by {paper.creator.name}
          </p>
        )}
      </div>


      <div className="mt-4 flex flex-col">
        {loading ? (
          <div className="py-8 text-[#5A5A58] text-[13px] text-center">Loading questions...</div>
        ) : questions.length === 0 ? (
          <p className="text-[13px] text-[#8C8C8A] mt-4">No questions found.</p>
        ) : (
          questions.map((q: any, i: number) => (
            <QuestionRow key={q.id} question={{ ...q, question_text: q.questionText }} index={i + 1} />
          ))
        )}
      </div>



      {role === 'student' && (
        <div className="mt-12 flex justify-center pb-8">
          <button
            onClick={() => router.push(`/chat/new${paperId ? `?paperId=${paperId}` : ''}`)}
            className="text-[14px] text-[#1C1C1B] bg-[#ECECEA] border border-[#ECECEA] font-medium rounded-lg px-6 py-2.5 hover:bg-white transition-colors duration-150 flex items-center gap-2"
          >
            Study this paper in chat &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
