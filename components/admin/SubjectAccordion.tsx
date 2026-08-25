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
  RefreshCw,
} from "lucide-react";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import { extractErrorMessage } from "@/lib/utils";

export type Subject = {
  id: string;
  name: string;
  code: string;
  departments?: { id: string; name: string; branch?: string }[];
  departmentIds?: string[];
  year?: number | string;
  regulation?: string;
  pdfUrl?: string | null;
  pdfName?: string | null;
  uploadDate?: string | null;
  isPublished?: boolean;
  embeddingStatus?: 'queued' | 'processing' | 'completed' | 'failed';
  stoppedAcademicYear?: string | null;
  tocPlan?: any;
  files?: { id: string; url: string; storagePath: string; status: string; createdAt: string; progress?: number; fileType?: string }[];
};

const EMBEDDING_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  queued: { label: 'Queued', className: 'border-yellow-400/50 text-yellow-400' },
  processing: { label: 'Processing', className: 'border-blue-400/50 text-blue-400' },
  completed: { label: 'Completed', className: 'border-green-400/50 text-green-400' },
  failed: { label: 'Failed', className: 'border-red-400/50 text-red-400' },
};

interface SubjectAccordionProps {
  subject: Subject;
  onDelete: (id: string) => Promise<void> | void;
  onEdit: (subject: Subject) => void;
  onTogglePublish: (id: string, academicYear?: string) => void;
  onRefresh?: () => void;
}

