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
import { extractErrorMessage } from "@/lib/utils";

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
  promptType?: string;
  diagramTypes?: string[];
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
  promptType: s.promptType,
  diagramTypes: s.diagramTypes ?? [],
});

export default function AdminSyllabusPage() {
  const toast = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterRegulation, setFilterRegulation] = useState("All");
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [filterDeptMaxYears, setFilterDeptMaxYears] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poFrameworkVersion, setPoFrameworkVersion] = useState("NBA_12PO_LEGACY");
  const [isSavingFramework, setIsSavingFramework] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lastSyllabusRegulation');
    if (saved) {
      setFilterRegulation(saved);
    }
  }, []);

  const handleRegulationChange = (val: string) => {
    setFilterRegulation(val);
    localStorage.setItem('lastSyllabusRegulation', val);
  };

  const handleDeptFilterChange = (deptId: string) => {
    setFilterDepartmentId(deptId);
    setFilterYear("");
    if (deptId) {
      api.get(`/api/departments/${deptId}/config`)
        .then(res => setFilterDeptMaxYears(res.data.durationYears || 4))
        .catch(() => setFilterDeptMaxYears(4));
    } else {
      setFilterDeptMaxYears(4);
    }
  };


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

  useEffect(() => {
    const loadCollegeContext = async () => {
      try {
        const { data } = await api.get("/api/colleges/context");
        if (data?.data?.poFrameworkVersion) {
          setPoFrameworkVersion(data.data.poFrameworkVersion);
        }
      } catch (err) {
        // ignore
      }
    };
    loadCollegeContext();
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
      const matchDept =
        !filterDepartmentId ||
        s.departmentIds?.includes(filterDepartmentId) ||
        s.departments?.some((d) => d.id === filterDepartmentId);
      const matchY = !filterYear || String(s.year) === filterYear;
      const matchReg = filterRegulation === "All" || s.regulation === filterRegulation;
      return matchDept && matchY && matchReg;
    });
  }, [subjects, filterDepartmentId, filterYear, filterRegulation]);

  const uniqueRegulations = useMemo(() => {
    return Array.from(new Set(subjects.map((s) => s.regulation).filter(Boolean))).sort();
  }, [subjects]);

  const visibleDepartmentOptions = departmentOptions;

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
        materialData.append("uploadMode", values.uploadMode || "append");
        await api.post(`/api/subjects/${createdSubjectId}/pdf`, materialData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

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
      if (createdSubjectId) {
        try {
          await api.delete(`/api/subjects/${createdSubjectId}`);
        } catch (cleanupErr) {
          console.error("Failed to cleanup orphaned subject:", cleanupErr);
        }
      }
      toast.error(extractErrorMessage(err, "Failed to add subject"));
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

      if (values.materialFiles && values.materialFiles.length > 0) {
        values.materialFiles.forEach(file => formData.append("pdfs", file));
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

      const pdfMsg = (values.materialFiles && values.materialFiles.length > 0)
        ? " Old embeddings removed and new PDF(s) queued."
        : "";
      toast.success(`"${values.name.trim()}" updated.${pdfMsg}`);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "Failed to update subject"));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };



  // AI Config save
  const handleConfigSave = async (id: string, promptType: string, diagramTypes: string[]) => {
    await api.patch(`/api/subjects/${id}/config`, { promptType, diagramTypes });
    // Patch local state immediately — no full refetch needed
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, promptType, diagramTypes } : s
      )
    );
  };

  // delete subject — now async for the modal loading state
  const handleDelete = async (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    try {
      await api.delete(`/api/subjects/${id}`);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      toast.success(`"${subject?.name ?? 'Subject'}" deleted successfully.`);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "Failed to delete subject"));
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
      toast.error(extractErrorMessage(err, "Failed to update publish status"));
    }
  };

  const handleFrameworkChange = async (val: string) => {
    setIsSavingFramework(true);
    try {
      await api.patch('/api/colleges/me/config', { poFrameworkVersion: val });
      setPoFrameworkVersion(val);
      toast.success("PO Framework updated globally.");
    } catch (err) {
      toast.error("Failed to update PO Framework");
    } finally {
      setIsSavingFramework(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 py-4 sm:py-6">
      {/* Header - proper mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 mt-10 sm:mt-0">
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Syllabus</h1>

        <div className="flex items-center gap-3">
          <select
            value={poFrameworkVersion}
            onChange={(e) => handleFrameworkChange(e.target.value)}
            disabled={isSavingFramework}
            className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[14px] text-[#ECECEA] transition-colors focus:border-[#4A4A48] focus:outline-none disabled:opacity-50 w-full sm:w-auto"
          >
            <option value="NBA_12PO_LEGACY">NBA 12-PO (Legacy)</option>
            <option value="NBA_GAPC_V4_11PO">NBA 11-PO (GAPC v4.0)</option>
          </select>
          <button
            onClick={() => {
              setShowAddModal(true);
            }}
            className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[14px] text-[#ECECEA] transition-colors hover:bg-[#333331] w-full sm:w-auto"
          >
            Add subject
          </button>
        </div>
      </div>

      {/* Filters - proper mobile responsive */}
      <div className="mb-4 flex flex-wrap gap-2 sm:gap-3">
        <select
          value={filterDepartmentId}
          onChange={(e) => handleDeptFilterChange(e.target.value)}
          className="flex-1 sm:flex-none rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-2 sm:px-3 py-1.5 text-[12px] sm:text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none min-w-[0px] sm:min-w-[150px]"
        >
          <option value="">All Departments</option>
          {departmentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.branch} - {opt.name}</option>
          ))}
        </select>

        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="flex-1 sm:flex-none rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-2 sm:px-3 py-1.5 text-[12px] sm:text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none min-w-[0px] sm:min-w-[130px]"
        >
          <option value="">All Years</option>
          {Array.from({ length: filterDeptMaxYears }, (_, i) => i + 1).map(y => (
            <option key={y} value={String(y)}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>
          ))}
        </select>

        <select
          value={filterRegulation}
          onChange={(e) => handleRegulationChange(e.target.value)}
          className="flex-1 sm:flex-none rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-2 sm:px-3 py-1.5 text-[12px] sm:text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none min-w-[0px] sm:min-w-[130px]"
        >
          <option value="All">All Regulations</option>
          {uniqueRegulations.map((reg: any) => (
            <option key={reg} value={reg}>{reg}</option>
          ))}
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
              onConfigSave={handleConfigSave}
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