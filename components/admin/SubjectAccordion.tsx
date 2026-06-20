import React, { useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp, FileText, Download, Ban } from 'lucide-react';
import { InlineConfirm } from '@/components/ui/InlineConfirm';
import { EmptyState } from '@/components/ui/EmptyState';

interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  branch?: string;
  year?: string;
  academicYear?: string;
  pdf_url?: string;
  pdf_name?: string;
  upload_date?: string;
  isPublished?: boolean;
  stoppedAcademicYear?: string;
}

interface SubjectAccordionProps {
  subject: Subject;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, academicYear?: string) => void;
}

export function SubjectAccordion({ subject, onDelete, onTogglePublish }: SubjectAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showStopPublishModal, setShowStopPublishModal] = useState(false);

  // Edit state
  const [name, setName] = useState(subject.name);
  const [code, setCode] = useState(subject.code);
  const [department, setDepartment] = useState(subject.department);
  const [branch, setBranch] = useState(subject.branch || '');

  // Publish state
  const [stopAcademicYear, setStopAcademicYear] = useState('2023-2027');

  const handleSaveEdit = () => {
    setShowEditModal(false);
    // would dispatch an update here
  };

  const handleStopPublish = () => {
    onTogglePublish(subject.id, stopAcademicYear);
    setShowStopPublishModal(false);
  };

  return (
    <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#333331]" onClick={() => setIsOpen(!isOpen)}>
        <div>
          <span className="text-[14px] font-medium text-[#ECECEA]">{name}</span>
          <span className="text-[12px] text-[#8C8C8A] ml-2">{code}</span>
          <span className="text-[12px] text-[#5A5A58] ml-2">· {department} ({branch})</span>
          {!subject.isPublished && (
            <span className="ml-3 text-[10px] text-red-400 border border-red-400/50 rounded px-1.5 py-0.5">
              Stopped for {subject.stoppedAcademicYear}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {showConfirmDelete ? (
            <InlineConfirm
              message="Delete?"
              confirmLabel="Delete"
              onConfirm={() => onDelete(subject.id)}
              onCancel={() => setShowConfirmDelete(false)}
            />
          ) : (
            <>
              {subject.isPublished ? (
                <div title="Stop Publishing">
                  <Ban
                    size={14}
                    className="text-[#5A5A58] hover:text-red-400 cursor-pointer"
                    onClick={() => setShowStopPublishModal(true)}
                  />
                </div>
              ) : (
                <button
                  className="text-[11px] text-[#ECECEA] bg-[#1F1F1E] border border-[#4A4A48] rounded px-2 py-0.5 hover:bg-[#333331]"
                  onClick={() => onTogglePublish(subject.id)}
                >
                  Republish
                </button>
              )}
              <Pencil size={14} className="text-[#5A5A58] hover:text-[#ECECEA] cursor-pointer" onClick={() => setShowEditModal(true)} />
              <Trash2 size={14} className="text-[#5A5A58] hover:text-red-400 cursor-pointer" onClick={() => setShowConfirmDelete(true)} />
              {isOpen ? <ChevronUp size={14} className="text-[#8C8C8A]" /> : <ChevronDown size={14} className="text-[#8C8C8A]" />}
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-[#3A3A38] bg-[#1F1F1E] p-4">
          {subject.pdf_url ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[12px] text-[#ECECEA] font-medium mb-1">Current PDF</p>
                <p className="text-[12px] text-[#8C8C8A]">{subject.pdf_name} · Uploaded {subject.upload_date}</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={subject.pdf_url}
                  download
                  className="flex items-center gap-1.5 text-[12px] text-[#ECECEA] bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-3 py-1.5 hover:bg-[#333331] transition-colors"
                >
                  <Download size={14} /> Download
                </a>
                <button className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-3 py-1.5 text-[12px] text-[#ECECEA] hover:bg-[#333331] transition-colors relative">
                  Replace PDF
                  <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" />
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              heading="No PDF uploaded"
              action={
                <button className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] hover:bg-[#333331] transition-colors relative">
                  Upload PDF
                  <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" />
                </button>
              }
            />
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-[#1F1F1E] border border-[#3A3A38] rounded-lg p-6 max-w-sm w-full z-50">
            <h2 className="text-[14px] font-medium text-[#ECECEA] mb-4">Edit Subject</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] text-[#8C8C8A] mb-1">Subject Name</label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#8C8C8A] mb-1">Code</label>
                <input
                  value={code} onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#8C8C8A] mb-1">Department</label>
                <input
                  value={department} onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#8C8C8A] mb-1">Branch</label>
                <input
                  value={branch} onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[13px] text-[#5A5A58] hover:text-[#8C8C8A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-4 py-1.5 text-[13px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Publish Modal */}
      {showStopPublishModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-[#1F1F1E] border border-[#3A3A38] rounded-lg p-6 max-w-sm w-full z-50">
            <h2 className="text-[14px] font-medium text-[#ECECEA] mb-2">Stop Publishing</h2>
            <p className="text-[12px] text-[#8C8C8A] mb-4">Select the academic year to revoke access for this subject.</p>

            <div className="mb-6">
              <label className="block text-[12px] text-[#8C8C8A] mb-1">Academic Year</label>
              <select
                value={stopAcademicYear}
                onChange={(e) => setStopAcademicYear(e.target.value)}
                className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
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
                className="text-[13px] text-[#5A5A58] hover:text-[#8C8C8A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStopPublish}
                className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-md px-4 py-1.5 text-[13px] hover:bg-red-500/20 transition-colors"
              >
                Stop Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
