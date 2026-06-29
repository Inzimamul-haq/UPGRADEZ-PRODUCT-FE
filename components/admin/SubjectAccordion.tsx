"use client";

import React, { useState } from "react";
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Ban,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";

export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  year?: number | string;
  regulation?: string;
  pdfUrl?: string | null;
  pdfName?: string | null;
  uploadDate?: string | null;
  isPublished?: boolean;
  stoppedAcademicYear?: string | null;
  embeddingStatus?: 'pending' | 'processing' | 'done' | 'failed';
}

const EMBEDDING_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Embedding queued', className: 'border-yellow-400/50 text-yellow-400' },
  processing: { label: 'Embedding…', className: 'border-blue-400/50 text-blue-400' },
  done: { label: 'Embedded', className: 'border-green-400/50 text-green-400' },
  failed: { label: 'Embedding failed', className: 'border-red-400/50 text-red-400' },
};

interface SubjectAccordionProps {
  subject: Subject;
  onDelete: (id: string) => Promise<void> | void;
  onEdit: (subject: Subject) => void;
  onTogglePublish: (id: string, academicYear?: string) => void;
}

export function SubjectAccordion({
  subject,
  onDelete,
  onEdit,
  onTogglePublish,
}: SubjectAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStopPublishModal, setShowStopPublishModal] = useState(false);
  const [stopAcademicYear, setStopAcademicYear] = useState("2023-2027");

  const handleStopPublish = () => {
    onTogglePublish(subject.id, stopAcademicYear);
    setShowStopPublishModal(false);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(subject.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-[#3A3A38] bg-[#2C2C2A]">
        <div
          className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-[#333331]"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="min-w-0">
            <span className="text-[14px] font-medium text-[#ECECEA]">
              {subject.name}
            </span>
            <span className="ml-2 text-[12px] text-[#8C8C8A]">{subject.code}</span>
            <span className="ml-2 text-[12px] text-[#5A5A58]">
              · {subject.department}
            </span>

            {!subject.isPublished && subject.stoppedAcademicYear && (
              <span className="ml-3 rounded border border-red-400/50 px-1.5 py-0.5 text-[10px] text-red-400">
                Stopped for {subject.stoppedAcademicYear}
              </span>
            )}

            {subject.embeddingStatus && subject.embeddingStatus !== 'done' && (
              <span
                className={`ml-3 rounded border px-1.5 py-0.5 text-[10px] ${EMBEDDING_STATUS_LABELS[subject.embeddingStatus]?.className ?? 'border-[#5A5A58] text-[#8C8C8A]'}`}
              >
                {EMBEDDING_STATUS_LABELS[subject.embeddingStatus]?.label ?? subject.embeddingStatus}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {subject.isPublished ? (
              <div title="Stop Publishing" onClick={(e) => e.stopPropagation()}>
                <Ban
                  size={14}
                  className="cursor-pointer text-[#5A5A58] hover:text-red-400"
                  onClick={() => setShowStopPublishModal(true)}
                />
              </div>
            ) : (
              <button
                className="rounded border border-[#4A4A48] bg-[#1F1F1E] px-2 py-0.5 text-[11px] text-[#ECECEA] hover:bg-[#333331]"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePublish(subject.id);
                }}
              >
                Republish
              </button>
            )}

            <Pencil
              size={14}
              className="cursor-pointer text-[#5A5A58] hover:text-[#ECECEA]"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(subject);
              }}
            />

            <Trash2
              size={14}
              className="cursor-pointer text-[#5A5A58] hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
            />

            {isOpen ? (
              <ChevronUp size={14} className="text-[#8C8C8A]" />
            ) : (
              <ChevronDown size={14} className="text-[#8C8C8A]" />
            )}
          </div>
        </div>

        {isOpen && (
          <div className="border-t border-[#3A3A38] bg-[#1F1F1E] p-4">
            {subject.pdfUrl ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[12px] font-medium text-[#ECECEA]">
                    Current File
                  </p>
                  <p className="text-[12px] text-[#8C8C8A]">
                    {subject.pdfName || "Syllabus file"}
                    {subject.uploadDate ? ` · Uploaded ${subject.uploadDate}` : ""}
                  </p>
                </div>

                <a
                  href={`${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'}/api/subjects/${subject.id}/download`}
                  download
                  className="flex items-center gap-1.5 rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[12px] text-[#ECECEA] transition-colors hover:bg-[#333331]"
                >
                  <Download size={14} />
                  Download
                </a>
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                heading="No file uploaded"
                action={null}
              />
            )}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal — rendered outside the accordion via fragment */}
      <DeleteConfirmModal
        open={showDeleteModal}
        title={`Delete "${subject.name}"?`}
        description="This will permanently remove the subject, its syllabus file, and all associated embeddings. This action cannot be undone."
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Stop Publish Modal */}
      {showStopPublishModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="z-50 w-full max-w-sm rounded-xl border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-2xl">
            <h2 className="mb-2 text-[14px] font-medium text-[#ECECEA]">
              Stop Publishing
            </h2>
            <p className="mb-4 text-[12px] text-[#8C8C8A]">
              Select the academic year to revoke access for this subject.
            </p>

            <div className="mb-6">
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">
                Academic Year
              </label>
              <select
                value={stopAcademicYear}
                onChange={(e) => setStopAcademicYear(e.target.value)}
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
              >
                <option value="2024-2028">2024-2028</option>
                <option value="2023-2027">2023-2027</option>
                <option value="2022-2026">2022-2026</option>
                <option value="2021-2025">2021-2025</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowStopPublishModal(false)}
                className="text-[13px] text-[#5A5A58] transition-colors hover:text-[#8C8C8A]"
              >
                Cancel
              </button>
              <button
                onClick={handleStopPublish}
                className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-[13px] text-red-400 transition-colors hover:bg-red-500/20"
              >
                Stop Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}