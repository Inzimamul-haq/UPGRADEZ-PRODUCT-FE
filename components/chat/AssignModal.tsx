"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import type {  PaperKind , AssignModalProps, GateState, Department } from "@/lib/types";
import { parseQPStructure, encodeQPPrefix } from '@/lib/qpParser';

import { useAuth } from '@/context/AuthContext';

export interface AssignModalExtendedProps extends AssignModalProps {
  chatId?: string;
  messageId?: string | null;
}

export function AssignModal({ sessionData, rawText, onClose, onSuccess, chatId, messageId }: AssignModalExtendedProps) {
  const { user } = useAuth();
  
  const isUniversity = sessionData.examType.toUpperCase().includes('UNIVERSITY');
  
  // Flow 2B gate state (force false for University Exam Papers)
  const isFlow2B = sessionData.paperKind === 'EXAM_PAPER' && sessionData.hasLinkedIQ && !!sessionData.linkedIQPaperId && !isUniversity;

  const defaultBranch = sessionData.branch || '';

  const defaultYear = isFlow2B && sessionData.linkedIQAssignment?.assignedToYear
    ? sessionData.linkedIQAssignment.assignedToYear.toString()
    : sessionData.subject?.year?.toString() || sessionData.year || '';

  const defaultSection = isFlow2B && sessionData.linkedIQAssignment?.assignedToSection
    ? sessionData.linkedIQAssignment.assignedToSection
    : sessionData.section || '';

  const [branch, setBranch] = useState(defaultBranch);
  const [section, setSection] = useState(defaultSection);
  const [year] = useState(defaultYear || '1'); // read-only now
  const [loading, setLoading] = useState(false);
  const [currentKind, setCurrentKind] = useState<PaperKind>(sessionData.paperKind as PaperKind || 'EXAM_PAPER');
  const [gateState, setGateState] = useState<GateState>(isFlow2B ? 'loading' : 'ready');
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [examDateInput, setExamDateInput] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [directExamDate, setDirectExamDate] = useState('');
  const [justAssigned, setJustAssigned] = useState(false);
  const needsDirectDate = gateState === 'ready' && currentKind === 'EXAM_PAPER' && !isFlow2B;

  const [fetchingDepts, setFetchingDepts] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<string>(sessionData.departmentId || '');

  // Evaluate gate on mount for Flow 2B
  useEffect(() => {
    if (!isFlow2B) return;
    evaluateGate(sessionData.linkedIQExamDate ?? null);
  }, [isFlow2B]);

  useEffect(() => {
    setFetchingDepts(true);
    api.get('/api/subjects')
      .then(res => {
        const subject = res.data.subjects?.find((s: any) => s.id === sessionData.subjectId);
        const depts = subject?.departments || [];
        setDepartments(depts);
        if (depts.length > 0 && !departmentId) {
          setDepartmentId(depts[0].id);
        }
      })
      .catch(() => setDepartments([]))
      .finally(() => setFetchingDepts(false));
  }, [sessionData.subjectId]);

  const selectedDept = departments.find(d => d.id === departmentId) || departments[0];

  useEffect(() => {
    if (departmentId === 'ALL') {
      setBranch('Common to All Branches');
    } else if (selectedDept) {
      setBranch(selectedDept.branch);
    }
  }, [selectedDept, departmentId]);

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
        assignedToYear: year ? parseInt(year) : 2,
        assignedToDepartmentId: departmentId === 'ALL' ? null : (departmentId || sessionData.departmentId || null),
        assignedToSection: section || null,
        rawQuestions: questions,
        kind: currentKind,
        linkedPaperId: currentKind === 'EXAM_PAPER' && sessionData.hasLinkedIQ && !isUniversity
          ? sessionData.linkedIQPaperId || null
          : null,
        examDate: isFlow2B ? (sessionData.linkedIQExamDate || examDateInput) : (needsDirectDate ? directExamDate : null),
        chatId: chatId || undefined,
        messageId: messageId || undefined,
      };

      const res = await api.post('/api/question-papers/save-and-assign', payload);
      const { paper, assignment, questions: savedQ } = res.data.data;

      setJustAssigned(true);

      // Download PDF for exam papers
      if (currentKind === 'EXAM_PAPER') {
        const toastId = toast.loading('Generating 100% accurate PDF with diagrams... Please wait.');
        console.log('[AssignModal] Starting PDF generation for paperId:', paper.id);
        try {
          console.log('[AssignModal] Fetching PDF from BE endpoint: /api/question-papers/' + paper.id + '/generate-pdf');
          const pdfRes = await api.get(
            `/api/question-papers/${paper.id}/generate-pdf`, 
            { responseType: 'blob' }
          );
          console.log('[AssignModal] PDF fetched successfully, blob size:', pdfRes.data.size);
          const url = window.URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' }));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `QuestionPaper_${paper.id}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => window.URL.revokeObjectURL(url), 5000);
          console.log('[AssignModal] PDF downloaded triggered successfully');
          toast.success('PDF generated successfully!', { id: toastId });
        } catch (err: any) {
          console.error('[AssignModal] PDF generation failed:', err);
          toast.error('Paper assigned successfully, but PDF download failed. Download from Papers page.', { id: toastId });
        }
      }

      const kindLabelText = currentKind === 'IMPORTANT_QUESTIONS' ? 'Important questions' : 'Exam paper';
      const successMsg = `[ASSIGN_SUCCESS]\n${kindLabelText} assigned successfully.\n\n${sessionData.subject?.name} — ${sessionData.examType}\n${branch} · ${year}\nSection: ${section || 'All Sections'}\n\nStudents will be notified.`;

      onSuccess(successMsg, currentKind, paper.id);
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

  const kindLabel = currentKind === 'IMPORTANT_QUESTIONS' ? 'Important Questions' : 'Exam Paper';

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
            <span className={currentKind === 'IMPORTANT_QUESTIONS'
              ? 'text-amber-400' : 'text-blue-400'}>
              {kindLabel}
            </span>
          </div>
        </div>

        {currentKind === 'EXAM_PAPER' && !sessionData.hasLinkedIQ && !sessionData.hasLinkedExamPaper && !justAssigned && (
          <div className="flex items-center justify-between bg-[#30302E] border border-[#3A3A38] rounded-xl px-4 py-3 mb-5">
            <span className="text-[12px] text-[#ECECEA]">Assign as Important Questions instead?</span>
            <button
              onClick={() => setCurrentKind('IMPORTANT_QUESTIONS')}
              className="text-[12px] font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              Swap to IQ
            </button>
          </div>
        )}

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
                onClick={async () => {
                  try {
                    const pdfRes = await api.get(
                      `/api/chats/messages/${messageId}/generate-pdf`, 
                      { responseType: 'blob' }
                    );
                    const url = window.URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' }));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `Preview.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  } catch {
                    toast.error('Failed to generate PDF. Please try again later.');
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
                  {fetchingDepts ? (
                     <div className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#8C8C8A]">Loading...</div>
                  ) : departments.length > 0 ? (
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#5A5A58]"
                    >
                      {isUniversity && <option value="ALL">All Departments</option>}
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      readOnly
                      value={sessionData.department || sessionData.subject?.department || ''}
                      className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#8C8C8A]"
                    />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 text-[13px] text-[#8C8C8A] shrink-0">Branch</label>
                  <input
                    value={branch}
                    readOnly={departments.length > 0}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. CSE, ECE"
                    className={`flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#5A5A58] ${departments.length > 0 ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 text-[13px] text-[#8C8C8A] shrink-0">Year</label>
                  <div className="flex-1 bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA]">
                    Year {year}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 text-[13px] text-[#8C8C8A] shrink-0">Section</label>
                  {isUniversity && currentKind === 'EXAM_PAPER' ? (
                     <div className="flex-1 bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA]">
                       All Sections (Common Paper)
                     </div>
                  ) : departments.length > 0 && selectedDept?.sections ? (
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#5A5A58]"
                    >
                      <option value="">All Sections</option>
                      {selectedDept.sections.map((s: string) => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      placeholder="e.g. A, B, All"
                      className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#5A5A58]"
                    />
                  )}
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
                type="button"
                onClick={onClose}
                className="flex-1 border border-[#3A3A38] rounded-xl py-2.5 text-[13px] text-[#8C8C8A] hover:bg-[#333331] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || (needsDirectDate && !directExamDate) || (isFlow2B && !section)}
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