export function SubjectAccordion({
  subject,
  onDelete,
  onEdit,
  onTogglePublish,
  onRefresh,
}: SubjectAccordionProps) {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStopPublishModal, setShowStopPublishModal] = useState(false);
  const [stopAcademicYear, setStopAcademicYear] = useState("2023-2027");
  const [isRetrying, setIsRetrying] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isFileDeleting, setIsFileDeleting] = useState(false);

  const [isUploadingSyllabus, setIsUploadingSyllabus] = useState(false);

  const handleUploadSyllabus = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSyllabus(true);
    try {
      const formData = new FormData();
      formData.append("pdfs", file);
      formData.append("fileType", "SYLLABUS");
      
      await api.post(`/api/subjects/${subject.id}/pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Official Syllabus uploaded and parsed successfully");
      await onRefresh?.();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "Failed to upload syllabus"));
    } finally {
      setIsUploadingSyllabus(false);
      e.target.value = '';
    }
  };

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isRetrying) return;

    setIsRetrying(true);

    try {
      await api.post(`/api/subjects/${subject.id}/retry`);

      await onRefresh?.();

      toast.success("Retry queued successfully");
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "Failed to retry subject"));
    } finally {
      setIsRetrying(false);
    }
  };

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

  const handleDeleteFileConfirm = async () => {
    if (!fileToDelete) return;
    setIsFileDeleting(true);
    try {
      await api.delete(`/api/subjects/${subject.id}/files/${fileToDelete.id}`);
      toast.success("File deleted successfully");
      await onRefresh?.();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "Failed to delete file"));
    } finally {
      setIsFileDeleting(false);
      setFileToDelete(null);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-[#3A3A38] bg-[#2C2C2A]">
        {/* Accordion Header - Mobile responsive */}
        <div
          className="flex cursor-pointer items-start sm:items-center justify-between gap-2 px-3 sm:px-4 py-3 hover:bg-[#333331]"
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* Left side - Subject info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <span className="text-[13px] sm:text-[14px] font-medium text-[#ECECEA] truncate max-w-[100px] sm:max-w-[200px]">
                {subject.name}
              </span>
              <span className="text-[11px] sm:text-[12px] text-[#8C8C8A] truncate">
                {subject.code}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
              <span className="text-[10px] sm:text-[12px] text-[#5A5A58] truncate max-w-[120px] sm:max-w-[200px]">
                {subject.departments && subject.departments.length > 0 && (
                  <>{subject.departments.map((d) => d.branch ? `${d.branch}` : d.name).join(", ")}</>
                )}
              </span>

              {!subject.isPublished && subject.stoppedAcademicYear && (
                <span className="inline-flex rounded border border-red-400/50 px-1.5 py-0.5 text-[9px] sm:text-[10px] text-red-400 whitespace-nowrap">
                  Stopped
                </span>
              )}

              {subject.embeddingStatus && subject.embeddingStatus !== 'completed' && (() => {
                const totalFiles = subject.files?.length || 0;
                const totalProgress = subject.files?.reduce((acc, f) => acc + (f.progress ?? (f.status === 'done' ? 100 : 0)), 0) || 0;
                const progressPercentage = totalFiles > 0 ? Math.round(totalProgress / totalFiles) : 0;
                const label = EMBEDDING_STATUS_LABELS[subject.embeddingStatus]?.label ?? subject.embeddingStatus;
                
                return (
                  <span
                    className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] sm:text-[10px] whitespace-nowrap ${EMBEDDING_STATUS_LABELS[subject.embeddingStatus]?.className ?? 'border-[#5A5A58] text-[#8C8C8A]'}`}
                  >
                    {label} {totalFiles > 0 ? `${progressPercentage}%` : ''}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
                className="rounded border border-[#4A4A48] bg-[#1F1F1E] px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] text-[#ECECEA] hover:bg-[#333331] whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePublish(subject.id);
                }}
              >
                Republish
              </button>
            )}

            {subject.embeddingStatus === 'failed' && (
              <RefreshCw
                size={14}
                className={`cursor-pointer ${isRetrying ? 'animate-spin text-[#ECECEA]' : 'text-[#5A5A58] hover:text-[#ECECEA]'}`}
                onClick={handleRetry}
                data-tooltip="Retry processing" />
            )}

            <Pencil
              size={14}
              className="cursor-pointer text-[#5A5A58] hover:text-[#ECECEA]"
              onClick={(e) => {
                e.stopPropagation();
                if (subject.embeddingStatus === 'processing') {
                  toast.error("Subject is currently processing. Please try again after a few minutes.");
                  return;
                }
                onEdit(subject);
              }}
            />

            <Trash2
              size={14}
              className={`cursor-pointer text-[#5A5A58] ${subject.embeddingStatus === 'processing' ? 'hover:text-[#ECECEA]' : 'hover:text-red-400'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (subject.embeddingStatus === 'processing') {
                  toast.error("Subject is currently processing. Please try again after a few minutes.");
                  return;
                }
                setShowDeleteModal(true);
              }}
            />

            {isOpen ? (
              <ChevronUp size={14} className="text-[#8C8C8A] flex-shrink-0" />
            ) : (
              <ChevronDown size={14} className="text-[#8C8C8A] flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isOpen && (
          <div className="border-t border-[#3A3A38] bg-[#1F1F1E] p-3 sm:p-4">
            {/* Processing Status */}
            {subject.embeddingStatus && subject.embeddingStatus !== 'completed' && (() => {
              const totalFiles = subject.files?.length || 0;
              const completedFiles = subject.files?.filter(f => f.status === 'done').length || 0;
              const totalProgress = subject.files?.reduce((acc, f) => acc + (f.progress ?? (f.status === 'done' ? 100 : 0)), 0) || 0;
              const progressPercentage = totalFiles > 0 ? Math.round(totalProgress / totalFiles) : 0;

              return (
                <div className="mb-4 rounded border border-[#3A3A38] bg-[#2C2C2A] p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                    <span className="text-[12px] sm:text-[13px] font-medium text-[#ECECEA]">
                      {subject.embeddingStatus === 'failed' ? 'Processing Failed' : 'Processing Syllabus Files'}
                    </span>
                    <span className="text-[11px] sm:text-[12px] text-[#8C8C8A]">
                      {completedFiles} of {totalFiles} jobs completed ({progressPercentage}%)
                    </span>
                  </div>
                  
                  <div className="w-full bg-[#1F1F1E] rounded-full h-2 mb-1 overflow-hidden border border-[#3A3A38]">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${subject.embeddingStatus === 'failed' ? 'bg-red-400' : 'bg-blue-400'}`} 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>

                  {subject.embeddingStatus === 'failed' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-[#3A3A38]">
                      <span className="text-[11px] sm:text-[12px] text-[#8C8C8A]">
                        Process halted. You can resume processing.
                      </span>
                      <button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="flex items-center gap-1.5 rounded-md border border-[#4A4A48] bg-[#1F1F1E] px-3 py-1.5 text-[11px] sm:text-[12px] text-[#ECECEA] transition-colors hover:bg-[#333331] disabled:opacity-50 w-full sm:w-auto justify-center"
                      >
                        <RefreshCw size={14} className={isRetrying ? "animate-spin" : ""} />
                        {isRetrying ? "Resuming..." : "Resume Processing"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Materials & Textbooks Header */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] sm:text-[13px] font-medium text-[#ECECEA]">
                Materials & Textbooks
              </span>
            </div>

            {/* Files List */}
            {(() => {
              const materialFiles = (subject.files ?? []).filter(f => f.fileType !== 'SYLLABUS');
              return materialFiles.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {materialFiles.map((file, index) => (
                    <div key={file.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3A3A38]/50 pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium text-[#ECECEA] truncate">
                          {subject.pdfName ? `${subject.pdfName.replace(/\.[^/.]+$/, "")}${index > 0 ? `_${index + 1}` : ""}.pdf` : `Syllabus Part ${index + 1}`}
                        </p>
                        <p className="text-[10px] sm:text-[12px] text-[#8C8C8A]">
                          {file.createdAt ? `Uploaded ${new Date(file.createdAt).toLocaleDateString()}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <a
                          href={`${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'}/api/subjects/${subject.id}/download?fileId=${file.id}`}
                          download
                          className="flex items-center justify-center gap-1.5 rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[11px] sm:text-[12px] text-[#ECECEA] transition-colors hover:bg-[#333331] flex-1 sm:flex-none"
                        >
                          <Download size={14} />
                          Download
                        </a>
                        <button
                          onClick={() => setFileToDelete({ id: file.id, name: subject.pdfName ? `${subject.pdfName.replace(/\.[^/.]+$/, "")}${index > 0 ? `_${index + 1}` : ""}.pdf` : `Syllabus Part ${index + 1}` })}
                          className="flex items-center justify-center rounded-md border border-[#4A4A48] bg-[#2C2C2A] p-1.5 text-[#5A5A58] hover:text-red-400 transition-colors hover:bg-[#333331]"
                          title="Delete File"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : subject.pdfUrl ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="mb-1 text-[12px] font-medium text-[#ECECEA] truncate">
                      Current File
                    </p>
                    <p className="text-[10px] sm:text-[12px] text-[#8C8C8A] truncate">
                      {subject.pdfName || "Syllabus file"}
                      {subject.uploadDate ? ` · Uploaded ${subject.uploadDate}` : ""}
                    </p>
                  </div>

                  <a
                    href={`${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000'}/api/subjects/${subject.id}/download`}
                    download
                    className="flex items-center justify-center gap-1.5 rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[11px] sm:text-[12px] text-[#ECECEA] transition-colors hover:bg-[#333331] w-full sm:w-auto"
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
              )
            })()}
          </div>
        )}
      </div>

      {/* Delete Subject Confirm Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title={`Delete "${subject.name}"?`}
        description="This will permanently remove the subject, its syllabus file, and all associated embeddings. This action cannot be undone."
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setShowDeleteModal(false)}
      />

      {/* Delete File Confirm Modal */}
      <ConfirmDeleteModal
        isOpen={!!fileToDelete}
        title={`Delete File?`}
        description={`Are you sure you want to delete "${fileToDelete?.name}"? This action cannot be undone.`}
        loading={isFileDeleting}
        onConfirm={handleDeleteFileConfirm}
        onClose={() => setFileToDelete(null)}
      />

      {/* Stop Publish Modal - Mobile responsive */}
      {showStopPublishModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="z-50 w-full max-w-sm rounded-xl border border-[#3A3A38] bg-[#1F1F1E] p-4 sm:p-6 shadow-2xl mx-4">
            <h2 className="mb-2 text-[14px] font-medium text-[#ECECEA]">
              Stop Publishing
            </h2>
            <p className="mb-4 text-[11px] sm:text-[12px] text-[#8C8C8A]">
              Select the academic year to revoke access for this subject.
            </p>

            <div className="mb-6">
              <label className="mb-1 block text-[11px] sm:text-[12px] text-[#8C8C8A]">
                Academic Year
              </label>
              <select
                value={stopAcademicYear}
                onChange={(e) => setStopAcademicYear(e.target.value)}
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[12px] sm:text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
              >
                <option value="2024-2028">2024-2028</option>
                <option value="2023-2027">2023-2027</option>
                <option value="2022-2026">2022-2026</option>
                <option value="2021-2025">2021-2025</option>
              </select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowStopPublishModal(false)}
                className="text-[12px] sm:text-[13px] text-[#5A5A58] transition-colors hover:text-[#8C8C8A] py-2 sm:py-0"
              >
                Cancel
              </button>
              <button
                onClick={handleStopPublish}
                className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-2 sm:py-1.5 text-[12px] sm:text-[13px] text-red-400 transition-colors hover:bg-red-500/20"
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