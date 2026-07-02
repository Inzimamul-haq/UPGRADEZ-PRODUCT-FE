"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Eye, FileText, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

type Subject = { id: string; name: string; code: string; _count: { questionPapers: number } };
type Paper = { id: string; examType: string; academicYear: string; createdAt: string; _count: { questions: number } };
type Question = { id: string; questionText: string; createdAt: string };
type PaperDetail = {
  id: string;
  examType: string;
  academicYear: string;
  subject: { name: string; code: string };
  questions: Question[];
};

const EXAM_TABS = ['All', 'CAT1', 'CAT2', 'CAT3', 'MODEL', 'UNIVERSITY'];

const examTypeColors: Record<string, string> = {
  CAT1: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  CAT2: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  CAT3: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  MODEL: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  UNIVERSITY: 'text-green-400 bg-green-400/10 border-green-400/20',
};

const examLabel: Record<string, string> = {
  CAT1: 'CAT 1', CAT2: 'CAT 2', CAT3: 'CAT 3', MODEL: 'Model', UNIVERSITY: 'University'
};

export default function PapersPage() {
  const toast = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingPapers, setLoadingPapers] = useState(false);

  // Questions modal
  const [questionModal, setQuestionModal] = useState<PaperDetail | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const currentRole = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'faculty';

  // Fetch subjects on mount
  useEffect(() => {
    (async () => {
      try {
        setLoadingSubjects(true);
        const res = await api.get('/api/question-papers');
        setSubjects(res.data.subjects || []);
      } catch {
        toast.error('Failed to load subjects');
      } finally {
        setLoadingSubjects(false);
      }
    })();
  }, []);

  // Fetch papers when a subject is selected
  useEffect(() => {
    if (!selectedSubject) return;
    (async () => {
      try {
        setLoadingPapers(true);
        const res = await api.get(`/api/question-papers/${selectedSubject.id}/papers`);
        setPapers(res.data.papers || []);
      } catch {
        toast.error('Failed to load papers');
      } finally {
        setLoadingPapers(false);
      }
    })();
  }, [selectedSubject]);

  const openQuestions = async (paperId: string) => {
    try {
      setLoadingQuestions(true);
      const res = await api.get(`/api/question-papers/${paperId}/questions`);
      setQuestionModal(res.data.paper);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const filtered = activeTab === 'All' ? papers : papers.filter(p => p.examType === activeTab);

  // ─── Subject list view ───────────────────────────────────────────────────────
  if (!selectedSubject) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6 w-full pt-14 md:pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-medium text-[#ECECEA]">My Papers</h1>
            <p className="text-[12px] text-[#8C8C8A] mt-0.5">Select a subject to view generated papers</p>
          </div>
          <Link
            href={`/chat/new?role=${currentRole}`}
            className="flex items-center gap-2 bg-[#ECECEA] text-[#1C1C1B] text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-white transition-colors"
          >
            <FileText size={14} />
            Generate
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {loadingSubjects ? (
            <p className="text-[13px] text-[#5A5A58]">Loading subjects…</p>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center py-14">
              <FileText size={28} className="text-[#3A3A38] mb-3" />
              <p className="text-[14px] text-[#5A5A58]">No papers generated yet</p>
              <p className="text-[12px] text-[#3A3A38] mt-1">Use the Generate button to create your first paper</p>
            </div>
          ) : (
            subjects.map(subject => (
              <button
                key={subject.id}
                onClick={() => { setSelectedSubject(subject); setActiveTab('All'); setPapers([]); }}
                className="w-full text-left bg-[#2C2C2A] border border-[#3A3A38] rounded-xl px-5 py-4 flex items-center justify-between hover:bg-[#333331] transition-colors group"
              >
                <div>
                  <p className="text-[11px] text-[#8C8C8A] uppercase tracking-wider">{subject.code}</p>
                  <p className="text-[14px] font-medium text-[#ECECEA] mt-0.5">{subject.name}</p>
                  <p className="text-[12px] text-[#5A5A58] mt-1">{subject._count.questionPapers} paper{subject._count.questionPapers !== 1 ? 's' : ''}</p>
                </div>
                <ChevronRight size={16} className="text-[#5A5A58] group-hover:text-[#8C8C8A] transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // ─── Papers list view ────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-6 py-6 w-full pt-14 md:pt-6">
      {/* Back nav */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setSelectedSubject(null)}
          className="text-[#8C8C8A] hover:text-[#ECECEA] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-[12px] text-[#8C8C8A]">Papers</span>
      </div>

      <div>
        <p className="text-[11px] text-[#8C8C8A] uppercase tracking-wider">{selectedSubject.code}</p>
        <h1 className="text-[18px] font-medium text-[#ECECEA] mt-0.5">{selectedSubject.name}</h1>
      </div>

      {/* Exam type tabs */}
      <div className="mt-4 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {EXAM_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-[#ECECEA] text-[#1C1C1B]'
                : 'text-[#8C8C8A] hover:bg-[#333331] hover:text-[#ECECEA]'
            }`}
          >
            {tab === 'All' ? 'All' : examLabel[tab]}
          </button>
        ))}
      </div>

      {/* Papers */}
      <div className="mt-4 flex flex-col gap-2">
        {loadingPapers ? (
          <p className="text-[13px] text-[#5A5A58] py-4">Loading papers…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <FileText size={24} className="text-[#5A5A58] mb-2" />
            <p className="text-[13px] text-[#8C8C8A]">No papers for this exam type</p>
          </div>
        ) : (
          filtered.map(paper => (
            <div key={paper.id} className="bg-[#2C2C2A] border border-[#3A3A38] rounded-xl px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium border rounded px-2 py-0.5 ${examTypeColors[paper.examType] || 'text-[#8C8C8A] bg-[#333331] border-[#3A3A38]'}`}>
                      {examLabel[paper.examType] || paper.examType}
                    </span>
                    <span className="text-[11px] text-[#5A5A58] flex items-center gap-1">
                      <Clock size={10} /> {paper.academicYear}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#8C8C8A] mt-2">{paper._count.questions} question{paper._count.questions !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => openQuestions(paper.id)}
                  className="flex items-center gap-1.5 text-[12px] text-[#ECECEA] bg-[#333331] border border-[#3A3A38] rounded-lg px-3 py-1.5 hover:bg-[#3A3A38] transition-colors"
                >
                  <Eye size={13} /> View Questions
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Questions Modal */}
      {(loadingQuestions || questionModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#3A3A38] bg-[#1A1A19] shadow-2xl flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-[#2E2E2C]">
              {loadingQuestions ? (
                <p className="text-[13px] text-[#8C8C8A]">Loading questions…</p>
              ) : questionModal && (
                <div>
                  <p className="text-[11px] text-[#8C8C8A] uppercase tracking-wider">
                    {questionModal.subject.code} · {examLabel[questionModal.examType] || questionModal.examType}
                  </p>
                  <h2 className="text-[15px] font-medium text-[#ECECEA] mt-0.5">{questionModal.subject.name}</h2>
                  <p className="text-[12px] text-[#5A5A58] mt-0.5">{questionModal.questions.length} questions</p>
                </div>
              )}
              <button
                onClick={() => setQuestionModal(null)}
                className="ml-4 text-[#5A5A58] hover:text-[#ECECEA] transition-colors mt-0.5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Question list */}
            {!loadingQuestions && questionModal && (
              <div className="overflow-y-auto px-6 py-4 flex flex-col gap-3">
                {questionModal.questions.length === 0 ? (
                  <p className="text-[13px] text-[#5A5A58] text-center py-6">No questions found for this paper.</p>
                ) : (
                  questionModal.questions.map((q, idx) => (
                    <div key={q.id} className="rounded-lg border border-[#2E2E2C] bg-[#222221] px-4 py-3">
                      <span className="text-[11px] text-[#5A5A58] font-medium">Q{idx + 1}</span>
                      <p className="text-[13px] text-[#ECECEA] mt-1 leading-relaxed">{q.questionText}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
