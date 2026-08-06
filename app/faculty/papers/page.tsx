"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Download, Eye, FileText, Pencil, Upload, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { EditExamDateModal } from '@/components/chat/EditExamDateModal';
import { UploadQPModal } from '@/components/chat/UploadQPModal';
import { generateQuestionPaperPDF, generateModelSemesterPaperPDF } from '@/lib/pdfGenerator';
import { useAuth } from '@/context/AuthContext';
import { extractErrorMessage } from '@/lib/utils';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

type PaperKind = 'IMPORTANT_QUESTIONS' | 'EXAM_PAPER';

type Subject = {
  id: string;
  name: string;
  code: string;
  _count: { questionPapers: number };
};

type Paper = {
  id: string;
  examType: string;
  academicYear: string;
  kind: PaperKind;
  examDate: string | null;
  publishedAt: string | null;
  linkedPaperId: string | null;
  createdAt: string;
  _count: { questions: number };
};

type Question = { id: string; questionText: string; createdAt: string };

type PaperDetail = {
  id: string;
  examType: string;
  academicYear: string;
  kind: PaperKind;
  subject: { name: string; code: string };
  questions: Question[];
};

const EXAM_TABS = ['CAT1', 'CAT2', 'MODEL', 'UNIVERSITY'];

const examTypeColors: Record<string, string> = {
  CAT1: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  CAT2: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  CAT3: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  MODEL: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  UNIVERSITY: 'text-green-400 bg-green-400/10 border-green-400/20',
};

const examLabel: Record<string, string> = {
  CAT1: 'CAT 1', CAT2: 'CAT 2', CAT3: 'CAT 3', MODEL: 'Model', UNIVERSITY: 'University',
};

