"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { REGEX_PATTERNS } from '@/lib/utils';

type ExamType = 'CAT1' | 'CAT2' | 'CAT3' | 'MODEL' | 'UNIVERSITY';
type PaperKind = 'EXAM_PAPER' | 'IMPORTANT_QUESTIONS';

interface Department { id: string; name: string; branch: string; sections: string[] }
interface Subject { id: string; name: string; code: string }

interface ParsedQuestion { questionText: string; marks: number | null }

interface ExistingPaperInfo {
  exists: boolean;
  creatorName?: string | null;
  assignedSections?: string[];
  paperId?: string;
  otherKindExists?: boolean;
  otherKindLabel?: string;
  otherKindCreatorName?: string | null;
  otherKindAssignedSections?: string[];
}

interface UploadQPModalProps {
  onClose: () => void;
  onSuccess: () => void;
  /** Pre-selected subject if opened from a subject row */
  preSelectedSubject?: Subject | null;
}

const EXAM_TYPES: ExamType[] = ['CAT1', 'CAT2', 'CAT3', 'MODEL', 'UNIVERSITY'];
const DEFAULT_EXAM_LABELS: Record<string, string> = { CAT1: 'CAT 1', CAT2: 'CAT 2', CAT3: 'CAT 3', MODEL: 'Model', UNIVERSITY: 'University' };
const ARTS_EXAM_LABELS: Record<string, string> = { CAT1: 'CIA 1', CAT2: 'CIA 2', CAT3: 'CIA 3', MODEL: 'Model', UNIVERSITY: 'University' };

function currentAcYear() {
  const y = new Date().getFullYear();
  return `${y}-${String(y + 1).slice(-2)}`;
}

