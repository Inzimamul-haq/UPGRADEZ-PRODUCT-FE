"use client";

import React, { useState } from 'react';
import { SubjectAccordion } from '@/components/admin/SubjectAccordion';
import { z } from 'zod';
import api from '@/lib/api';

// ── Validation schema ─────────────────────────────────────────────────────────
// `departmentBranch` is the single merged input: e.g. "BE/Computer Science Engineering"
// Format enforced: must contain "/" separating degree from branch.
// Before sending to BE, it's uppercased → "BE/COMPUTER SCIENCE ENGINEERING"
const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  departmentBranch: z
    .string()
    .min(1, 'Department/Branch is required')
    .refine((val) => val.includes('/'), {
      message: 'Must follow format: DEGREE/BRANCH  e.g. BE/Computer Science Engineering',
    }),
  year: z.string().min(1, 'Year is required'),
});

type SubjectRow = {
  id: string;
  name: string;
  code: string;
  department: string;
  pdfUrl?: string | null;
  createdAt?: string;
};

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

export default function AdminSyllabusPage() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter state
  const [filterBranch, setFilterBranch] = useState('');

  // Form state
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDepartmentBranch, setNewDepartmentBranch] = useState('');
  const [newYear, setNewYear] = useState('1st Year');
  const [newFile, setNewFile] = useState<File | null>(null);

  // UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleAddSubject = async () => {
    setErrorMsg('');

    // FE Zod validation
    const parsed = subjectSchema.safeParse({
      name: newName,
      code: newCode,
      departmentBranch: newDepartmentBranch,
      year: newYear,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0].message);
      return;
    }

    if (!newFile) {
      setErrorMsg('A PDF or DOCX syllabus file is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Merge + uppercase before sending to BE
      // "BE/Computer Science Engineering" → "BE/COMPUTER SCIENCE ENGINEERING"
      const mergedDepartment = newDepartmentBranch.trim().toUpperCase();

      const formData = new FormData();
      formData.append('name', newName.trim());
      formData.append('code', newCode.trim());
      formData.append('department', mergedDepartment);
      formData.append('pdf', newFile);

      const { data } = await api.post<{ subject: SubjectRow; upload: { pdfUrl: string } }>(
        '/api/subjects',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Prepend the new subject (with pdfUrl from upload result)
      setSubjects((prev) => [{ ...data.subject, pdfUrl: data.upload.pdfUrl }, ...prev]);

      // Reset form
      setNewName('');
      setNewCode('');
      setNewDepartmentBranch('');
      setNewYear('1st Year');
      setNewFile(null);
      setShowAddModal(false);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ?? err.message ?? 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setShowAddModal(false);
    setErrorMsg('');
  };

  const handleDelete = (id: string) => setSubjects((prev) => prev.filter((s) => s.id !== id));

  const filteredSubjects = subjects.filter((s) =>
    filterBranch
      ? s.department.toLowerCase().includes(filterBranch.toLowerCase())
      : true
  );

  return (
    <div className="px-6 py-6 w-full max-w-5xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Syllabus</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-3 py-1.5 text-[14px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
        >
          Add subject
        </button>
      </div>

      {/* ── Filter ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <input
          placeholder="Filter by department / branch…"
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="w-64 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
        />
      </div>

      {/* ── Subject list ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {filteredSubjects.length === 0 ? (
          <p className="text-[13px] text-[#5A5A58]">No subjects yet. Add one to get started.</p>
        ) : (
          filteredSubjects.map((s) => (
            <SubjectAccordion
              key={s.id}
              subject={s as any}
              onDelete={handleDelete}
              onTogglePublish={() => { }}
            />
          ))
        )}
      </div>

      {/* ── Add subject modal ───────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="bg-[#1F1F1E] border border-[#3A3A38] rounded-lg p-6 w-full max-w-md z-50">
            <h2 className="text-[14px] font-medium text-[#ECECEA] mb-5">Add New Subject</h2>

            <div className="space-y-4">
              {/* Name + Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#8C8C8A] mb-1">Subject Name</label>
                  <input
                    placeholder="e.g. Data Structures"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#8C8C8A] mb-1">Subject Code</label>
                  <input
                    placeholder="e.g. CS8391"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
                  />
                </div>
              </div>

              {/* Department / Branch — single merged input */}
              <div>
                <label className="block text-[12px] text-[#8C8C8A] mb-1">
                  Department / Branch
                  <span className="ml-2 text-[#5A5A58]">e.g. BE/Computer Science Engineering</span>
                </label>
                <input
                  placeholder="BE/Computer Science Engineering"
                  value={newDepartmentBranch}
                  onChange={(e) => setNewDepartmentBranch(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
                />
              </div>

              {/* Year + File */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#8C8C8A] mb-1">Year</label>
                  <select
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#8C8C8A] mb-1">Upload PDF / DOCX</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#8C8C8A] focus:outline-none focus:border-[#4A4A48] file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-[#1F1F1E] file:text-[#ECECEA] hover:file:bg-[#333331] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <p className="mt-3 text-[12px] text-red-400">{errorMsg}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-[13px] text-[#5A5A58] hover:text-[#8C8C8A] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubject}
                disabled={isSubmitting}
                className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-4 py-1.5 text-[13px] text-[#ECECEA] hover:bg-[#333331] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Uploading…' : 'Add Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
