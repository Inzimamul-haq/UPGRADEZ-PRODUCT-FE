"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Download, Eye, FileText, Pencil, Upload, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { EditExamDateModal } from '@/components/chat/EditExamDateModal';
import { UploadQPModal } from '@/components/chat/UploadQPModal';
import { useAuth } from '@/context/AuthContext';
import { extractErrorMessage, cleanQuestionText } from '@/lib/utils';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toDecoded } from '@/lib/examFormat';
import { DiagramRenderer } from '@/components/ui/QuestionDiagram/DiagramRenderer';
import { useProgressiveList } from '@/hooks/useProgressiveList';
import { SkeletonList, PaperCardSkeleton, QuestionModalSkeleton } from '@/components/ui/Skeletons';
import { LoadingNext } from '@/components/ui/LoadingNext';

type PaperKind = 'IMPORTANT_QUESTIONS' | 'EXAM_PAPER' | 'TOPIC_ASSIGNMENT';

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
  questions?: Question[];
  content?: any;
};

const EXAM_TABS = ['CAT1', 'CAT2', 'MODEL', 'UNIVERSITY', 'ARREAR'];

const examTypeColors: Record<string, string> = {
  CAT1: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  CAT2: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  CAT3: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  MODEL: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  UNIVERSITY: 'text-green-400 bg-green-400/10 border-green-400/20',
  ARREAR: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

const examLabel: Record<string, string> = {
  CAT1: 'CAT 1', CAT2: 'CAT 2', CAT3: 'CAT 3', MODEL: 'Model', UNIVERSITY: 'University', ARREAR: 'Arrear'
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
  const hasLoadedSubjects = React.useRef(false);
  const hasLoadedPapers = React.useRef(false);
  const reqIdRef = React.useRef(0);

  const [questionModal, setQuestionModal] = useState<PaperDetail | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [editDateModal, setEditDateModal] = useState<{
    paperId: string; currentDate: string | null; subjectName: string; examType: string;
  } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ paperId: string; kind: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
        hasLoadedSubjects.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    const currentReq = ++reqIdRef.current;
    hasLoadedPapers.current = false; // Need to show skeleton again when switching subjects

    (async () => {
      try {
        setLoadingPapers(true);
        const res = await api.get(
          `/api/question-papers/my/${selectedSubject.id}/papers`
        );
        if (currentReq === reqIdRef.current) {
          setPapers(res.data.papers || []);
        }
      } catch {
        if (currentReq === reqIdRef.current) {
          toast.error('Failed to load papers');
        }
      } finally {
        if (currentReq === reqIdRef.current) {
          setLoadingPapers(false);
          hasLoadedPapers.current = true;
        }
      }
    })();
  }, [selectedSubject]);

  const openQuestions = async (paperId: string) => {
    const paper = papers.find(p => p.id === paperId);
    if (paper?.kind === 'TOPIC_ASSIGNMENT') {
      setQuestionModal({
        id: paper.id,
        examType: paper.examType,
        academicYear: paper.academicYear,
        kind: paper.kind,
        subject: { name: selectedSubject!.name, code: selectedSubject!.code },
        content: (paper as any).content,
      });
      return;
    }

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
      if (deleteModal.kind === 'TOPIC_ASSIGNMENT') {
        await api.delete(`/api/topic-assignments/${deleteModal.paperId}`);
      } else {
        await api.delete(`/api/question-papers/${deleteModal.paperId}`);
      }
      setPapers(prev => prev.filter(p => p.id !== deleteModal.paperId));
      toast.success(deleteModal.kind === 'TOPIC_ASSIGNMENT' ? 'Important topics deleted successfully' : 'Paper deleted successfully');
      setDeleteModal(null);
    } catch (error: any) {
      toast.error(extractErrorMessage(error, 'Failed to delete'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = async (paper: Paper) => {
    toast.success('Generating 100% accurate PDF with diagrams... Please wait.');
    try {
      const res = await api.get(`/api/question-papers/${paper.id}/generate-pdf`, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QuestionPaper_${paper.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);

      toast.success('PDF Generated successfully!');
    } catch (error: any) {
      toast.error(extractErrorMessage(error, 'Failed to download PDF'));
    }
  };

  const handleExamDateSaved = (paperId: string, newDate: string) => {
    setPapers(prev => prev.map(p => p.id === paperId ? { ...p, examDate: newDate } : p));
  };

  const filtered = papers
    .filter(p => p.examType === activeTab)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const { visible: visibleSubjects, hasMore: hasMoreSubjects, isRevealing: isRevealingSubjects, sentinelRef: subjectSentinel } = useProgressiveList(subjects, {
    root: () => document.getElementById('app-main'),
  });

  const { visible: visiblePapers, hasMore: hasMorePapers, isRevealing: isRevealingPapers, sentinelRef: papersSentinel } = useProgressiveList(filtered, {
    root: () => document.getElementById('app-main'),
    resetKey: `${selectedSubject?.id}-${activeTab}`,
  });

  // ─── Subject list ──────────────────────────────────────────────────────────
  if (!selectedSubject) {
    return (
      <>
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full pt-14 md:pt-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-[15px] sm:text-[18px] font-medium text-[#ECECEA]">My Papers</h1>
              <p className="text-[11px] sm:text-[12px] text-[#8C8C8A] mt-0.5">Select a subject to view generated papers</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1.5 sm:gap-2 bg-[#2C2C2A] border border-[#3A3A38] text-[#ECECEA] text-[12px] sm:text-[13px] font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-[#333331] transition-colors"
              >
                <Upload size={14} /> Upload Q/P
              </button>
              <Link
                href={`/chat/new?role=${currentRole}`}
                className="flex items-center gap-1.5 sm:gap-2 bg-[#ECECEA] text-[#1C1C1B] text-[12px] sm:text-[13px] font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-white transition-colors"
              >
                <FileText size={14} /> Generate
              </Link>
            </div>
          </div>

          {/* Subject List */}
          <div className="mt-4 sm:mt-6 flex flex-col gap-2">
            {loadingSubjects && !hasLoadedSubjects.current ? (
              <SkeletonList count={5} Row={PaperCardSkeleton} />
            ) : subjects.length === 0 ? (
              <div className="flex flex-col items-center py-14">
                <FileText size={28} className="text-[#3A3A38] mb-3" />
                <p className="text-[14px] text-[#5A5A58]">No papers generated yet</p>
                <p className="text-[12px] text-[#3A3A38] mt-1">Use Generate to create your first paper</p>
              </div>
            ) : (
              <>
                {visibleSubjects.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => { setSelectedSubject(subject); setActiveTab('CAT1'); setPapers([]); }}
                    className="w-full text-left bg-[#2C2C2A] border border-[#3A3A38] rounded-xl px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between hover:bg-[#333331] transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] text-[#8C8C8A] uppercase tracking-wider">{subject.code}</p>
                      <p className="text-[13px] sm:text-[14px] font-medium text-[#ECECEA] mt-0.5 truncate">{subject.name}</p>
                      <p className="text-[11px] sm:text-[12px] text-[#5A5A58] mt-1">
                        {subject._count.questionPapers} paper{subject._count.questionPapers !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-[#5A5A58] group-hover:text-[#8C8C8A] transition-colors flex-shrink-0 ml-2" />
                  </button>
                ))}
                {hasMoreSubjects && (
                  <div ref={subjectSentinel} className="min-h-[48px]">
                    {isRevealingSubjects && <LoadingNext showEndOfList={false} hasMore={true} />}
                  </div>
                )}
              </>
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
              } catch { }
            }}
          />
        )}
      </>
    );
  }

  // ─── Papers list ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full pt-14 md:pt-6">
      {/* Back button */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setSelectedSubject(null)}
          className="text-[#8C8C8A] hover:text-[#ECECEA] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-[11px] sm:text-[12px] text-[#8C8C8A]">Papers</span>
      </div>

      {/* Subject header */}
      <div>
        <p className="text-[10px] sm:text-[11px] text-[#8C8C8A] uppercase tracking-wider">{selectedSubject.code}</p>
        <h1 className="text-[16px] sm:text-[18px] font-medium text-[#ECECEA] mt-0.5">{selectedSubject.name}</h1>
      </div>

      {/* Exam type tabs */}
      <div className="mt-4 flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
        {EXAM_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-medium whitespace-nowrap transition-colors ${activeTab === tab
                ? 'bg-[#ECECEA] text-[#1C1C1B]'
                : 'text-[#8C8C8A] hover:bg-[#333331] hover:text-[#ECECEA]'
              }`}
          >
            {examLabel[tab] || tab}
          </button>
        ))}
      </div>

      {/* Papers list */}
      <div className="mt-4 flex flex-col gap-2">
        {loadingPapers && !hasLoadedPapers.current ? (
          <SkeletonList count={4} Row={PaperCardSkeleton} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <FileText size={24} className="text-[#5A5A58] mb-2" />
            <p className="text-[13px] text-[#8C8C8A]">No papers for this exam type</p>
          </div>
        ) : (
          <>
            {visiblePapers.map(paper => (
              <div key={paper.id} className="bg-[#2C2C2A] border border-[#3A3A38] rounded-xl px-3 sm:px-5 py-3 sm:py-4">
                {/* Badges row */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className={`text-[10px] sm:text-[11px] font-medium border rounded px-1.5 sm:px-2 py-0.5 ${examTypeColors[paper.examType] || 'text-[#8C8C8A] bg-[#333331] border-[#3A3A38]'}`}>
                    {examLabel[paper.examType] || paper.examType}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] font-medium rounded px-1.5 sm:px-2 py-0.5 ${paper.kind === 'IMPORTANT_QUESTIONS'
                      ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                      : paper.kind === 'TOPIC_ASSIGNMENT'
                      ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                      : 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                    }`}>
                    {paper.kind === 'IMPORTANT_QUESTIONS' ? 'IQ' : paper.kind === 'TOPIC_ASSIGNMENT' ? 'Topics' : 'Exam'}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[#5A5A58] flex items-center gap-1">
                    <Clock size={10} /> {paper.academicYear}
                  </span>
                </div>

                {/* Question count */}
                <p className="text-[12px] sm:text-[13px] text-[#8C8C8A] mt-2">
                  {paper._count.questions} question{paper._count.questions !== 1 ? 's' : ''}
                </p>

                {/* Exam date */}
                {paper.examDate && (
                  <p className="text-[11px] sm:text-[12px] text-[#5A5A58] mt-1">
                    Exam date:{' '}
                    <span className="text-[#ECECEA]">
                      {paper.examDate}
                    </span>
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => openQuestions(paper.id)}
                    className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-[#ECECEA] bg-[#333331] border border-[#3A3A38] rounded-lg px-2.5 sm:px-3 py-1.5 hover:bg-[#3A3A38] transition-colors"
                  >
                    <Eye size={13} /> View
                  </button>

                  {paper.kind === 'EXAM_PAPER' && paper.examType !== 'ARREAR' && (
                    <button
                      onClick={() => setEditDateModal({
                        paperId: paper.id,
                        currentDate: paper.examDate,
                        subjectName: selectedSubject.name,
                        examType: paper.examType,
                      })}
                      className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-[#ECECEA] bg-[#333331] border border-[#3A3A38] rounded-lg px-2.5 sm:px-3 py-1.5 hover:bg-[#3A3A38] transition-colors"
                    >
                      <Pencil size={12} /> Edit Date
                    </button>
                  )}

                  {paper.kind === 'EXAM_PAPER' && (
                    <button
                      onClick={() => handleDownloadPDF(paper)}
                      className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-[#ECECEA] bg-[#333331] border border-[#3A3A38] rounded-lg px-2.5 sm:px-3 py-1.5 hover:bg-[#3A3A38] transition-colors"
                    >
                      <Download size={12} /> Download
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteModal({ paperId: paper.id, kind: paper.kind })}
                    className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 sm:px-3 py-1.5 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {hasMorePapers && (
              <div ref={papersSentinel} className="min-h-[48px]">
                {isRevealingPapers && <LoadingNext showEndOfList={false} hasMore={true} />}
              </div>
            )}
            {!hasMorePapers && filtered.length > 0 && (
              <LoadingNext showEndOfList={true} hasMore={false} />
            )}
          </>
        )}
      </div>

      {/* Questions/Topics Modal */}
      {(loadingQuestions || questionModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#3A3A38] bg-[#1A1A19] shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-start justify-between px-4 sm:px-6 py-4 border-b border-[#2E2E2C]">
              {loadingQuestions ? (
                <div className="min-w-0 flex-1">
                  <div className="h-[14px] bg-[#2E2E2C] rounded w-[30%] mb-2 animate-pulse motion-reduce:animate-none"></div>
                  <div className="h-[20px] bg-[#2E2E2C] rounded w-[60%] animate-pulse motion-reduce:animate-none"></div>
                </div>
              ) : questionModal && (
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-[11px] text-[#8C8C8A] uppercase tracking-wider truncate">
                    {questionModal.subject.code} · {examLabel[questionModal.examType] || questionModal.examType}
                    {' · '}
                    <span className={questionModal.kind === 'IMPORTANT_QUESTIONS' ? 'text-amber-400' : questionModal.kind === 'TOPIC_ASSIGNMENT' ? 'text-emerald-400' : 'text-blue-400'}>
                      {questionModal.kind === 'IMPORTANT_QUESTIONS' ? 'Important Questions' : questionModal.kind === 'TOPIC_ASSIGNMENT' ? 'Important Topics' : 'Exam Paper'}
                    </span>
                  </p>
                  <h2 className="text-[14px] sm:text-[15px] font-medium text-[#ECECEA] mt-0.5 truncate">{questionModal.subject.name}</h2>
                  {questionModal.kind !== 'TOPIC_ASSIGNMENT' && (
                    <p className="text-[11px] sm:text-[12px] text-[#5A5A58] mt-0.5">{questionModal.questions?.length || 0} questions</p>
                  )}
                </div>
              )}
              <button
                onClick={() => setQuestionModal(null)}
                className="ml-4 text-[#5A5A58] hover:text-[#ECECEA] transition-colors mt-0.5 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {loadingQuestions ? (
              <QuestionModalSkeleton />
            ) : questionModal && (
              <div className="overflow-y-auto px-4 sm:px-6 py-4 flex flex-col gap-3">
                {questionModal.kind === 'TOPIC_ASSIGNMENT' ? (
                  questionModal.content?.chapters?.length === 0 ? (
                    <p className="text-[13px] text-[#5A5A58] text-center py-6">No topics found.</p>
                  ) : (
                    questionModal.content?.chapters?.map((chapterNumber: number) => {
                      const topics = questionModal.content?.topics?.[chapterNumber] || [];
                      return (
                        <div key={chapterNumber} className="rounded-lg border border-[#2E2E2C] bg-[#222221] px-3 sm:px-4 py-3 flex flex-col gap-2">
                          <h3 className="font-semibold text-[13px] text-[#ECECEA]">Chapter {chapterNumber}</h3>
                          <ul className="list-disc pl-5 text-[13px] text-[#8C8C8A] space-y-1">
                            {topics.map((topic: string, i: number) => (
                              <li key={i}>{topic}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })
                  )
                ) : (
                  !questionModal.questions || questionModal.questions.length === 0 ? (
                    <p className="text-[13px] text-[#5A5A58] text-center py-6">No questions found.</p>
                  ) : (
                    questionModal.questions.map(toDecoded).map((q, idx) => {
                      const hasQpPrefix = q.part && q.groupIndex;
                      const label = hasQpPrefix && q.subLabel ? `${q.groupIndex}${q.subLabel}` : `Q${idx + 1}`;

                      return (
                        <div key={q.id || idx} className="rounded-lg border border-[#2E2E2C] bg-[#222221] px-3 sm:px-4 py-3 flex flex-col gap-3">
                          {/* Header: Number & Marks & Badges */}
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[13px] text-[#ECECEA]">{label}.</span>
                              {q.meta && (
                              <div className="flex gap-1.5">
                                {q.meta.co && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#2E2E2C] text-[#8C8C8A] text-[10px] font-medium border border-[#3A3A38]">
                                    {q.meta.co.toUpperCase()}
                                  </span>
                                )}
                                {q.meta.rbt && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#2E2E2C] text-[#8C8C8A] text-[10px] font-medium border border-[#3A3A38]">
                                    {q.meta.rbt.toUpperCase()}
                                  </span>
                                )}
                                {q.meta.po && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#2E2E2C] text-[#8C8C8A] text-[10px] font-medium border border-[#3A3A38]">
                                    {q.meta.po.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {q.marks && (
                            <span className="text-[12px] font-medium text-[#8C8C8A]">
                              ({q.marks} Marks)
                            </span>
                          )}
                        </div>

                        {/* Question Text */}
                        <p className="text-[12px] sm:text-[13px] text-[#ECECEA] leading-relaxed whitespace-pre-wrap">
                          {cleanQuestionText(q.text)}
                        </p>

                        {/* Diagram */}
                        {q.diagramSpec && (
                          <div className="mt-2 flex justify-center bg-[#1A1A19] rounded-lg p-2 border border-[#2E2E2C]">
                            <DiagramRenderer
                              type={q.diagramSpec.type || q.diagramType || 'unknown'}
                              spec={q.diagramSpec}
                              width={280}
                              height={200}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Exam Date Modal */}
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