export function UploadQPModal({ onClose, onSuccess, preSelectedSubject }: UploadQPModalProps) {
  const toast = useToast();
  const { user } = useAuth();
  const isEngineering = user?.college?.name?.toLowerCase().includes('engineering') ?? true;
  const examLabels = isEngineering ? DEFAULT_EXAM_LABELS : ARTS_EXAM_LABELS;
  const maxYears = isEngineering ? 4 : 3;
  const YEAR_OPTIONS = Array.from({ length: maxYears }, (_, i) => i + 1);

  // ── Step ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Step-1 form state ─────────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(preSelectedSubject ?? null);
  const [examType, setExamType] = useState<ExamType>('CAT1');
  const [academicYear, setAcademicYear] = useState(currentAcYear());
  const [paperKind, setPaperKind] = useState<PaperKind>('EXAM_PAPER');
  const [departmentId, setDepartmentId] = useState('');
  const [assignedToYear, setAssignedToYear] = useState<number>(1);
  const [section, setSection] = useState('A');
  const [examDate, setExamDate] = useState('');
  const [availableSections, setAvailableSections] = useState<string[]>(['A', 'B']);

  // ── Duplicate check state ─────────────────────────────────────────────────
  const [checkingExists, setCheckingExists] = useState(false);
  const [existingPaper, setExistingPaper] = useState<ExistingPaperInfo | null>(null);

  // ── Step-2 PDF state ──────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step-3 results ────────────────────────────────────────────────────────
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [usedOCR, setUsedOCR] = useState(false);

  const isUniversityExamPaper = paperKind === 'EXAM_PAPER' && examType === 'UNIVERSITY';

  // ── Lock section to BOTH for University Exam Papers ──────────
  useEffect(() => {
    if (isUniversityExamPaper) {
      setSection('BOTH');
    }
  }, [isUniversityExamPaper]);

  // ── Load departments on mount ──────────────────────────────────
  useEffect(() => {
    api.get('/api/departments')
      .then(deptRes => {
        setDepartments(deptRes.data.departments || []);
        if (deptRes.data.departments?.length && !departmentId) {
          setDepartmentId(deptRes.data.departments[0].id);
        }
      })
      .catch(() => setDepartments([]));
  }, []);

  // ── Load subjects dynamically based on department & year ─────────────────
  useEffect(() => {
    if (!departmentId || !assignedToYear) {
      setSubjects(preSelectedSubject ? [preSelectedSubject] : []);
      return;
    }
    
    api.get('/api/subjects', { params: { departmentId, year: assignedToYear } })
      .then(res => {
        const fetchedSubjects = res.data.subjects || [];
        setSubjects(fetchedSubjects);
        // If the selected subject is no longer in the list, unselect it
        if (selectedSubject && !fetchedSubjects.some((s: Subject) => s.id === selectedSubject.id)) {
          if (!preSelectedSubject || preSelectedSubject.id !== selectedSubject.id) {
            setSelectedSubject(null);
          }
        }
      })
      .catch(() => setSubjects(preSelectedSubject ? [preSelectedSubject] : []));
  }, [departmentId, assignedToYear]);

  // ── Update available sections when department changes ─────────────────────
  useEffect(() => {
    const dept = departments.find(d => d.id === departmentId);
    const secs = dept?.sections?.length ? dept.sections : ['A', 'B'];
    setAvailableSections(secs);
    if (!secs.includes(section) && section !== 'BOTH') setSection(secs[0] || 'A');
  }, [departmentId, departments]);

  // ── Check duplicate whenever key fields change ────────────────────────────
  useEffect(() => {
    setExistingPaper(null);
    if (!selectedSubject || !examType || !academicYear || !departmentId || !assignedToYear) return;
    const timer = setTimeout(async () => {
      setCheckingExists(true);
      try {
        const { data } = await api.get('/api/question-papers/check-exists', {
          params: { subjectId: selectedSubject.id, examType, academicYear, departmentId, paperKind, assignedToYear },
        });
        // console.log('[UploadQPModal] /check-exists RES:', data);
        setExistingPaper(data);
      } catch (err) { 
        console.error('[UploadQPModal] /check-exists ERR:', err);
      } finally {
        setCheckingExists(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedSubject, examType, academicYear, departmentId, paperKind, assignedToYear]);

  const isSameKindBlocked = !!existingPaper?.exists && (isUniversityExamPaper || !!existingPaper.assignedSections?.includes(section));
  const isOtherKindBlocked = paperKind === 'IMPORTANT_QUESTIONS' && !!existingPaper?.otherKindExists && (isUniversityExamPaper || !!existingPaper.otherKindAssignedSections?.includes(section));
  
  const isBlocked = isSameKindBlocked || isOtherKindBlocked;
  const showOtherKindInfo = !isBlocked && !!existingPaper?.otherKindExists && (isUniversityExamPaper || !!existingPaper.otherKindAssignedSections?.includes(section));

  const blockedCreatorName = isSameKindBlocked ? existingPaper?.creatorName : existingPaper?.otherKindCreatorName;
  const blockedSections = isSameKindBlocked ? existingPaper?.assignedSections : existingPaper?.otherKindAssignedSections;
  const blockedLabel = isSameKindBlocked ? (paperKind === 'EXAM_PAPER' ? 'Exam Paper' : 'Important Questions') : 'Exam Paper';

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────────
  const handleProceedToUpload = () => {
    if (!selectedSubject) { toast.error('Please select a subject'); return; }
    if (!departmentId) { toast.error('Please select a department'); return; }
    if (!REGEX_PATTERNS.ACADEMIC_YEAR.test(academicYear)) { toast.error('Academic year must be YYYY-YY (e.g. 2025-26)'); return; }

    if (isUniversityExamPaper && academicYear === currentAcYear()) {
      if (!examDate) {
        toast.error("Exam date is mandatory for current academic year's University Exam Papers.");
        return;
      }
      const selected = new Date(examDate);
      selected.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected.getTime() !== today.getTime()) {
        toast.error("Exam date must be today's date for current academic year's University Exam Papers.");
        return;
      }
    }

    if (isBlocked) {
      toast.error(`Already uploaded by Prof. ${blockedCreatorName}`);
      return;
    }
    setStep(2);
  };

  // ── File drop / pick ──────────────────────────────────────────────────────
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') setFile(dropped);
    else toast.error('Only PDF files are accepted');
  };

  // ── Step 2 → parse & Step 3 ───────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) { toast.error('Please select a PDF file'); return; }
    setUploading(true);
    setUploadStatus('Uploading PDF…');

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('subjectId', selectedSubject!.id);
      form.append('examType', examType);
      form.append('paperKind', paperKind);
      form.append('academicYear', academicYear);
      form.append('assignedToYear', String(assignedToYear));
      if (departmentId !== 'ALL') {
        form.append('departmentId', departmentId);
      }
      if (section && section !== 'BOTH' && !isUniversityExamPaper) {
        form.append('assignedToSection', section);
      }
      if (examDate) form.append('examDate', examDate);

      setUploadStatus('Parsing questions with AI…');
      const { data } = await api.post('/api/question-papers/upload-pdf', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        setParsedQuestions(data.data.questions);
        setUsedOCR(data.data.usedOCR);
        setStep(3);
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  const marksColor = (m: number | null) => {
    if (!m) return 'text-[#5A5A58]';
    if (m <= 3) return 'text-green-400';
    if (m <= 7) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#3A3A38] bg-[#1A1A19] shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2C]">
          <div>
            <h2 className="text-[15px] font-medium text-[#ECECEA]">Upload Question Paper</h2>
            <p className="text-[11px] text-[#5A5A58] mt-0.5">
              Step {step} of 3 — {step === 1 ? 'Paper Details' : step === 2 ? 'Upload PDF' : 'Review & Confirm'}
            </p>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-1.5 mr-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={`w-2 h-2 rounded-full transition-colors ${s === step ? 'bg-[#ECECEA]' : s < step ? 'bg-[#5A5A58]' : 'bg-[#2E2E2C]'}`} />
            ))}
          </div>
          <button onClick={onClose} className="text-[#5A5A58] hover:text-[#ECECEA] transition-colors"><X size={16} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── STEP 1 ─────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">

              {/* Department */}
              <div>
                <label className="text-[11px] text-[#8C8C8A] uppercase tracking-wider mb-1.5 block">Department</label>
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#5A5A58]"
                >
                  <option value="">Select department…</option>
                  {isUniversityExamPaper && <option value="ALL">All Departments</option>}
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.branch} - {d.name}</option>
                  ))}
                </select>
              </div>

              {/* Year + Section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#8C8C8A] uppercase tracking-wider mb-1.5 block">Assigned Year</label>
                  <select
                    value={assignedToYear}
                    onChange={e => setAssignedToYear(Number(e.target.value))}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#5A5A58]"
                  >
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#8C8C8A] uppercase tracking-wider mb-1.5 block">Section</label>
                  <select
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    disabled={isUniversityExamPaper}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#5A5A58] disabled:opacity-50"
                  >
                    {availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}
                    <option value="BOTH">Both A &amp; B</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-[11px] text-[#8C8C8A] uppercase tracking-wider mb-1.5 block">Subject</label>
                <select
                  value={selectedSubject?.id || ''}
                  onChange={e => {
                    const s = subjects.find(s => s.id === e.target.value) || null;
                    setSelectedSubject(s);
                  }}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#5A5A58]"
                >
                  <option value="">Select subject…</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              {/* Two-col row: Exam Type + Academic Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#8C8C8A] uppercase tracking-wider mb-1.5 block">Exam Type</label>
                  <select
                    value={examType}
                    onChange={e => setExamType(e.target.value as ExamType)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#5A5A58]"
                  >
                    {EXAM_TYPES.map(t => <option key={t} value={t}>{examLabels[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#8C8C8A] uppercase tracking-wider mb-1.5 block">Academic Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    placeholder="2025-26"
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#5A5A58]"
                  />
                </div>
              </div>

              {/* Paper Kind */}
              <div>
                <label className="text-[11px] text-[#8C8C8A] uppercase tracking-wider mb-1.5 block">Paper Kind</label>
                <div className="flex gap-2">
                  {(['EXAM_PAPER', 'IMPORTANT_QUESTIONS'] as PaperKind[]).map(k => (
                    <button
                      key={k}
                      onClick={() => setPaperKind(k)}
                      className={`flex-1 py-2 rounded-lg text-[12px] font-medium border transition-colors ${paperKind === k ? 'bg-[#ECECEA] text-[#1C1C1B] border-[#ECECEA]' : 'text-[#8C8C8A] border-[#3A3A38] hover:border-[#5A5A58]'}`}
                    >
                      {k === 'EXAM_PAPER' ? 'Exam Paper' : 'Important Questions'}
                    </button>
                  ))}
                </div>
              </div>



              {/* Exam Date (optional) */}
              <div>
                <label className="text-[11px] text-[#8C8C8A] uppercase tracking-wider mb-1.5 block">Exam Date <span className="normal-case text-[#3A3A38]">(optional)</span></label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#5A5A58]"
                />
              </div>

              {/* Duplicate warning banner */}
              {checkingExists && (
                <div className="flex items-center gap-2 text-[12px] text-[#5A5A58]">
                  <Loader2 size={12} className="animate-spin" /> Checking for existing papers…
                </div>
              )}
              {!checkingExists && isBlocked && (
                <div className="rounded-xl border px-4 py-3 flex items-start gap-3 border-red-500/30 bg-red-500/5">
                  <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-medium text-red-400">{blockedLabel} already exists</p>
                    <p className="text-[12px] text-[#8C8C8A] mt-0.5">
                      Uploaded by <strong className="text-[#ECECEA]">Prof. {blockedCreatorName}</strong>
                      {blockedSections?.length && blockedSections[0] !== 'BOTH'
                        ? ` for Section ${blockedSections.join(', ')}`
                        : ''}.
                      {isOtherKindBlocked ? ' No need to upload Important Questions.' : ''}
                    </p>
                  </div>
                </div>
              )}
              {!checkingExists && showOtherKindInfo && (
                <div className="rounded-xl border px-4 py-3 flex items-start gap-3 border-amber-400/20 bg-amber-400/5">
                  <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-medium text-amber-400">{existingPaper?.otherKindLabel} already assigned</p>
                    <p className="text-[12px] text-[#8C8C8A] mt-0.5">
                      Assigned by <strong className="text-[#ECECEA]">Prof. {existingPaper?.otherKindCreatorName}</strong>. 
                      You can still upload the {paperKind === 'EXAM_PAPER' ? 'Exam Paper' : 'Important Questions'}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2 ─────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-green-500/40 bg-green-500/5' : 'border-[#3A3A38] hover:border-[#5A5A58]'}`}
              >
                <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                {file ? (
                  <>
                    <CheckCircle size={28} className="text-green-400 mb-3" />
                    <p className="text-[14px] font-medium text-[#ECECEA]">{file.name}</p>
                    <p className="text-[12px] text-[#5A5A58] mt-1">{(file.size / 1024).toFixed(0)} KB — click to change</p>
                  </>
                ) : (
                  <>
                    <Upload size={28} className="text-[#5A5A58] mb-3" />
                    <p className="text-[14px] text-[#8C8C8A]">Drag & drop a PDF here</p>
                    <p className="text-[12px] text-[#5A5A58] mt-1">or click to browse</p>
                  </>
                )}
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-[#2E2E2C] bg-[#222221] px-4 py-3 text-[12px] text-[#8C8C8A] space-y-1">
                <div className="flex justify-between"><span>Subject</span><span className="text-[#ECECEA]">{selectedSubject?.name}</span></div>
                <div className="flex justify-between"><span>Exam</span><span className="text-[#ECECEA]">{examLabels[examType]} · {academicYear}</span></div>
                <div className="flex justify-between"><span>Kind</span><span className="text-[#ECECEA]">{paperKind === 'EXAM_PAPER' ? 'Exam Paper' : 'Important Questions'}</span></div>
                <div className="flex justify-between"><span>Assigned</span><span className="text-[#ECECEA]">Year {assignedToYear} · Section {section}</span></div>
              </div>

              {uploading && (
                <div className="flex items-center gap-2 text-[13px] text-[#8C8C8A]">
                  <Loader2 size={14} className="animate-spin text-[#ECECEA]" /> {uploadStatus}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3 ─────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={16} className="text-green-400" />
                <p className="text-[13px] text-[#ECECEA] font-medium">{parsedQuestions.length} questions extracted {usedOCR ? '(via Gemini OCR)' : '(via PDF text)'}</p>
              </div>

              {/* Colour legend */}
              <div className="flex items-center gap-4 text-[11px] mb-1">
                <span className="text-green-400">● Low marks (≤3)</span>
                <span className="text-orange-400">● Medium (4–7)</span>
                <span className="text-red-400">● High (&gt;7)</span>
              </div>

              <div className="flex flex-col gap-2 max-h-[38vh] overflow-y-auto pr-1">
                {parsedQuestions.map((q, i) => (
                  <div key={i} className="rounded-lg border border-[#2E2E2C] bg-[#222221] px-4 py-3 flex items-start gap-3">
                    <span className={`text-[12px] font-medium flex-shrink-0 mt-0.5 w-6 ${marksColor(q.marks)}`}>Q{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#ECECEA] leading-relaxed">{q.questionText}</p>
                      {q.marks !== null && (
                        <p className={`text-[11px] mt-1 ${marksColor(q.marks)}`}>{q.marks} marks</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[#2E2E2C]">
          {step > 1 && (
            <button
              onClick={() => setStep(prev => (prev - 1) as any)}
              disabled={uploading}
              className="px-4 py-2 rounded-lg text-[13px] text-[#8C8C8A] border border-[#3A3A38] hover:bg-[#2C2C2A] transition-colors disabled:opacity-40"
            >
              Back
            </button>
          )}
          <div className="flex-1" />
          {step === 1 && (
            <button
              onClick={handleProceedToUpload}
              disabled={isBlocked}
              className="flex items-center gap-2 bg-[#ECECEA] text-[#1C1C1B] px-5 py-2 rounded-lg text-[13px] font-medium hover:bg-white transition-colors disabled:opacity-40"
            >
              Continue <ChevronRight size={14} />
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="flex items-center gap-2 bg-[#ECECEA] text-[#1C1C1B] px-5 py-2 rounded-lg text-[13px] font-medium hover:bg-white transition-colors disabled:opacity-40"
            >
              {uploading ? <><Loader2 size={13} className="animate-spin" /> Parsing…</> : <><FileText size={13} /> Upload & Parse</>}
            </button>
          )}
          {step === 3 && (
            <button
              onClick={() => { onSuccess(); onClose(); toast.success('Paper uploaded successfully!'); }}
              className="flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded-lg text-[13px] font-medium hover:bg-green-400 transition-colors"
            >
              <CheckCircle size={13} /> Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