export default function PapersPage() {
  const toast = useToast();
  const { role, user } = useAuth();
  const currentRole = role ?? 'faculty';
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [activeTab, setActiveTab] = useState('CAT1');
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingPapers, setLoadingPapers] = useState(false);

  // Questions modal
  const [questionModal, setQuestionModal] = useState<PaperDetail | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Edit Exam Date modal (Flow 3)
  const [editDateModal, setEditDateModal] = useState<{
    paperId: string; currentDate: string | null; subjectName: string; examType: string;
  } | null>(null);

  // Delete Q/P modal
  const [deleteModal, setDeleteModal] = useState<{ paperId: string; kind: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload Q/P modal
  const [showUploadModal, setShowUploadModal] = useState(false);

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

  useEffect(() => {
    if (!selectedSubject) return;
    (async () => {
      try {
        setLoadingPapers(true);
        const res = await api.get(
          `/api/question-papers/my/${selectedSubject.id}/papers`
        );
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
    } catch (error: any) {
      toast.error(extractErrorMessage(error, 'Failed to load questions'));
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleDeletePaper = async () => {
    if (!deleteModal) return;
    try {
      setIsDeleting(true);
      await api.delete(`/api/question-papers/${deleteModal.paperId}`);
      setPapers(prev => prev.filter(p => p.id !== deleteModal.paperId));
      toast.success('Paper deleted successfully');
      setDeleteModal(null);
    } catch (error: any) {
      toast.error(extractErrorMessage(error, 'Failed to delete paper'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = async (paper: Paper) => {
    try {
      const res = await api.get(`/api/question-papers/${paper.id}/questions`);
      const detail: PaperDetail = res.data.paper;
      const isModelOrSemester = paper.examType.toUpperCase().includes('MODEL') || paper.examType.toUpperCase().includes('SEMESTER') || paper.examType.toUpperCase().includes('UNIVERSITY');
      const pdfParams = {
        paper: { id: paper.id, examType: paper.examType, academicYear: paper.academicYear, subjectId: selectedSubject?.id || '' },
        assignment: { assignedToYear: null, assignedToBranch: null, assignedToSection: null },
        questions: detail.questions.map(q => ({ text: q.questionText })),
        subject: selectedSubject ? { name: selectedSubject.name, code: selectedSubject.code } : undefined,
        college: user?.college,
        department: user?.department,
      };
      
      if (isModelOrSemester) {
        generateModelSemesterPaperPDF(pdfParams);
      } else {
        generateQuestionPaperPDF(pdfParams);
      }
    } catch (error: any) {
      toast.error(extractErrorMessage(error, 'Failed to generate PDF'));
    }
  };

  const handleExamDateSaved = (paperId: string, newDate: string) => {
    setPapers(prev => prev.map(p => p.id === paperId ? { ...p, examDate: newDate } : p));
  };

  const filtered = papers
    .filter(p => p.examType === activeTab)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // ─── Subject list ──────────────────────────────────────────────────────────
  if (!selectedSubject) {
    return (
      <>
        <div className="max-w-3xl mx-auto px-6 py-6 w-full pt-14 md:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-medium text-[#ECECEA]">My Papers</h1>
              <p className="text-[12px] text-[#8C8C8A] mt-0.5">Select a subject to view generated papers</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 bg-[#2C2C2A] border border-[#3A3A38] text-[#ECECEA] text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#333331] transition-colors"
              >
                <Upload size={14} /> Upload Q/P
              </button>
              <Link
                href={`/chat/new?role=${currentRole}`}
                className="flex items-center gap-2 bg-[#ECECEA] text-[#1C1C1B] text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-white transition-colors"
              >
                <FileText size={14} /> Generate
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {loadingSubjects ? (
              <p className="text-[13px] text-[#5A5A58]">Loading subjects…</p>
            ) : subjects.length === 0 ? (
              <div className="flex flex-col items-center py-14">
                <FileText size={28} className="text-[#3A3A38] mb-3" />
                <p className="text-[14px] text-[#5A5A58]">No papers generated yet</p>
                <p className="text-[12px] text-[#3A3A38] mt-1">Use Generate to create your first paper</p>
              </div>
            ) : (
              subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => { setSelectedSubject(subject); setActiveTab('CAT1'); setPapers([]); }}
                  className="w-full text-left bg-[#2C2C2A] border border-[#3A3A38] rounded-xl px-5 py-4 flex items-center justify-between hover:bg-[#333331] transition-colors group"
                >
                  <div>
                    <p className="text-[11px] text-[#8C8C8A] uppercase tracking-wider">{subject.code}</p>
                    <p className="text-[14px] font-medium text-[#ECECEA] mt-0.5">{subject.name}</p>
                    <p className="text-[12px] text-[#5A5A58] mt-1">
                      {subject._count.questionPapers} paper{subject._count.questionPapers !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-[#5A5A58] group-hover:text-[#8C8C8A] transition-colors" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Upload Q/P Modal */}
        {showUploadModal && (
          <UploadQPModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={async () => {
              try {
                const res = await api.get('/api/question-papers');
                setSubjects(res.data.subjects || []);
              } catch {}
            }}
          />
        )}
      </>
    );
  }


  // ─── Papers list ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-6 py-6 w-full pt-14 md:pt-6">
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
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${activeTab === tab
                ? 'bg-[#ECECEA] text-[#1C1C1B]'
                : 'text-[#8C8C8A] hover:bg-[#333331] hover:text-[#ECECEA]'
              }`}
          >
            {examLabel[tab] || tab}
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
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-medium border rounded px-2 py-0.5 ${examTypeColors[paper.examType] || 'text-[#8C8C8A] bg-[#333331] border-[#3A3A38]'}`}>
                      {examLabel[paper.examType] || paper.examType}
                    </span>
                    {/* Kind badge */}
                    <span className={`text-[10px] font-medium rounded px-2 py-0.5 ${paper.kind === 'IMPORTANT_QUESTIONS'
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                        : 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                      }`}>
                      {paper.kind === 'IMPORTANT_QUESTIONS' ? 'IQ' : 'Exam'}
                    </span>
                    <span className="text-[11px] text-[#5A5A58] flex items-center gap-1">
                      <Clock size={10} /> {paper.academicYear}
                    </span>
                  </div>

                  <p className="text-[13px] text-[#8C8C8A] mt-2">
                    {paper._count.questions} question{paper._count.questions !== 1 ? 's' : ''}
                  </p>

                  {/* Exam date row for papers */}
                  {paper.examDate && (
                    <p className="text-[12px] text-[#5A5A58] mt-1">
                      Exam date:{' '}
                      <span className="text-[#ECECEA]">
                        {paper.examDate}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => openQuestions(paper.id)}
                  className="flex items-center gap-1.5 text-[12px] text-[#ECECEA] bg-[#333331] border border-[#3A3A38] rounded-lg px-3 py-1.5 hover:bg-[#3A3A38] transition-colors"
                >
                  <Eye size={13} /> View
                </button>

                {/* Exam paper: Edit Exam Date (Flow 3) */}
                {paper.kind === 'EXAM_PAPER' && (
                  <button
                    onClick={() => setEditDateModal({
                      paperId: paper.id,
                      currentDate: paper.examDate,
                      subjectName: selectedSubject.name,
                      examType: paper.examType,
                    })}
                    className="flex items-center gap-1.5 text-[12px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-1.5 hover:bg-amber-400/20 transition-colors"
                  >
                    <Pencil size={12} /> Edit Exam Date
                  </button>
                )}

                {/* Exam paper: Download PDF */}
                {paper.kind === 'EXAM_PAPER' && (
                  <button
                    onClick={() => handleDownloadPDF(paper)}
                    className="flex items-center gap-1.5 text-[12px] text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-lg px-3 py-1.5 hover:bg-blue-400/20 transition-colors"
                  >
                    <Download size={12} /> Download PDF
                  </button>
                )}

                {/* Delete Paper Button */}
                <button
                  onClick={() => setDeleteModal({ paperId: paper.id, kind: paper.kind })}
                  className="flex items-center gap-1.5 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={12} /> Delete
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
            <div className="flex items-start justify-between px-6 py-4 border-b border-[#2E2E2C]">
              {loadingQuestions ? (
                <p className="text-[13px] text-[#8C8C8A]">Loading questions…</p>
              ) : questionModal && (
                <div>
                  <p className="text-[11px] text-[#8C8C8A] uppercase tracking-wider">
                    {questionModal.subject.code} · {examLabel[questionModal.examType] || questionModal.examType}
                    {' · '}
                    <span className={questionModal.kind === 'IMPORTANT_QUESTIONS' ? 'text-amber-400' : 'text-blue-400'}>
                      {questionModal.kind === 'IMPORTANT_QUESTIONS' ? 'Important Questions' : 'Exam Paper'}
                    </span>
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

            {!loadingQuestions && questionModal && (
              <div className="overflow-y-auto px-6 py-4 flex flex-col gap-3">
                {questionModal.questions.length === 0 ? (
                  <p className="text-[13px] text-[#5A5A58] text-center py-6">No questions found.</p>
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

      {/* Edit Exam Date Modal (Flow 3) */}
      {editDateModal && (
        <EditExamDateModal
          paperId={editDateModal.paperId}
          currentDate={editDateModal.currentDate}
          subjectName={editDateModal.subjectName}
          examType={editDateModal.examType}
          onClose={() => setEditDateModal(null)}
          onSaved={(newDate) => {
            handleExamDateSaved(editDateModal.paperId, newDate);
            setEditDateModal(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteModal}
        title="Delete Paper"
        message={
          deleteModal?.kind === 'IMPORTANT_QUESTIONS'
            ? "Warning: Deleting this Important Questions paper will also delete its linked Exam Paper if one was generated. This action cannot be undone."
            : "Are you sure you want to delete this Exam Paper? This action cannot be undone, but the Important Questions used to generate it will remain intact."
        }
        confirmText="Delete"
        isDestructive
        isLoading={isDeleting}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDeletePaper}
      />
    </div>
  );
}
