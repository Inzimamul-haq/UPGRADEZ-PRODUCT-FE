"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { FileText, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PatternsListPage() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    try {
      const res = await api.get('/api/patterns');
      setPatterns(res.data.patterns || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/patterns/${deleteTarget.id}`);
      setPatterns(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete pattern');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 py-4 sm:py-6">
      {/* Header - mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6 mt-8 sm:mt-0">
        <div>
           <h1 className="text-[16px] font-medium text-[#ECECEA]">Question Paper Patterns</h1>
           <p className="text-[12px] text-[#8C8C8A] mt-0.5">Configure patterns and slot generation logic by regulation</p>
        </div>
        <Link
          href="/admin/patterns/new"
          className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[14px] text-[#ECECEA] transition-colors hover:bg-[#333331] text-center w-full sm:w-auto"
        >
          Add pattern
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#3A3A38] bg-[#1F1F1E]">
        {/* Desktop header - hidden on mobile */}
        <div className="hidden sm:flex items-center px-4 py-2.5 text-[11px] uppercase tracking-wider text-[#5A5A58]">
          <div className="w-32">Regulation</div>
          <div className="w-40">Exam Type</div>
          <div className="flex-1">Parts</div>
          <div className="w-32">Updated</div>
          <div className="w-20 text-right">Actions</div>
        </div>

        {loading ? (
          <p className="px-4 py-8 text-[13px] text-[#5A5A58]">Loading...</p>
        ) : patterns.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              icon={FileText}
              heading="No patterns yet"
              action={
                <Link
                  href="/admin/patterns/new"
                  className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#ECECEA] hover:bg-[#333331] inline-block"
                >
                  Create first pattern
                </Link>
              }
            />
          </div>
        ) : (
          patterns.map(pattern => (
            <div
              key={pattern.id}
              className="border-t border-[#3A3A38] px-3 sm:px-4 py-3 sm:py-3 cursor-pointer hover:bg-[#252525] transition-colors"
              onClick={() => router.push(`/admin/patterns/${pattern.id}`)}
            >
              {/* Desktop row view */}
              <div className="hidden sm:flex items-center">
                <span className="w-32 shrink-0 text-[14px] text-[#ECECEA] truncate">
                  {pattern.regulation}
                </span>

                <span className="w-40 shrink-0 text-[14px] text-[#ECECEA] truncate">
                  {pattern.examType}
                </span>

                <span className="flex-1 min-w-0 flex flex-wrap gap-1">
                  {pattern.parts.map((p: any) => (
                    <span key={p.id} className="px-1.5 py-0.5 bg-[#2C2C2A] border border-[#3A3A38] rounded text-[11px] text-[#8C8C8A]">
                      {p.partName}
                    </span>
                  ))}
                </span>

                <span className="w-32 shrink-0 text-[12px] text-[#8C8C8A]">
                  {new Date(pattern.updatedAt).toLocaleDateString()}
                </span>

                <div className="flex w-20 shrink-0 items-center justify-end gap-3">
                  <Pencil
                    size={14}
                    className="cursor-pointer text-[#5A5A58] hover:text-[#ECECEA]"
                    onClick={(e) => { e.stopPropagation(); router.push(`/admin/patterns/${pattern.id}`); }}
                  />
                  <Trash2
                    size={14}
                    className="cursor-pointer text-[#5A5A58] hover:text-red-400"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(pattern); }}
                  />
                </div>
              </div>

              {/* Mobile card view */}
              <div className="flex sm:hidden flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-[#ECECEA] block">
                      {pattern.regulation} - {pattern.examType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      type="button"
                      className="p-1 cursor-pointer text-[#5A5A58] hover:text-[#ECECEA] flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); router.push(`/admin/patterns/${pattern.id}`); }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="p-1 cursor-pointer text-[#5A5A58] hover:text-red-400 flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(pattern); }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {pattern.parts.map((p: any) => (
                    <span key={p.id} className="px-1.5 py-0.5 bg-[#2C2C2A] border border-[#3A3A38] rounded text-[10px] text-[#8C8C8A]">
                      {p.partName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title={`Delete pattern?`}
        description={`Are you sure you want to delete the ${deleteTarget?.examType} pattern for ${deleteTarget?.regulation}?`}
        loading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
