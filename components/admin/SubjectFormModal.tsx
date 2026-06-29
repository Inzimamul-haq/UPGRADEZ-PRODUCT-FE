"use client";

import React, { useEffect, useState } from "react";


import { subjectSchema } from "@/Schema/validations";

export type SubjectFormValues = {
  name: string;
  code: string;
  qualification: string;
  year: string;
  regulation: string;
  files: File[];
  pdfUrl?: string | null;
  uploadMode?: "replace" | "append";
};

type SubjectFormModalProps = {
  open: boolean;
  mode: "add" | "edit";
  title: string;
  initialValues?: Partial<SubjectFormValues>;
  isSubmitting?: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (values: SubjectFormValues) => Promise<void> | void;
};

const DEPARTMENT_OPTIONS = [
  "BE/CSE",
  "BE/ECE",
  "BE/MECH",
  "BE/CIVIL",
  "BE/EEE",
  "BTECH/IT",
  "BTECH/AI-DS",
];
const REGULATION_OPTIONS = ["R2021", "R2017"];

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
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [qualification, setQualification] = useState("");
  const [year, setYear] = useState("1");
  const [regulation, setRegulation] = useState("R2021");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<"replace" | "append">("append");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(initialValues?.name ?? "");
    setCode(initialValues?.code ?? "");

    let matchedDept = "";
    if (initialValues?.qualification) {
      matchedDept =
        DEPARTMENT_OPTIONS.find(
          (opt) =>
            opt.toUpperCase() === initialValues.qualification!.toUpperCase()
        ) ?? initialValues.qualification;
    }
    setQualification(matchedDept);
    setYear(initialValues?.year ?? "1");
    setRegulation(initialValues?.regulation ?? "R2021");
    setFiles([]);
    setUploadMode("append");
    setLocalError("");
  }, [open, initialValues]);

  if (!open) return null;

  const handleSubmit = async () => {
    setLocalError("");

    const parsed = subjectSchema.safeParse({
      name,
      code,
      qualification,
      year,
      regulation,
    });

    if (!parsed.success) {
      setLocalError(parsed.error.issues[0].message);
      return;
    }

    if (mode === "add" && files.length === 0) {
      setLocalError("At least one PDF syllabus file is required");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim(),
        qualification: qualification.trim(),
        year,
        regulation,
        files,
        uploadMode,
      });
    } catch (err: any) {
      // Page-level handler throws on API error; show it inline here too
      const msg = err?.response?.data?.error ?? err?.message ?? 'Something went wrong';
      setLocalError(msg);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-xl">
        <h2 className="mb-5 text-[14px] font-medium text-[#ECECEA]">{title}</h2>

        <div className="space-y-4">
          {/* Name + Code */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">
                Subject Name
              </label>
              <input
                placeholder="e.g. Data Structures"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">
                Subject Code
              </label>
              <input
                placeholder="e.g. CS8391"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
              />
            </div>
          </div>

          {/* Department / Branch */}
          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">
              Department / Branch
            </label>
            <select
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
            >
              <option value="" disabled>
                Select Department/Branch
              </option>
              {DEPARTMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Year + Regulation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">
                Year
              </label>
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
            </div>

            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">
                Regulation
              </label>
              <select
                value={regulation}
                onChange={(e) => setRegulation(e.target.value)}
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
              >
                {REGULATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-[12px] text-[#8C8C8A]">
                {mode === "add"
                  ? "Upload PDF"
                  : "Update PDF (Optional)"}
              </label>
            </div>

            {mode === "edit" && initialValues?.pdfUrl && (
              <div className="mb-2 flex flex-col gap-2 rounded-lg border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#8C8C8A]">Current file(s):</span>
                  <div className="flex items-center gap-3 text-[11px] text-[#ECECEA]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="uploadMode"
                        checked={uploadMode === "append"} 
                        onChange={() => setUploadMode("append")}
                        className="accent-[#ECECEA]"
                      /> 
                      Add More
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="uploadMode"
                        checked={uploadMode === "replace"} 
                        onChange={() => setUploadMode("replace")}
                        className="accent-amber-500"
                      /> 
                      Replace All
                    </label>
                  </div>
                </div>
                {uploadMode === "replace" && files.length > 0 && (
                  <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400 w-fit">
                    Warning: Old files and embeddings will be deleted
                  </span>
                )}
                {uploadMode === "append" && files.length > 0 && (
                  <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400 w-fit">
                    New files will be embedded alongside existing ones
                  </span>
                )}
                <div className="flex flex-col gap-1 mt-1">
                  {initialValues.pdfUrl.split(',').map((url, idx) => (
                     <span key={idx} className="truncate text-[11px] text-[#ECECEA]">- {url.split('/').pop()}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5">
                  <span className="truncate text-[12px] text-[#ECECEA]">{f.name}</span>
                  <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="text-[12px] text-red-400 hover:text-red-300">Remove</button>
                </div>
              ))}
              <label className="cursor-pointer inline-flex items-center justify-center rounded-md border border-[#3A3A38] bg-[#1F1F1E] px-3 py-2 text-[12px] text-[#ECECEA] transition-colors hover:bg-[#2C2C2A]">
                {files.length === 0 ? "Select File" : "+ Add another file"}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFiles([...files, e.target.files[0]]);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {(localError || serverError) && (
            <p className="text-[12px] text-red-400">{localError || serverError}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-[#3A3A38] px-4 py-2 text-[13px] text-[#B0B0AE] transition-colors hover:bg-[#2C2C2A] disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-2 text-[13px] text-[#ECECEA] transition-colors hover:bg-[#333331] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? mode === "add"
                  ? "Uploading..."
                  : "Saving..."
                : mode === "add"
                  ? "Add Subject"
                  : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}