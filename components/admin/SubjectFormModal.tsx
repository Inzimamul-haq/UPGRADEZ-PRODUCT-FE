"use client";

import React, { useEffect, useMemo, useState } from "react";
import { subjectSchema } from "@/Schema/validations";
import api from "@/lib/api";
import { DepartmentOption, SubjectFormModalProps } from "@/lib/types";

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

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!open) {
      setHasInitialized(false);
      return;
    }

    if (!hasInitialized) {
      setName(initialValues?.name ?? "");
      setCode(initialValues?.code ?? "");
      setDepartmentIds(initialValues?.departmentIds ?? []);
      setYear(initialValues?.year ?? "1");
      setRegulation(initialValues?.regulation ?? "R2021");
      setSyllabusFile(null);
      setMaterialFiles([]);
      setUploadMode("append");
      setLocalError("");
      setHasInitialized(true);
    }
  }, [open, initialValues, hasInitialized]);

  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      try {
        setLoadingDepartments(true);
        const [deptRes, regRes] = await Promise.all([
          api.get<{ departments: DepartmentOption[] }>("/api/departments").catch(() => ({ data: { departments: [] } })),
          api.get("/subjects/regulations").catch(() => ({ data: { data: [] } }))
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

  const filteredDepartments = departments;

  if (!open) return null;

  const toggleDepartment = (id: string) => {
    setDepartmentIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setLocalError("");

    const parsed = subjectSchema.safeParse({
      name,
      code,
      departmentIds,
      year,
      regulation,
    });

    if (!parsed.success) {
      setLocalError(parsed.error.issues[0].message);
      return;
    }

    if (mode === "add" && !syllabusFile) {
      setLocalError("An Official Syllabus PDF or Image is required");
      return;
    }

    // Pre-validate syllabus
    if (syllabusFile) {
      const isPdf = syllabusFile.type.includes("pdf") || syllabusFile.name.endsWith(".pdf");
      const isImage = syllabusFile.type.includes("image/") || syllabusFile.name.endsWith(".png") || syllabusFile.name.endsWith(".jpg") || syllabusFile.name.endsWith(".jpeg");
      if (!isPdf && !isImage) {
        setLocalError("Syllabus must be a PDF or Image.");
        return;
      }
    }

    // Pre-validate materials
    if (materialFiles.length > 0) {
      for (const file of materialFiles) {
        const isPdf = file.type.includes("pdf") || file.name.endsWith(".pdf");
        const isWord = file.type.includes("word") || file.name.endsWith(".docx") || file.name.endsWith(".doc");
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
        syllabusFile,
        materialFiles,
        uploadMode,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ?? err?.message ?? "Something went wrong";
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
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-xl">
        <h2 className="mb-5 text-[14px] font-medium text-[#ECECEA]">{title}</h2>

        <div className="space-y-4">
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
          <div>
            <label className="mb-2 block text-[12px] text-[#8C8C8A]">
              Departments (select all that share this subject)
            </label>
            {loadingDepartments ? (
              <p className="text-[12px] text-[#5A5A58]">Loading departments...</p>
            ) : filteredDepartments.length === 0 ? (
              <p className="text-[12px] text-amber-400">
                No departments found. Add departments first from the Departments page.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 rounded-md border border-[#3A3A38] bg-[#2C2C2A] p-3">
                {filteredDepartments.map((dept) => (
                  <label
                    key={dept.id}
                    className="flex cursor-pointer items-center gap-2 text-[12px] text-[#ECECEA]"
                  >
                    <input
                      type="checkbox"
                      checked={departmentIds.includes(dept.id)}
                      onChange={() => toggleDepartment(dept.id)}
                      className="accent-[#ECECEA]"
                    />
                    {dept.branch} · {dept.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">
                Year
              </label>
              {mode === 'edit' ? (
                <div className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A]/50 px-3 py-2 text-[13px] text-[#8C8C8A] cursor-not-allowed">
                  {year === '1' ? '1st' : year === '2' ? '2nd' : year === '3' ? '3rd' : `${year}th`} Year
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
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">
                Regulation
              </label>
              {mode === 'edit' ? (
                <div className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A]/50 px-3 py-2 text-[13px] text-[#8C8C8A] cursor-not-allowed">
                  {regulation || '—'}
                </div>
              ) : (
                <input
                  placeholder="e.g. R2021"
                  value={regulation}
                  onChange={(e) => setRegulation(e.target.value)}
                  className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
                />
              )}
            </div>
          </div>
          {mode === 'edit' && (
            <p className="-mt-2 text-[11px] text-[#5A5A58]">
              Year, Regulation, and Syllabus PDF cannot be changed after creation. Delete and re-add the subject to change these.
            </p>
          )}

          {/* Syllabus Upload */}
          <div>
            <label className="block text-[12px] text-[#8C8C8A] mb-2">
              Syllabus index pdf or image {mode === 'add' && "(Required)"}
            </label>
            <div className={`flex flex-col gap-2 ${mode === 'edit' ? 'opacity-50 pointer-events-none' : ''}`}>
              {syllabusFile && (
                <div className="flex items-center justify-between rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5">
                  <span className="truncate text-[12px] text-[#ECECEA]">{syllabusFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSyllabusFile(null)}
                    className="text-[12px] text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              )}
              {!syllabusFile && (
                <label className={`inline-flex items-center justify-center rounded-md border border-[#3A3A38] bg-[#1F1F1E] px-3 py-2 text-[12px] text-[#ECECEA] transition-colors ${mode === 'edit' ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[#2C2C2A]'}`}>
                  {mode === 'edit' ? 'Syllabus Cannot Be Changed' : 'Select Syllabus pdf or image'}
                  <input
                    type="file"
                    className="hidden"
                    disabled={mode === 'edit'}
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSyllabusFile(e.target.files[0]);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Materials Upload */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-[12px] text-[#8C8C8A]">
                {mode === "add" ? "Textbooks pdf" : "Update Textbooks pdf"}
              </label>
            </div>

            {mode === "edit" && initialValues?.pdfUrl && (
              <div className="mb-2 flex flex-col gap-2 rounded-lg border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#8C8C8A]">Current file(s):</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    {/* Add More — white style */}
                    <label className="flex cursor-pointer items-center gap-1.5 text-[#ECECEA]">
                      <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${
                        uploadMode === 'append'
                          ? 'border-white'
                          : 'border-[#5A5A58]'
                      }`}>
                        {uploadMode === 'append' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <input
                        type="radio"
                        name="uploadMode"
                        checked={uploadMode === "append"}
                        onChange={() => setUploadMode("append")}
                        className="sr-only"
                      />
                      Add More
                    </label>

                    {/* Replace All — red style */}
                    <label className="flex cursor-pointer items-center gap-1.5 text-red-400">
                      <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${
                        uploadMode === 'replace'
                          ? 'border-red-500'
                          : 'border-[#5A5A58]'
                      }`}>
                        {uploadMode === 'replace' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        )}
                      </span>
                      <input
                        type="radio"
                        name="uploadMode"
                        checked={uploadMode === "replace"}
                        onChange={() => setUploadMode("replace")}
                        className="sr-only"
                      />
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
                  {initialValues.pdfUrl.split(",").map((url, idx) => (
                    <span key={idx} className="truncate text-[11px] text-[#ECECEA]">
                      - {url.split("/").pop()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
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
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {(localError || serverError) && (
            <p className="text-[12px] text-red-400">{localError || serverError}</p>
          )}

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
