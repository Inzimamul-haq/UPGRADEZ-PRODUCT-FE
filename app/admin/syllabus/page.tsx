"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import SubjectFormModal, {
  SubjectFormValues,
} from "@/components/admin/SubjectFormModal";
import {
  SubjectAccordion,
  Subject,
} from "@/components/admin/SubjectAccordion";
import { useToast } from "@/context/ToastContext";

type SubjectApiRow = {
  id: string;
  name: string;
  code: string;
  department: string;
  year?: number | string;
  regulation?: string;
  pdfUrl?: string | null;
  pdf_url?: string | null;
  pdfName?: string | null;
  pdf_name?: string | null;
  uploadDate?: string | null;
  upload_date?: string | null;
  createdAt?: string;
  isPublished?: boolean;
  stoppedAcademicYear?: string | null;
};

type SubjectsResponse = {
  subjects: SubjectApiRow[];
};

const normalizeSubject = (s: SubjectApiRow): Subject => ({
  id: s.id,
  name: s.name,
  code: s.code,
  department: s.department,
  year: s.year,
  regulation: s.regulation,
  pdfUrl: s.pdfUrl ?? s.pdf_url ?? null,
  pdfName: s.pdfName ?? s.pdf_name ?? null,
  uploadDate: s.uploadDate ?? s.upload_date ?? null,
  isPublished: s.isPublished ?? true,
  stoppedAcademicYear: s.stoppedAcademicYear ?? null,
});

