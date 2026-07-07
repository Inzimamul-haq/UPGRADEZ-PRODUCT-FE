"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import { BRANCH_OPTIONS } from "@/lib/constants";
import SubjectFormModal, {
} from "@/components/admin/SubjectFormModal";
import {
  SubjectAccordion,
  Subject,
} from "@/components/admin/SubjectAccordion";
import { useToast } from "@/context/ToastContext";
import { SubjectFormValues } from "@/lib/types";

type SubjectApiRow = {
  id: string;
  name: string;
  code: string;
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
  isActive?: boolean;
  embeddingStatus?: 'queued' | 'processing' | 'completed' | 'failed';
  embedding_status?: string;
  departments?: { id: string; name: string; branch?: string }[];
  departmentIds?: string[];
  files?: { id: string; url: string; storagePath: string; status: string; createdAt: string; progress?: number }[];
};

type DepartmentOption = {
  id: string;
  name: string;
  branch: string;
};

type SubjectsResponse = {
  subjects: SubjectApiRow[];
};

const normalizeSubject = (s: SubjectApiRow): Subject => ({
  id: s.id,
  name: s.name,
  code: s.code,
  departments: s.departments ?? [],
  departmentIds: s.departmentIds ?? s.departments?.map((d) => d.id) ?? [],
  year: s.year,
  regulation: s.regulation,
  pdfUrl: s.pdfUrl ?? s.pdf_url ?? null,
  pdfName: s.pdfName ?? s.pdf_name ?? null,
  uploadDate: s.uploadDate ?? s.upload_date ?? null,
  isPublished: s.isActive ?? s.isPublished ?? true,
  stoppedAcademicYear: s.stoppedAcademicYear ?? null,
  embeddingStatus: (s.embeddingStatus ??
    s.embedding_status ??
    (s.pdfUrl || s.pdf_url ? 'completed' : 'queued')) as Subject['embeddingStatus'],
  files: s.files,
});

