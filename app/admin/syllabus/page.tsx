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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [filterBranch, setFilterBranch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // filtered subjects
  const filteredSubjects = useMemo(() => {
    if (!filterBranch.trim()) return subjects;

    const q = filterBranch.toLowerCase();
    return subjects.filter((s) => s.department.toLowerCase().includes(q));
  }, [subjects, filterBranch]);

  // add subject
  const handleAddSubject = async (values: SubjectFormValues) => {
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("code", values.code.trim());
      formData.append("department", values.departmentBranch.trim().toUpperCase());
      formData.append("year", values.year);
      formData.append("regulation", values.regulation);

      if (values.file) {
        formData.append("pdf", values.file);
      }

      const { data } = await api.post("/api/subjects", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
        // fallback reload if API shape differs
        const refreshed = await api.get<SubjectsResponse>("/api/subjects");
        setSubjects((refreshed.data.subjects || []).map(normalizeSubject));
      }

      setShowAddModal(false);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ??
        err.message ??
        "Failed to add subject"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // open edit modal
  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setErrorMsg("");
    setShowEditModal(true);
  };

  // update subject
  const handleUpdateSubject = async (values: SubjectFormValues) => {
    if (!editingSubject) return;

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("code", values.code.trim());
      formData.append("department", values.departmentBranch.trim().toUpperCase());
      formData.append("year", values.year);
      formData.append("regulation", values.regulation);

      if (values.file) {
        formData.append("pdf", values.file);
      }

      const { data } = await api.put(
        `/api/subjects/${editingSubject.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
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
        // fallback optimistic merge if backend returns minimal response
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
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ??
        err.message ??
        "Failed to update subject"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // delete subject
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;

    try {
      await api.delete(`/api/subjects/${id}`);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert("Failed to delete subject. Please try again.");
    }
  };

  // publish toggle placeholder
  const handleTogglePublish = async (id: string, academicYear?: string) => {
    // Replace with your real publish / unpublish API
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
            setErrorMsg("");
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

      <SubjectFormModal
        open={showAddModal}
        mode="add"
        title="Add New Subject"
        isSubmitting={isSubmitting}
        serverError={errorMsg}
        onClose={() => {
          if (isSubmitting) return;
          setShowAddModal(false);
          setErrorMsg("");
        }}
        onSubmit={handleAddSubject}
      />

      {/* Edit Modal */}
      <SubjectFormModal
        open={showEditModal}
        mode="edit"
        title="Edit Subject"
        isSubmitting={isSubmitting}
        serverError={errorMsg}
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
          setErrorMsg("");
        }}
        onSubmit={handleUpdateSubject}
      />
    </div>
  );
}