export default function AdminSyllabusPage() {
  const toast = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [filterBranch, setFilterBranch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const extraFileRef = React.useRef<HTMLInputElement>(null);

  // fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get<SubjectsResponse>("/api/subjects");

        const rows = Array.isArray(data?.subjects) ? data.subjects : [];
        setSubjects(rows.map(normalizeSubject));
      } catch (err) {
        console.error("Failed to fetch subjects", err);
        toast.error("Failed to load subjects. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filtered subjects
  const filteredSubjects = useMemo(() => {
    if (!filterBranch.trim()) return subjects;

    const q = filterBranch.toLowerCase();
    return subjects.filter((s) => s.department.toLowerCase().includes(q));
  }, [subjects, filterBranch]);

  // add subject
  const handleAddSubject = async (values: SubjectFormValues) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("code", values.code.trim());
      formData.append("department", values.departmentBranch.trim().toUpperCase());
      formData.append("year", values.year);
      formData.append("regulation", values.regulation);

      if (values.files && values.files.length > 0) {
        values.files.forEach(file => formData.append("pdfs", file));
      }

      const { data } = await api.post("/api/subjects", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // supports either {subject} or {subject, upload}
      const rawSubject = data?.subject
        ? {
          ...data.subject,
          pdfUrl: data.subject.pdfUrl ?? data.upload?.pdfUrl ?? data.subject.pdf_url,
        }
        : null;

      if (rawSubject) {
        setSubjects((prev) => [normalizeSubject(rawSubject), ...prev]);
      } else {
        const refreshed = await api.get<SubjectsResponse>("/api/subjects");
        setSubjects((refreshed.data.subjects || []).map(normalizeSubject));
      }

      setShowAddModal(false);
      toast.success(`"${values.name.trim()}" added. PDF queued for embedding.`);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ?? err.message ?? "Failed to add subject";
      toast.error(msg);
      // re-throw so the modal can also show inline error
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // open edit modal
  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setShowEditModal(true);
  };

  // update subject
  const handleUpdateSubject = async (values: SubjectFormValues) => {
    if (!editingSubject) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("code", values.code.trim());
      formData.append("department", values.departmentBranch.trim().toUpperCase());
      formData.append("year", values.year);
      formData.append("regulation", values.regulation);

      if (values.files && values.files.length > 0) {
        values.files.forEach(file => formData.append("pdfs", file));
      }

      const { data } = await api.put(
        `/api/subjects/${editingSubject.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updatedRaw = data?.subject
        ? {
          ...data.subject,
          pdfUrl:
            data.subject.pdfUrl ??
            data.upload?.pdfUrl ??
            data.subject.pdf_url ??
            editingSubject.pdfUrl,
        }
        : null;

      if (updatedRaw) {
        const normalized = normalizeSubject(updatedRaw);
        setSubjects((prev) =>
          prev.map((s) => (s.id === editingSubject.id ? normalized : s))
        );
      } else {
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === editingSubject.id
              ? {
                ...s,
                name: values.name,
                code: values.code,
                department: values.departmentBranch.trim().toUpperCase(),
                year: values.year,
                regulation: values.regulation,
              }
              : s
          )
        );
      }

      setShowEditModal(false);
      setEditingSubject(null);

      const pdfMsg = (values.files && values.files.length > 0)
        ? " Old embeddings removed and new PDF(s) queued."
        : "";
      toast.success(`"${values.name.trim()}" updated.${pdfMsg}`);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ?? err.message ?? "Failed to update subject";
      toast.error(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Upload extra PDFs into an existing subject without touching metadata */
  const handleUploadExtra = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingSubject) return;
    setUploadingExtra(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("pdfs", f));
      await api.post(`/api/subjects/${editingSubject.id}/pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`${files.length} file(s) uploaded and queued for embedding.`);
      if (extraFileRef.current) extraFileRef.current.value = "";
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? "Upload failed";
      toast.error(msg);
    } finally {
      setUploadingExtra(false);
    }
  };

  // delete subject — now async for the modal loading state
  const handleDelete = async (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    try {
      await api.delete(`/api/subjects/${id}`);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      toast.success(`"${subject?.name ?? 'Subject'}" deleted successfully.`);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ?? err.message ?? "Failed to delete subject";
      toast.error(msg);
      throw err; // let the modal know it failed
    }
  };

  // publish toggle placeholder
  const handleTogglePublish = async (id: string, academicYear?: string) => {
    console.log("toggle publish", { id, academicYear });

    setSubjects((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
            ...s,
            isPublished: academicYear ? false : true,
            stoppedAcademicYear: academicYear ?? null,
          }
          : s
      )
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Syllabus</h1>

        <button
          onClick={() => {
            setShowAddModal(true);
          }}
          className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[14px] text-[#ECECEA] transition-colors hover:bg-[#333331]"
        >
          Add subject
        </button>
      </div>

      <div className="mb-6">
        <input
          placeholder="Filter by department / branch…"
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="w-72 rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <p className="text-[13px] text-[#5A5A58]">Loading subjects...</p>
        ) : filteredSubjects.length === 0 ? (
          <p className="text-[13px] text-[#5A5A58]">
            No subjects yet. Add one to get started.
          </p>
        ) : (
          filteredSubjects.map((subject) => (
            <SubjectAccordion
              key={subject.id}
              subject={subject}
              onDelete={handleDelete}
              onEdit={handleOpenEdit}
              onTogglePublish={handleTogglePublish}
            />
          ))
        )}
      </div>

      {/* Add Modal */}
      <SubjectFormModal
        open={showAddModal}
        mode="add"
        title="Add New Subject"
        isSubmitting={isSubmitting}
        onClose={() => {
          if (isSubmitting) return;
          setShowAddModal(false);
        }}
        onSubmit={handleAddSubject}
      />

      {/* Edit Modal */}
      <SubjectFormModal
        open={showEditModal}
        mode="edit"
        title="Edit Subject"
        isSubmitting={isSubmitting}
        initialValues={
          editingSubject
            ? {
              name: editingSubject.name,
              code: editingSubject.code,
              departmentBranch: editingSubject.department,
              year: editingSubject.year?.toString() || "1",
              regulation: editingSubject.regulation || "R2021",
              pdfUrl: editingSubject.pdfUrl,
            }
            : undefined
        }
        onClose={() => {
          if (isSubmitting) return;
          setShowEditModal(false);
          setEditingSubject(null);
        }}
        onSubmit={handleUpdateSubject}
      />

      {/* Upload More PDFs — shown when edit modal is open */}
      {showEditModal && editingSubject && (
        <div className="fixed inset-0 z-30 flex items-end justify-end p-6 pointer-events-none">
          <div className="pointer-events-auto w-72 rounded-lg border border-[#3A3A38] bg-[#1A1A19] p-4 shadow-xl">
            <p className="mb-1 text-[12px] font-medium text-[#ECECEA]">Upload More PDFs</p>
            <p className="mb-3 text-[11px] text-[#5A5A58]">
              Adds to <span className="text-[#ECECEA]">{editingSubject.name}</span> without replacing existing files.
            </p>
            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[12px] text-[#ECECEA] transition-colors hover:bg-[#333331] ${
                uploadingExtra ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {uploadingExtra ? "Uploading…" : "+ Select PDF / DOCX"}
              <input
                ref={extraFileRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={uploadingExtra}
                onChange={(e) => handleUploadExtra(e.target.files)}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}