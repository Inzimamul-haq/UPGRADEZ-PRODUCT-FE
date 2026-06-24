"use client";

import React, { useEffect, useState } from "react";
import { z } from "zod";

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  departmentBranch: z
    .string()
    .min(1, "Department / Branch is required")
    .refine((val) => val.includes("/"), {
      message: "Must follow format: DEGREE/BRANCH",
    }),
  year: z.string().min(1, "Year is required"),
  regulation: z.string().min(1, "Regulation is required"),
});

export type SubjectFormValues = {
  name: string;
  code: string;
  departmentBranch: string;
  year: string;
  regulation: string;
  file: File | null;
  pdfUrl?: string | null;
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
  "BE/Computer Science Engineering",
  "BE/Electronics and Communication Engineering",
  "BE/Mechanical Engineering",
  "BE/Civil Engineering",
  "BE/Electrical and Electronics Engineering",
  "BTech/Information Technology",
  "BTech/Artificial Intelligence and Data Science",
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
  const [departmentBranch, setDepartmentBranch] = useState("");
  const [year, setYear] = useState("1");
  const [regulation, setRegulation] = useState("R2021");
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(initialValues?.name ?? "");
    setCode(initialValues?.code ?? "");

    let matchedDept = "";
    if (initialValues?.departmentBranch) {
      matchedDept =
        DEPARTMENT_OPTIONS.find(
          (opt) =>
            opt.toUpperCase() === initialValues.departmentBranch!.toUpperCase()
        ) ?? initialValues.departmentBranch;
    }
    setDepartmentBranch(matchedDept);
    setYear(initialValues?.year ?? "1");
    setRegulation(initialValues?.regulation ?? "R2021");
    setFile(null);
    setLocalError("");
  }, [open, initialValues]);

  if (!open) return null;

  const handleSubmit = async () => {
    setLocalError("");

    const parsed = subjectSchema.safeParse({
      name,
      code,
      departmentBranch,
      year,
      regulation,
    });

    if (!parsed.success) {
      setLocalError(parsed.error.issues[0].message);
      return;
    }

    if (mode === "add" && !file) {
      setLocalError("A PDF or DOCX syllabus file is required");
      return;
    }

    await onSubmit({
      name: name.trim(),
      code: code.trim(),
      departmentBranch: departmentBranch.trim(),
      year,
      regulation,
      file,
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
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
              value={departmentBranch}
              onChange={(e) => setDepartmentBranch(e.target.value)}
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
                  ? "Upload PDF / DOCX"
                  : "Update PDF / DOCX (Optional)"}
              </label>
            </div>
            
            {mode === "edit" && initialValues?.pdfUrl && (
              <div className="mb-2 rounded border border-[#3A3A38] bg-[#1F1F1E] px-3 py-2 text-[12px] text-[#8C8C8A]">
                <span className="text-[#ECECEA]">A syllabus file is already uploaded. </span>
              </div>
            )}
            
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full cursor-pointer rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#8C8C8A] file:mr-3 file:rounded file:border-0 file:bg-[#1F1F1E] file:px-2 file:py-1 file:text-[11px] file:text-[#ECECEA] hover:file:bg-[#333331] focus:border-[#4A4A48] focus:outline-none"
            />
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