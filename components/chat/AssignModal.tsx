"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { generateQuestionPaperPDF, generateModelSemesterPaperPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import type {  PaperKind , AssignModalProps, GateState } from "@/lib/types";
import { parseQPStructure } from '@/lib/qpParser';

import { useAuth } from '@/context/AuthContext';

export interface AssignModalExtendedProps extends AssignModalProps {
  chatId?: string;
}

export function AssignModal({ sessionData, rawText, onClose, onSuccess, chatId }: AssignModalExtendedProps) {
  const { user } = useAuth();
  // Flow 2B gate state
  const isFlow2B = sessionData.paperKind === 'EXAM_PAPER' && sessionData.hasLinkedIQ && !!sessionData.linkedIQPaperId;

  const defaultBranch = sessionData.branch || '';

  const defaultYear = isFlow2B && sessionData.linkedIQAssignment?.assignedToYear
    ? sessionData.linkedIQAssignment.assignedToYear.toString()
    : sessionData.year || '';

  const defaultSection = isFlow2B && sessionData.linkedIQAssignment?.assignedToSection
    ? sessionData.linkedIQAssignment.assignedToSection
    : sessionData.section || '';

  const [branch, setBranch] = useState(defaultBranch);
  const [section, setSection] = useState(defaultSection);
  const [loading, setLoading] = useState(false);
  const [gateState, setGateState] = useState<GateState>(isFlow2B ? 'loading' : 'ready');
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [examDateInput, setExamDateInput] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [directExamDate, setDirectExamDate] = useState('');
  const needsDirectDate = gateState === 'ready' && sessionData.paperKind === 'EXAM_PAPER' && !isFlow2B;

  // Evaluate gate on mount for Flow 2B
  useEffect(() => {
    if (!isFlow2B) return;
    evaluateGate(sessionData.linkedIQExamDate ?? null);
  }, [isFlow2B]);

  const evaluateGate = (examDate: string | null) => {
    if (!examDate) {
      setGateState('need_exam_date');
      return;
    }
    const exam = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exam.setHours(0, 0, 0, 0);
    if (today < exam) {
      setLockedUntil(examDate);
      setGateState('locked');
    } else {
      setGateState('ready');
    }
  };

  // Set exam date (from gate popup) — do not patch the IQ, just continue
  const handleSaveExamDate = async () => {
    if (!examDateInput || !sessionData.linkedIQPaperId) return;
    evaluateGate(examDateInput);
  };


  const handleSubmit = async () => {
    if (needsDirectDate) {
      if (!directExamDate) {
        toast.error('Please select an exam date.');
        return;
      }
      const selected = new Date(directExamDate);
      selected.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected.getTime() !== today.getTime()) {
        toast.error('Direct exam papers can only be assigned on the current date.');
        return;
      }
    }

    setLoading(true);
    try {
      // parseQPStructure is the single authoritative parser — called once at save time
      const questions = parseQPStructure(rawText);
      const currentYear = new Date().getFullYear();
      const acYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

      const payload = {
        subjectId: sessionData.subjectId,
        examType: sessionData.examType,
        academicYear: acYear,
        assignedToYear: defaultYear ? parseInt(defaultYear) : 2,
        assignedToDepartmentId: sessionData.departmentId || null,
        assignedToSection: section || null,
        rawQuestions: questions,
        kind: sessionData.paperKind || 'EXAM_PAPER',
        linkedPaperId: sessionData.paperKind === 'EXAM_PAPER' && sessionData.hasLinkedIQ
          ? sessionData.linkedIQPaperId || null
          : null,
        examDate: isFlow2B ? (sessionData.linkedIQExamDate || examDateInput) : (needsDirectDate ? directExamDate : null),
        chatId: chatId || undefined,
      };

      const res = await api.post('/api/question-papers/save-and-assign', payload);
      const { paper, assignment, questions: savedQ } = res.data.data;

      // Download PDF for exam papers
      if (sessionData.paperKind === 'EXAM_PAPER') {
        const isModelOrSemester = paper.examType.toUpperCase().includes('MODEL') || paper.examType.toUpperCase().includes('SEMESTER') || paper.examType.toUpperCase().includes('UNIVERSITY');
        const pdfParams = { 
          paper, 
          assignment: { ...assignment, assignedToBranch: branch }, 
          questions: savedQ, 
          subject: sessionData.subject,
          college: user?.college,
          department: user?.department
        };
        
        if (isModelOrSemester) {
          generateModelSemesterPaperPDF(pdfParams);
        } else {
          generateQuestionPaperPDF(pdfParams);
        }
      }

      const kindLabel = sessionData.paperKind === 'IMPORTANT_QUESTIONS' ? 'Important questions' : 'Exam paper';
      const successMsg = `${kindLabel} assigned successfully.\n\n${sessionData.subject?.name} — ${sessionData.examType}\n${branch} · ${defaultYear}\nSection: ${section || 'All Sections'}\n\nStudents will be notified.`;

      onSuccess(successMsg, sessionData.paperKind as PaperKind, paper.id);
      onClose();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const message = err?.response?.data?.message || 'Failed to save and assign';

      if (code === 'EXAM_DATE_MISSING') {
        setGateState('need_exam_date');
      } else if (code === 'EXAM_DATE_LOCKED') {
        setLockedUntil(err?.response?.data?.lockedUntil ?? null);
        setGateState('locked');
      } else if (code === 'ALREADY_LINKED' || code === 'IQ_ALREADY_ASSIGNED') {
        onClose();
        setTimeout(() => toast.error(message), 100);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const kindLabel = sessionData.paperKind === 'IMPORTANT_QUESTIONS' ? 'Important Questions' : 'Exam Paper';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl p-6 w-[460px] shadow-2xl mx-4 text-[#ECECEA]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-[17px] font-medium mb-4">Assign {kindLabel}</h2>

        {/* Paper info */}
        <div className="space-y-2 mb-5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-[#8C8C8A]">Subject</span>
            <span>{sessionData.subject?.name} ({sessionData.subject?.code})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8C8C8A]">Exam Type</span>
            <span>{sessionData.examType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8C8C8A]">Kind</span>
            <span className={sessionData.paperKind === 'IMPORTANT_QUESTIONS'
              ? 'text-amber-400' : 'text-blue-400'}>
              {kindLabel}
            </span>
          </div>
        </div>

        {/* ── Flow 2B: Gate Loading ── */}
        {gateState === 'loading' && (
          <div className="py-8 text-center text-[13px] text-[#8C8C8A]">Checking exam date…</div>
        )}

        {/* ── Flow 2B: Need exam date ── */}
        {gateState === 'need_exam_date' && (
          <div className="bg-[#1C1C1B] border border-amber-500/30 rounded-xl p-4 mb-4">
            <p className="text-[13px] text-amber-400 font-medium mb-1">Exam date required</p>
            <p className="text-[12px] text-[#8C8C8A] mb-3">
              The linked important-questions paper has no exam date set. Enter it now to continue.
              <span className="text-amber-400 mt-2 block font-medium">Note: This will be reflected in the question paper, so please choose the correct date.</span>
            </p>
            <input
              type="date"
              value={examDateInput}
              onChange={e => setExamDateInput(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-white mb-3"
            />
            <button
              onClick={handleSaveExamDate}
              disabled={!examDateInput || savingDate}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white text-[13px] font-medium rounded-lg py-2 transition-colors"
            >
              {savingDate ? 'Saving…' : 'Set Exam Date & Continue'}
            </button>
          </div>
        )}

        {/* ── Flow 2B: Locked ── */}
        {gateState === 'locked' && (
          <div className="bg-[#1C1C1B] border border-red-500/30 rounded-xl p-4 mb-4 text-center">
            <p className="text-[15px] font-medium text-red-400 mb-1"> Locked</p>
            <p className="text-[13px] text-[#8C8C8A]">
              Assignment is not available until{' '}
              <span className="text-[#ECECEA] font-medium">{lockedUntil}</span>.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 border border-[#3A3A38] rounded-xl py-2 text-[13px] text-[#8C8C8A] hover:bg-[#333331] transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const questions = parseQPStructure(rawText);
                  const isModelOrSemester = sessionData.examType.toUpperCase().includes('MODEL') || sessionData.examType.toUpperCase().includes('SEMESTER') || sessionData.examType.toUpperCase().includes('UNIVERSITY');
                  const pdfParams = {
                    paper: { examType: sessionData.examType, academicYear: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}` },
                    assignment: { assignedToYear: defaultYear || '2', assignedToBranch: branch || 'All', assignedToSection: section || 'All' },
                    questions,
                    subject: sessionData.subject,
                    college: user?.college,
                    department: user?.department
                  };
                  if (isModelOrSemester) {
                    generateModelSemesterPaperPDF(pdfParams);
                  } else {
                    generateQuestionPaperPDF(pdfParams);
                  }
                }}
                className="flex-1 border border-blue-500/30 text-blue-400 bg-blue-500/10 rounded-xl py-2 text-[13px] hover:bg-blue-500/20 transition-colors flex justify-center items-center gap-1.5"
              >
                <Download size={13} />
                Download PDF
              </button>
            </div>
          </div>
        )}

        {/* ── Ready: Assignment form ── */}
        {gateState === 'ready' && (
          <>
            <div className="mb-4">
              <p className="text-[13px] text-[#8C8C8A] mb-3 font-medium">Assign To</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="w-24 text-[13px] text-[#8C8C8A] shrink-0">Department</label>
                  <input
                    readOnly
                    value={sessionData.department || sessionData.subject?.department || ''}
                    className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#8C8C8A]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 text-[13px] text-[#8C8C8A] shrink-0">Branch</label>
                  <input
                    readOnly
                    value={branch}
                    className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#8C8C8A]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 text-[13px] text-[#8C8C8A] shrink-0">Year</label>
                  <input
                    readOnly
                    value={defaultYear}
                    className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#8C8C8A]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 text-[13px] text-[#8C8C8A] shrink-0">Section</label>
                  <input
                    readOnly
                    value={section || 'All Sections'}
                    className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#8C8C8A]"
                  />
                </div>
                {needsDirectDate && (
                  <div className="flex items-center gap-3">
                    <label className="w-24 text-[13px] text-[#8C8C8A] shrink-0">Exam Date</label>
                    <input
                      type="date"
                      value={directExamDate}
                      onChange={e => setDirectExamDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-[#3A3A38] rounded-xl py-2.5 text-[13px] text-[#8C8C8A] hover:bg-[#333331] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !branch || (needsDirectDate && !directExamDate) || (isFlow2B && !section)}
                className="flex-1 bg-orange-500 rounded-xl py-2.5 text-[13px] font-medium text-white hover:bg-orange-400 disabled:opacity-40 transition-colors"
              >
                {loading ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