export default function AdminSyllabusPage() {
  const toast = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [filterBranch, setFilterBranch] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubjects = async (showError = false) => {
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
  // fetch subjects
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      await fetchSubjects(true);

      setIsLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const { data } = await api.get<{ departments: DepartmentOption[] }>(
          "/api/departments"
        );
        setDepartmentOptions(data.departments ?? []);
      } catch {
        // filter dropdown stays empty
      }
    };
    loadDepartments();
  }, []);
  // Open one SSE stream per subject that is queued or processing.
  // Each stream patches only that subject's local state — no full refetch.
  const activeSubjectIds = subjects
    .filter(
      (s) =>
        s.embeddingStatus === "queued" || s.embeddingStatus === "processing"
    )
    .map((s) => s.id);

  // Track open EventSource instances by subjectId so we can clean up
  const eventSourcesRef = useRef<Record<string, EventSource>>({});

  useEffect(() => {
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

    // Open a stream for any active subject that doesn't already have one
    for (const subjectId of activeSubjectIds) {
      if (eventSourcesRef.current[subjectId]) continue;

      const es = new EventSource(`${BACKEND}/api/subjects/${subjectId}/progress-stream`);
      eventSourcesRef.current[subjectId] = es;

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data) as {
            done?: boolean;
            fileId?: string;
            status?: string;
            progress?: number;
          };

          if (payload.done) {
            // Server says all files settled — do one authoritative full refresh
            es.close();
            delete eventSourcesRef.current[subjectId];
            fetchSubjects();
            return;
          }

          if (!payload.fileId) return;

          // Patch only the affected file in local state
          setSubjects((prev) =>
            prev.map((s) => {
              if (s.id !== subjectId) return s;
              const updatedFiles = s.files?.map((f) => {
                if (f.id !== payload.fileId) return f;
                return {
                  ...f,
                  status: payload.status ?? f.status,
                  progress: payload.progress ?? f.progress ?? 0,
                };
              });

              // Recompute subject-level embeddingStatus from file statuses
              const allDone = updatedFiles?.every((f) => f.status === "done");
              const anyFailed = updatedFiles?.some((f) => f.status === "failed");
              const anyProcessing = updatedFiles?.some(
                (f) => f.status === "processing"
              );
              const anyQueued = updatedFiles?.some((f) => f.status === "pending" || f.status === "queued");
              const newStatus: Subject["embeddingStatus"] = allDone
                ? "completed"
                : anyFailed && !anyProcessing && !anyQueued
                  ? "failed"
                  : anyProcessing
                    ? "processing"
                    : "queued";

              return { ...s, files: updatedFiles, embeddingStatus: newStatus };
            })
          );
        } catch {
          // ignore malformed events
        }
      };

      es.onerror = () => {
        es.close();
        delete eventSourcesRef.current[subjectId];
      };
    }

    // Close streams for subjects that are no longer active
    for (const [id, es] of Object.entries(eventSourcesRef.current)) {
      if (!activeSubjectIds.includes(id)) {
        es.close();
        delete eventSourcesRef.current[id];
      }
    }

    return () => {
      // Cleanup is intentionally NOT done here — streams should outlive
      // individual renders. Full cleanup is handled in the component unmount.
    };
  }, [activeSubjectIds.join(",")]);

  // Close ALL streams on unmount
  useEffect(() => {
    return () => {
      for (const es of Object.values(eventSourcesRef.current)) {
        es.close();
      }
      eventSourcesRef.current = {};
    };
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchBranch =
        !filterBranch ||
        s.departments?.some((d) => d.branch?.toUpperCase() === filterBranch.toUpperCase());
      const matchDept =
        !filterDepartmentId ||
        s.departmentIds?.includes(filterDepartmentId) ||
        s.departments?.some((d) => d.id === filterDepartmentId);
      const matchY = !filterYear || String(s.year) === filterYear;
      return matchBranch && matchDept && matchY;
    });
  }, [subjects, filterBranch, filterDepartmentId, filterYear]);

  const visibleDepartmentOptions = useMemo(() => {
    if (!filterBranch) return departmentOptions;
    return departmentOptions.filter(
      (d) => d.branch.toUpperCase() === filterBranch.toUpperCase()
    );
  }, [departmentOptions, filterBranch]);

  // add subject
  const handleAddSubject = async (values: SubjectFormValues) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("code", values.code.trim());
      formData.append("departmentIds", JSON.stringify(values.departmentIds));
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
        await fetchSubjects();
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
      formData.append("departmentIds", JSON.stringify(values.departmentIds));
      formData.append("year", values.year);
      formData.append("regulation", values.regulation);

      if (values.files && values.files.length > 0) {
        values.files.forEach(file => formData.append("pdfs", file));
      }
      if (values.uploadMode) {
        formData.append("uploadMode", values.uploadMode);
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
                departmentIds: values.departmentIds,
                departments: departmentOptions.filter((d) =>
                  values.departmentIds.includes(d.id)
                ),
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

  // publish toggle — persists isActive on backend
  const handleTogglePublish = async (id: string, academicYear?: string) => {
    const isActive = !academicYear;
    try {
      const { data } = await api.patch(`/api/subjects/${id}/active`, { isActive });
      const updated = data?.subject ? normalizeSubject(data.subject) : null;

      setSubjects((prev) =>
        prev.map((s) =>
          s.id === id
            ? updated ?? {
              ...s,
              isPublished: isActive,
              stoppedAcademicYear: academicYear ?? null,
            }
            : s
        )
      );

      toast.success(
        isActive ? 'Subject republished.' : `Publishing stopped for ${academicYear}.`
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.error ?? err.message ?? 'Failed to update publish status';
      toast.error(msg);
    }
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

      <div className="mb-6 flex flex-wrap gap-3">
        {/* Branch filter */}
        <select
          value={filterBranch}
          onChange={(e) => {
            setFilterBranch(e.target.value);
            setFilterDepartmentId("");
          }}
          className="rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
        >
          <option value="">All Branches</option>
          {BRANCH_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <select
          value={filterDepartmentId}
          onChange={(e) => setFilterDepartmentId(e.target.value)}
          className="rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
        >
          <option value="">All Departments</option>
          {visibleDepartmentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.branch} · {opt.name}</option>
          ))}
        </select>

        {/* Year filter */}
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
        >
          <option value="">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
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
              onRefresh={fetchSubjects}
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
              departmentIds: editingSubject.departmentIds ?? [],
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


    </div>
  );
}