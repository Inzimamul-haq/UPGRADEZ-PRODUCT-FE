"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { subjectSchema } from "@/Schema/validations";
import api from "@/lib/api";
import { DepartmentOption, SubjectFormModalProps } from "@/lib/types";
import SyllabusPdfGeneratorModal from "./SyllabusPdfGeneratorModal";
import { saveDraft, loadDraft, clearDraft, SubjectDraft } from "@/lib/subjectDraft";

// ─── Step indicator ────────────────────────────────────────────────────────────
type StepId = 1 | 2 | 3;
const STEPS: { id: StepId; label: string }[] = [
  { id: 1, label: "Basics" },
  { id: 2, label: "Syllabus" },
  { id: 3, label: "Textbooks" },
];

function StepIndicator({
  current,
  onGoTo,
}: {
  current: StepId;
  onGoTo: (s: StepId) => void;
}) {
  return (
    <div className="mb-5 flex items-center gap-0">
      {STEPS.map((s, i) => {
        const done = s.id < current;
        const active = s.id === current;
        const clickable = done; // only completed steps are clickable

        return (
          <React.Fragment key={s.id}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onGoTo(s.id)}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors
                ${active ? "text-[#ECECEA]" : done ? "cursor-pointer text-[#8C8C8A] hover:text-[#ECECEA]" : "cursor-default text-[#4A4A48]"}
              `}
            >
              {/* circle */}
              <span
                className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border text-[9px]
                  ${active ? "border-[#ECECEA] bg-[#ECECEA] text-[#1F1F1E]" : done ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-[#3A3A38] text-[#4A4A48]"}
                `}
              >
                {done ? "✓" : s.id}
              </span>
              {s.label}
            </button>

            {i < STEPS.length - 1 && (
              <span className="mx-1 text-[#3A3A38]">→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main modal ────────────────────────────────────────────────────────────────
export default function SubjectFormModal({
  open,
  mode,
  title,
  initialValues,
  isSubmitting = false,
  serverError = "",
  onClose,
  onSubmit,
}: SubjectFormModalProps) {
  // ── Field state ──────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [regulations, setRegulations] = useState<string[]>([]);
  const [year, setYear] = useState("1");
  const [regulation, setRegulation] = useState("R2021");
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<"replace" | "append">("append");
  const [localError, setLocalError] = useState("");
  const [courseOutcomes, setCourseOutcomes] = useState<{ code: string; description: string }[]>([]);

  // ── Wizard state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<StepId>(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Draft state ──────────────────────────────────────────────────────────────
  // Draft banner has been moved to a card on the page level. 
  // This modal now automatically resumes any existing draft upon opening.

  // ── Syllabus attach feedback ──────────────────────────────────────────────────
  const [syllabusJustAttached, setSyllabusJustAttached] = useState(false);
  // true when user resumed a draft that was saved on step 3 — files need re-attaching
  const [resumedFromDraft, setResumedFromDraft] = useState(false);

  // ── Generator modal ───────────────────────────────────────────────────────────
  const [showPdfGenerator, setShowPdfGenerator] = useState(false);
  // Step 2 secondary upload path toggle
  const [showUploadInput, setShowUploadInput] = useState(false);
  // Validation for manual upload
  const [syllabusFileError, setSyllabusFileError] = useState("");

  const [hasInitialized, setHasInitialized] = useState(false);

  // ── Init on open ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setHasInitialized(false);
      return;
    }

    if (!hasInitialized) {
      if (mode === "add") {
        const draft = loadDraft();
        if (draft) {
          // Auto-resume draft
          setName(draft.name);
          setCode(draft.code);
          setDepartmentIds(draft.departmentIds);
          setYear(draft.year);
          setRegulation(draft.regulation);
          setCourseOutcomes(draft.courseOutcomes ?? []);
          setStep(draft.step);
          if (draft.step === 3) setResumedFromDraft(true);
        } else {
          setName("");
          setCode("");
          setDepartmentIds([]);
          setYear("1");
          setRegulation("R2021");
          setCourseOutcomes([]);
          setStep(1);
        }
      } else {
        // Edit mode — restore from initialValues, no draft
        setName(initialValues?.name ?? "");
        setCode(initialValues?.code ?? "");
        setDepartmentIds(initialValues?.departmentIds ?? []);
        setYear(initialValues?.year ?? "1");
        setRegulation(initialValues?.regulation ?? "R2021");
        setCourseOutcomes(initialValues?.courseOutcomes ?? []);
        setStep(1);
      }

      setSyllabusFile(null);
      setMaterialFiles([]);
      setUploadMode("append");
      setLocalError("");
      setFieldErrors({});
      setSyllabusJustAttached(false);
      setShowUploadInput(false);
      setHasInitialized(true);
    }
  }, [open, initialValues, hasInitialized, mode]);

  // ── Load departments + regulations ───────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      try {
        setLoadingDepartments(true);
        const [deptRes, regRes] = await Promise.all([
          api.get<{ departments: DepartmentOption[] }>("/api/departments").catch(() => ({ data: { departments: [] } })),
          api.get("/subjects/regulations").catch(() => ({ data: { data: [] } })),
        ]);
        setDepartments(deptRes.data.departments ?? []);
        setRegulations(regRes.data.data ?? []);
      } catch {
        setLocalError("Failed to load form data");
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadData();
  }, [open]);

  // ── Draft auto-save (debounced 600ms) ────────────────────────────────────────
  useEffect(() => {
    if (mode !== "add" || !open) return;

    const id = setTimeout(() => {
      saveDraft({ name, code, departmentIds, year, regulation, courseOutcomes, step });
    }, 600);

    return () => clearTimeout(id);
  }, [name, code, departmentIds, year, regulation, courseOutcomes, step, open, mode]);

  if (!open) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const toggleDepartment = (id: string) => {
    setDepartmentIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  // Banner UI and manual Resume/Discard have been moved outside.

  // ── Step 1 validation ────────────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    const result = subjectSchema.safeParse({ name, code, departmentIds, year, regulation });
    if (result.success) {
      setFieldErrors({});
      return true;
    }
    const errs: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const key = String(issue.path[0] ?? "");
      if (key && !errs[key]) errs[key] = issue.message;
    });
    setFieldErrors(errs);
    return false;
  };

  const handleNext = () => {
    setLocalError("");
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setLocalError("");
    setStep((prev) => (prev > 1 ? ((prev - 1) as StepId) : prev));
  };

  // ── Syllabus generated callback ──────────────────────────────────────────────
  const handleSyllabusGenerated = (file: File, outcomes?: { code: string; description: string }[]) => {
    setSyllabusFile(file);
    if (outcomes && outcomes.length > 0) {
      setCourseOutcomes(outcomes);
    }
    setSyllabusFileError("");
    setResumedFromDraft(false);
    setSyllabusJustAttached(true);
    setTimeout(() => {
      setSyllabusJustAttached(false);
      setStep(3);
    }, 1200);
  };

  // ── Final submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLocalError("");

    if (mode === "add") {
      if (!validateStep1()) {
        setLocalError("Basic information is incomplete or invalid. Please check Step 1.");
        setStep(1);
        return;
      }
      if (!syllabusFile) {
        setLocalError("An official syllabus PDF or image is required.");
        return;
      }
      if (materialFiles.length === 0) {
        setLocalError("At least one textbook PDF/DOCX is required.");
        return;
      }
    }

    if (syllabusFile) {
      const isPdf = syllabusFile.type.includes("pdf") || syllabusFile.name.endsWith(".pdf");
      const isImage =
        syllabusFile.type.includes("image/") ||
        syllabusFile.name.endsWith(".png") ||
        syllabusFile.name.endsWith(".jpg") ||
        syllabusFile.name.endsWith(".jpeg");
      if (!isPdf && !isImage) {
        setLocalError("Syllabus must be a PDF or image.");
        return;
      }
    }

    if (materialFiles.length > 0) {
      for (const file of materialFiles) {
        const isPdf = file.type.includes("pdf") || file.name.endsWith(".pdf");
        const isWord =
          file.type.includes("word") ||
          file.name.endsWith(".docx") ||
          file.name.endsWith(".doc");
        if (!isPdf && !isWord) {
          setLocalError("Image files are not supported for textbooks. Please upload a PDF or DOCX.");
          return;
        }
      }
    }

    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim(),
        departmentIds,
        year,
        regulation,
        courseOutcomes,
        syllabusFile,
        materialFiles,
        uploadMode,
      });
      // Success — clear draft
      clearDraft();
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Something went wrong";
      setLocalError(msg);
    }
  };

  // ── Backdrop click ───────────────────────────────────────────────────────────
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget || isSubmitting) return;
    if (mode === "add") {
      const hasData =
        name || code || departmentIds.length > 0 || syllabusFile || materialFiles.length > 0 || courseOutcomes.length > 0;
      if (hasData) {
        // Silently save draft and close
        saveDraft({ name, code, departmentIds, year, regulation, courseOutcomes, step });
      }
    }
    onClose();
  };

  // ── Ordinal helper ────────────────────────────────────────────────────────────
  const yearLabel = (y: string) => {
    const n = Number(y);
    return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"} Year`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-xl">
        {/* Title */}
        <h2 className="mb-4 text-[14px] font-medium text-[#ECECEA]">{title}</h2>

        {/* Step indicator — add mode only */}
        {mode === "add" && (
          <StepIndicator
            current={step}
            onGoTo={(s) => {
              // Only allow jumping to completed steps
              if (s < step) setStep(s);
            }}
          />
        )}

        {/* ═══════════════ STEP 1 — BASICS ══════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Subject Name */}
              <div>
                <label className="mb-1 block text-[12px] text-[#8C8C8A]">Subject Name</label>
                <input
                  placeholder="e.g. Data Structures"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
                  className={`w-full rounded-md border bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none ${fieldErrors.name ? "border-red-500/60" : "border-[#3A3A38] focus:border-[#4A4A48]"}`}
                />
                {fieldErrors.name && <p className="mt-1 text-[11px] text-red-400">{fieldErrors.name}</p>}
              </div>

              {/* Subject Code */}
              <div>
                <label className="mb-1 block text-[12px] text-[#8C8C8A]">Subject Code</label>
                <input
                  placeholder="e.g. CS8391"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setFieldErrors((p) => ({ ...p, code: "" })); }}
                  className={`w-full rounded-md border bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none ${fieldErrors.code ? "border-red-500/60" : "border-[#3A3A38] focus:border-[#4A4A48]"}`}
                />
                {fieldErrors.code && <p className="mt-1 text-[11px] text-red-400">{fieldErrors.code}</p>}
              </div>
            </div>

            {/* Departments */}
            <div>
              <label className="mb-2 block text-[12px] text-[#8C8C8A]">
                Departments (select all that share this subject)
              </label>
              {loadingDepartments ? (
                <p className="text-[12px] text-[#5A5A58]">Loading departments...</p>
              ) : departments.length === 0 ? (
                <p className="text-[12px] text-amber-400">
                  No departments found. Add departments first from the Departments page.
                </p>
              ) : (
                <div className={`grid grid-cols-1 gap-2 rounded-md border bg-[#2C2C2A] p-3 ${fieldErrors.departmentIds ? "border-red-500/60" : "border-[#3A3A38]"}`}>
                  {departments.map((dept) => (
                    <label key={dept.id} className="flex cursor-pointer items-center gap-2 text-[12px] text-[#ECECEA]">
                      <input
                        type="checkbox"
                        checked={departmentIds.includes(dept.id)}
                        onChange={() => { toggleDepartment(dept.id); setFieldErrors((p) => ({ ...p, departmentIds: "" })); }}
                        className="accent-[#ECECEA]"
                      />
                      {dept.branch} · {dept.name}
                    </label>
                  ))}
                </div>
              )}
              {fieldErrors.departmentIds && (
                <p className="mt-1 text-[11px] text-red-400">{fieldErrors.departmentIds}</p>
              )}
            </div>

            {/* Year + Regulation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[12px] text-[#8C8C8A]">Year</label>
                {mode === "edit" ? (
                  <div className="w-full cursor-not-allowed rounded-md border border-[#3A3A38] bg-[#2C2C2A]/50 px-3 py-2 text-[13px] text-[#8C8C8A]">
                    {yearLabel(year)}
                  </div>
                ) : (
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[12px] text-[#8C8C8A]">Regulation</label>
                {mode === "edit" ? (
                  <div className="w-full cursor-not-allowed rounded-md border border-[#3A3A38] bg-[#2C2C2A]/50 px-3 py-2 text-[13px] text-[#8C8C8A]">
                    {regulation || "—"}
                  </div>
                ) : (
                  <input
                    placeholder="e.g. R2021"
                    value={regulation}
                    onChange={(e) => setRegulation(e.target.value)}
                    className={`w-full rounded-md border bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none ${fieldErrors.regulation ? "border-red-500/60" : "border-[#3A3A38] focus:border-[#4A4A48]"}`}
                  />
                )}
                {fieldErrors.regulation && (
                  <p className="mt-1 text-[11px] text-red-400">{fieldErrors.regulation}</p>
                )}
              </div>
            </div>

            {mode === "edit" && (
              <p className="text-[11px] text-[#5A5A58]">
                Year, Regulation, and Syllabus PDF cannot be changed after creation. Delete and re-add the subject to change these.
              </p>
            )}

            {/* Edit mode — also show syllabus + materials below basics */}
            {mode === "edit" && (
              <>
                {/* Syllabus (locked) */}
     
                {/* Materials */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-[12px] text-[#8C8C8A]">Update Textbooks pdf</label>
                  </div>

                  {initialValues?.pdfUrl && (
                    <div className="mb-2 flex flex-col gap-2 rounded-lg border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#8C8C8A]">Current file(s):</span>
                        <div className="flex items-center gap-3 text-[11px]">
                         <label className="flex cursor-pointer items-center gap-1.5 text-[#ECECEA]">
                            <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${uploadMode === "append" ? "border-white" : "border-[#5A5A58]"}`}>
                              {uploadMode === "append" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </span>
                            <input type="radio" name="uploadMode" checked={uploadMode === "append"} onChange={() => setUploadMode("append")} className="sr-only" />
                            Add More
                          </label>
                          <label className="flex cursor-pointer items-center gap-1.5 text-red-400">
                            <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${uploadMode === "replace" ? "border-red-500" : "border-[#5A5A58]"}`}>
                              {uploadMode === "replace" && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                            </span>
                            <input type="radio" name="uploadMode" checked={uploadMode === "replace"} onChange={() => setUploadMode("replace")} className="sr-only" />
                            Replace All
                          </label>
                        </div>
                      </div>
                      {uploadMode === "replace" && materialFiles.length > 0 && (
                        <span className="w-fit rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                          Warning: Old files and embeddings will be deleted
                        </span>
                      )}
                      {uploadMode === "append" && materialFiles.length > 0 && (
                        <span className="w-fit rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400">
                          New files will be embedded alongside existing ones
                        </span>
                      )}
                      <div className="mt-1 flex flex-col gap-1">
                        {initialValues.pdfUrl!.split(",").map((url, idx) => (
                          <span key={idx} className="truncate text-[11px] text-[#ECECEA]">
                            - {url.split("/").pop()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {materialFiles.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5">
                        <span className="truncate text-[12px] text-[#ECECEA]">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setMaterialFiles(materialFiles.filter((_, i) => i !== idx))}
                          className="text-[12px] text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#3A3A38] bg-[#1F1F1E] px-3 py-2 text-[12px] text-[#ECECEA] transition-colors hover:bg-[#2C2C2A]">
                      {materialFiles.length === 0 ? "Select textbooks" : "+ Add another textbook"}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setMaterialFiles([...materialFiles, e.target.files[0]]);
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Course Outcomes in Edit Mode */}
                <div className="rounded-lg border border-[#3A3A38] bg-[#252523] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-[12px] font-medium text-[#ECECEA]">Course Outcomes (CO)</h4>
                      <p className="text-[11px] text-[#8C8C8A]">Edit descriptions for this subject</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (courseOutcomes.length < 10) {
                          const nextNum = courseOutcomes.length + 1;
                          setCourseOutcomes([...courseOutcomes, { code: `CO${nextNum}`, description: "" }]);
                        }
                      }}
                      disabled={courseOutcomes.length >= 10}
                      className="rounded border border-[#4A4A48] bg-[#2C2C2A] px-2 py-1 text-[11px] text-[#ECECEA] hover:bg-[#333331] disabled:opacity-40"
                    >
                      + Add CO
                    </button>
                  </div>

                  {courseOutcomes.length === 0 ? (
                    <p className="py-2 text-center text-[11px] text-[#6A6A68]">
                      No course outcomes defined. Click &quot;+ Add CO&quot; to add one.
                    </p>
                  ) : (
                    <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                      {courseOutcomes.map((co, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={co.code}
                            onChange={(e) => {
                              const updated = [...courseOutcomes];
                              updated[idx] = { ...updated[idx], code: e.target.value.toUpperCase().replace(/\s+/g, '') };
                              setCourseOutcomes(updated);
                            }}
                            placeholder="CO1"
                            className="w-16 rounded border border-[#3A3A38] bg-[#1F1F1E] px-2 py-1 text-center text-[12px] font-medium text-[#ECECEA] focus:outline-none"
                          />
                          <input
                            type="text"
                            value={co.description}
                            onChange={(e) => {
                              const updated = [...courseOutcomes];
                              updated[idx] = { ...updated[idx], description: e.target.value };
                              setCourseOutcomes(updated);
                            }}
                            placeholder="Outcome description..."
                            className="flex-1 rounded border border-[#3A3A38] bg-[#1F1F1E] px-2.5 py-1 text-[12px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setCourseOutcomes(courseOutcomes.filter((_, i) => i !== idx))}
                            className="text-[12px] text-red-400 hover:text-red-300"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {(localError || serverError) && (
              <p className="text-[12px] text-red-400">{localError || serverError}</p>
            )}

            {/* Footer */}
            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-md border border-[#3A3A38] px-4 py-2 text-[13px] text-[#B0B0AE] transition-colors hover:bg-[#2C2C2A] disabled:opacity-40"
              >
                Cancel
              </button>

              {mode === "add" ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-2 text-[13px] text-[#ECECEA] transition-colors hover:bg-[#333331]"
                >
                  Next <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-2 text-[13px] text-[#ECECEA] transition-colors hover:bg-[#333331] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 2 — SYLLABUS ════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-[12px] text-[#8C8C8A]">
              Generate a formatted syllabus PDF from text.
            </p>

            {/* Syllabus just-attached flash */}
            {syllabusJustAttached && (
              <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-[12px] text-green-400">
                <span>✓</span>
                <span>Syllabus generated — moving to textbooks…</span>
              </div>
            )}

            {/* Primary path — Generate PDF */}
            <button
              type="button"
              onClick={() => setShowPdfGenerator(true)}
              className="w-full rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-2.5 text-[13px] font-medium text-[#ECECEA] transition-colors hover:bg-[#333331]"
            >
              Generate PDF from Text
            </button>

            {courseOutcomes.length > 0 && (
              <div className="flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-400">
                <span>✓ {courseOutcomes.length} Course Outcome(s) configured from Syllabus</span>
                <span className="text-[11px] opacity-80">{courseOutcomes.map(c => c.code).join(", ")}</span>
              </div>
            )}

            {(localError || serverError) && (
              <p className="text-[12px] text-red-400">{localError || serverError}</p>
            )}

            {/* Footer */}
            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-md border border-[#3A3A38] px-4 py-2 text-[13px] text-[#B0B0AE] transition-colors hover:bg-[#2C2C2A] disabled:opacity-40"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={syllabusJustAttached}
                className="flex items-center gap-1.5 rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-2 text-[13px] text-[#ECECEA] transition-colors hover:bg-[#333331] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 3 — TEXTBOOKS ═══════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-4">
            {/* <p className="text-[12px] text-[#8C8C8A]">
              Upload your syllabus PDF (if not generated), and upload at least one textbook. Textbooks are embedded for the AI (PDF or DOCX only).
            </p> */}

            {/* Resumed-from-step-3 warning */}
            {resumedFromDraft && !syllabusFile && (
              <div className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-400">
                Files can't be saved as a draft — please re-attach your syllabus and textbooks.
              </div>
            )}

            {/* SYLLABUS UPLOAD */}
            <div className="flex flex-col gap-2 border-b border-[#3A3A38] pb-4">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[#ECECEA]">Syllabus (Required)</label>
                {!syllabusFile && (
                  <span className="text-[11px] text-amber-400 leading-relaxed">
                    ⚠️ IMPORTANT : Please upload exactly this file: <strong>{`${name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Syllabus.pdf`}</strong> which has been stored in your files. If you do not have this file, please go back to the Syllabus step, generate the PDF, and it will be uploaded automatically.
                  </span>
                )}
              </div>
              
              {/* File already attached */}
              {syllabusFile ? (
                <div className="flex items-center justify-between rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5">
                  <span className="truncate text-[12px] text-[#ECECEA]">{syllabusFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setSyllabusFile(null); }}
                    className="text-[12px] text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#3A3A38] bg-[#1F1F1E] px-3 py-2 text-[12px] text-[#ECECEA] transition-colors hover:bg-[#2C2C2A]">
                  Select syllabus PDF or image
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        const expectedName = `${name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Syllabus.pdf`;
                        if (file.name !== expectedName) {
                          setSyllabusFileError(`The pdf is wrong. Please make a new file from the generate pdf (previous step) and upload that.`);
                          e.target.value = "";
                          return;
                        }
                        setSyllabusFileError("");
                        setSyllabusFile(file);
                        e.target.value = "";
                        setResumedFromDraft(false); // Clear warning if they re-attach
                      }
                    }}
                  />
                </label>
              )}
              
              {syllabusFileError && (
                <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
                  {syllabusFileError}
                </div>
              )}
            </div>

            {/* TEXTBOOKS UPLOAD */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-medium text-[#ECECEA]">Textbooks Pdf</label>
              {materialFiles.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5"
                >
                  <span className="truncate text-[12px] text-[#ECECEA]">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setMaterialFiles(materialFiles.filter((_, i) => i !== idx))}
                    className="text-[12px] text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[#3A3A38] bg-[#1F1F1E] px-3 py-2 text-[12px] text-[#ECECEA] transition-colors hover:bg-[#2C2C2A]">
                {materialFiles.length === 0 ? "Select textbooks" : "+ Add another textbook"}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setMaterialFiles([...materialFiles, e.target.files[0]]);
                      e.target.value = "";
                      setResumedFromDraft(false); // Clear warning if they re-attach
                    }
                  }}
                />
              </label>
            </div>

            {(localError || serverError) && (
              <p className="text-[12px] text-red-400">{localError || serverError}</p>
            )}

            {/* Footer */}
            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-md border border-[#3A3A38] px-4 py-2 text-[13px] text-[#B0B0AE] transition-colors hover:bg-[#2C2C2A] disabled:opacity-40"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !syllabusFile || materialFiles.length === 0}
                className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-2 text-[13px] text-[#ECECEA] transition-colors hover:bg-[#333331] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Uploading…" : "Add Subject"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generator modal — z-[60] so it sits above the form modal */}
      <SyllabusPdfGeneratorModal
        open={showPdfGenerator}
        onClose={() => setShowPdfGenerator(false)}
        subjectName={name}
        onGenerated={handleSyllabusGenerated}
      />
    </div>
  );
}
