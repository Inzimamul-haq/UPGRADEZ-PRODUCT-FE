"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import SubjectFormModal, {
} from "@/components/admin/SubjectFormModal";
import {
  SubjectAccordion,
  Subject,
} from "@/components/admin/SubjectAccordion";
import { useToast } from "@/context/ToastContext";
import { SubjectFormValues } from "@/lib/types";
import { useProgressiveList } from "@/hooks/useProgressiveList";
import { SkeletonList, SubjectRowSkeleton } from "@/components/ui/Skeletons";
import { LoadingNext } from "@/components/ui/LoadingNext";

const MemoizedSubjectAccordion = React.memo(SubjectAccordion);

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
  tocPlan?: any;
  courseOutcomes?: { code: string; description: string }[];
  files?: { id: string; url: string; storagePath: string; status: string; createdAt: string; progress?: number; fileType?: string }[];
};

type DepartmentOption = { id: string; name: string; branch: string };
type SubjectsResponse = { subjects: SubjectApiRow[] };

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
  tocPlan: s.tocPlan,
  courseOutcomes: s.courseOutcomes ?? [],
  files: s.files,
});

export default function FacultySyllabusPage() {
  const toast = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);

  // Filters
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const hasLoadedOnce = useRef(false);
  const eventSourcesRef = useRef<Record<string, EventSource>>({});

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<SubjectsResponse>("/api/subjects");
      const rows = Array.isArray(data?.subjects) ? data.subjects : [];
      setSubjects(rows.map(normalizeSubject));
    } catch (err) {
      console.error("Failed to fetch subjects", err);
      toast.error("Failed to load subjects.");
    } finally {
      setIsLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  useEffect(() => {
    fetchSubjects();
    api.get<{ departments: DepartmentOption[] }>("/api/departments")
      .then(({ data }) => setDepartmentOptions(data.departments ?? []))
      .catch(() => {});
  }, []);

  // SSE streams for active subjects
  const activeSubjectIds = subjects
    .filter((s) => s.embeddingStatus === "queued" || s.embeddingStatus === "processing")
    .map((s) => s.id);

  useEffect(() => {
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

    for (const subjectId of activeSubjectIds) {
      if (eventSourcesRef.current[subjectId]) continue;

      const es = new EventSource(`${BACKEND}/api/subjects/${subjectId}/progress-stream`);
      eventSourcesRef.current[subjectId] = es;

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.done) {
            es.close();
            delete eventSourcesRef.current[subjectId];
            fetchSubjects();
            return;
          }
          if (!payload.fileId) return;

          setSubjects((prev) =>
            prev.map((s) => {
              if (s.id !== subjectId) return s;
              const updatedFiles = s.files?.map((f) => {
                if (f.id !== payload.fileId) return f;
                return { ...f, status: payload.status ?? f.status, progress: payload.progress ?? f.progress ?? 0 };
              });
              const allDone = updatedFiles?.every((f) => f.status === "done");
              const anyFailed = updatedFiles?.some((f) => f.status === "failed");
              const anyProcessing = updatedFiles?.some((f) => f.status === "processing");
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
        } catch {}
      };

      es.onerror = () => {
        es.close();
        delete eventSourcesRef.current[subjectId];
      };
    }

    for (const [id, es] of Object.entries(eventSourcesRef.current)) {
      if (!activeSubjectIds.includes(id)) {
        es.close();
        delete eventSourcesRef.current[id];
      }
    }
  }, [activeSubjectIds.join(",")]);

  useEffect(() => {
    return () => {
      for (const es of Object.values(eventSourcesRef.current)) es.close();
      eventSourcesRef.current = {};
    };
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchDept = !filterDepartmentId || s.departments?.some((d) => d.id === filterDepartmentId);
      const matchY = !filterYear || String(s.year) === filterYear;
      return matchDept && matchY;
    });
  }, [subjects, filterDepartmentId, filterYear]);

  const handleAddSubject = async (values: SubjectFormValues) => {
    setIsSubmitting(true);
    let createdSubjectId: string | null = null;

    try {
      // 1. Create subject text data
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("code", values.code.trim());
      formData.append("departmentIds", JSON.stringify(values.departmentIds));
      formData.append("year", values.year);
      formData.append("regulation", values.regulation);
      if (values.courseOutcomes && values.courseOutcomes.length > 0) {
        formData.append("courseOutcomes", JSON.stringify(values.courseOutcomes));
      }

      const { data } = await api.post("/api/subjects", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      createdSubjectId = data.subject.id;

      // 2. Upload Syllabus
      if (values.syllabusFile) {
        const syllabusData = new FormData();
        syllabusData.append("pdfs", values.syllabusFile);
        syllabusData.append("fileType", "SYLLABUS");
        await api.post(`/api/subjects/${createdSubjectId}/pdf`, syllabusData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // 3. Upload Materials
      if (values.materialFiles && values.materialFiles.length > 0) {
        const materialData = new FormData();
        values.materialFiles.forEach((file) => materialData.append("pdfs", file));
        materialData.append("fileType", "MATERIAL");
        await api.post(`/api/subjects/${createdSubjectId}/pdf`, materialData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await fetchSubjects();
      setShowAddModal(false);
      toast.success(`"${values.name.trim()}" added.`);
    } catch (err: any) {
      if (createdSubjectId) {
        try {
          await api.delete(`/api/subjects/${createdSubjectId}`);
        } catch (cleanupErr) {
          console.error("Failed to cleanup orphaned subject:", cleanupErr);
        }
      }
      const msg = err.response?.data?.error ?? err.message ?? "Failed to add subject";
      toast.error(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

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
      if (values.materialFiles && values.materialFiles.length > 0) {
        values.materialFiles.forEach((file) => formData.append("pdfs", file));
      }
      if (values.uploadMode) formData.append("uploadMode", values.uploadMode);

      const { data } = await api.put(`/api/subjects/${editingSubject.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (values.courseOutcomes !== undefined) {
        try {
          await api.patch(`/api/subjects/${editingSubject.id}/outcomes`, {
            courseOutcomes: values.courseOutcomes,
          });
        } catch (outcomeErr) {
          console.error("Failed to update course outcomes:", outcomeErr);
        }
      }

      if (data?.subject) {
        setSubjects((prev) =>
          prev.map((s) => (s.id === editingSubject.id ? normalizeSubject({
            ...data.subject,
            courseOutcomes: values.courseOutcomes ?? data.subject.courseOutcomes
          }) : s))
        );
      }
      setEditingSubject(null);
      toast.success(`"${values.name.trim()}" updated.`);
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? "Failed to update subject";
      toast.error(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    try {
      await api.delete(`/api/subjects/${id}`);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      toast.success(`"${subject?.name ?? 'Subject'}" deleted.`);
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? "Failed to delete";
      toast.error(msg);
      throw err;
    }
  };

  const handleTogglePublish = async (id: string, academicYear?: string) => {
    const isActive = !academicYear;
    try {
      const { data } = await api.patch(`/api/subjects/${id}/active`, { isActive });
      const updated = data?.subject ? normalizeSubject(data.subject) : null;
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === id
            ? updated ?? { ...s, isPublished: isActive, stoppedAcademicYear: academicYear ?? null }
            : s
        )
      );
      toast.success(isActive ? 'Subject republished.' : `Publishing stopped for ${academicYear}.`);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to update publish status');
    }
  };

  const resetKey = `${filterDepartmentId}-${filterYear}`;
  const { visible, hasMore, isRevealing, sentinelRef } = useProgressiveList(filteredSubjects, {
    root: () => document.getElementById('app-main'),
    resetKey,
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 py-4 sm:py-6">
      {/* Header - mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 mt-16 sm:mt-0">
        <div>
          <h1 className="text-[16px] font-medium text-[#ECECEA]">Syllabus</h1>
          <p className="text-[11px] sm:text-[12px] text-[#8C8C8A] mt-0.5">Add or manage subjects you teach</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[14px] text-[#ECECEA] transition-colors hover:bg-[#333331] w-full sm:w-auto"
        >
          Add subject
        </button>
      </div>

      {/* Filters - mobile responsive */}
      <div className="mb-4 flex flex-wrap gap-2 sm:gap-3">
        <select
          value={filterDepartmentId}
          onChange={(e) => setFilterDepartmentId(e.target.value)}
          className="flex-1 sm:flex-none rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-2 sm:px-3 py-1.5 text-[12px] sm:text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none min-w-[0px] sm:min-w-[150px]"
        >
          <option value="">All Departments</option>
          {departmentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.branch}/{opt.name}</option>
          ))}
        </select>

        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="flex-1 sm:flex-none rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-2 sm:px-3 py-1.5 text-[12px] sm:text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none min-w-[0px] sm:min-w-[130px]"
        >
          <option value="">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
      </div>

      {/* Subjects list */}
      <div className="flex flex-col gap-2">
        {isLoading && !hasLoadedOnce.current ? (
          <SkeletonList count={5} Row={SubjectRowSkeleton} />
        ) : filteredSubjects.length === 0 ? (
          <p className="text-[13px] text-[#5A5A58]">No subjects found. Add one to get started.</p>
        ) : (
          <>
            {visible.map((subject) => (
              <MemoizedSubjectAccordion
                key={subject.id}
                subject={subject}
                onDelete={handleDelete}
                onEdit={(s) => setEditingSubject(s)}
                onTogglePublish={handleTogglePublish}
                onRefresh={fetchSubjects}
              />
            ))}
            {hasMore && (
              <div ref={sentinelRef} className="min-h-[48px]">
                {isRevealing && <LoadingNext showEndOfList={false} hasMore={true} />}
              </div>
            )}
            {!hasMore && filteredSubjects.length > 0 && (
              <LoadingNext showEndOfList={true} hasMore={false} />
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      <SubjectFormModal
        open={showAddModal}
        mode="add"
        title="Add New Subject"
        isSubmitting={isSubmitting}
        onClose={() => { if (!isSubmitting) setShowAddModal(false); }}
        onSubmit={handleAddSubject}
      />

      {/* Edit Modal */}
      <SubjectFormModal
        open={!!editingSubject}
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
        onClose={() => { if (!isSubmitting) setEditingSubject(null); }}
        onSubmit={handleUpdateSubject}
      />
    </div>
  );
}