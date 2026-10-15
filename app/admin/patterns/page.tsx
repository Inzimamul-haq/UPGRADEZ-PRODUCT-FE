"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Pencil, Trash2, FileText } from 'lucide-react';
import api from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { SkeletonList, GlobalSubjectSkeleton } from '@/components/ui/Skeletons';

interface PatternPart {
  id?: string;
  partName: string;
  hasChoice: boolean;
  sortOrder?: number;
  allowedRbt?: string[];
  slots?: any[];
}

interface Pattern {
  id: string;
  regulation: string;
  examType: string;
  updatedAt: string;
  parts: PatternPart[];
}

export default function PatternsListPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Pattern | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openRegulation, setOpenRegulation] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
    setDeleteError(null);
    try {
      await api.delete(`/api/patterns/${deleteTarget.id}`);
      setPatterns(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete pattern');
    } finally {
      setIsDeleting(false);
    }
  };

  // Group patterns by regulation
  const groupedPatterns = useMemo(() => {
    const map = new Map<string, Pattern[]>();
    for (const pattern of patterns) {
      const reg = pattern.regulation || 'Unassigned';
      if (!map.has(reg)) {
        map.set(reg, []);
      }
      map.get(reg)!.push(pattern);
    }
    // Return sorted regulations
    return Array.from(map.entries())
      .sort(([regA], [regB]) => regA.localeCompare(regB))
      .map(([regulation, list]) => ({
        regulation,
        patterns: list.sort((a, b) => a.examType.localeCompare(b.examType)),
      }));
  }, [patterns]);

  const toggleRegulation = (regulation: string) => {
    setOpenRegulation(prev => (prev === regulation ? null : regulation));
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 py-4 sm:py-6">
      {/* Header - same title/subtitle block as Global Questions with Add pattern button */}
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

      {deleteError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-400">
          {deleteError}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          <SkeletonList count={4} Row={GlobalSubjectSkeleton} />
        </div>
      ) : patterns.length === 0 ? (
        <div className="py-12 border border-[#3A3A38] rounded-lg bg-[#1F1F1E]">
          <EmptyState
            icon={FileText}
            heading="No patterns yet"
            subtext="Create your first question paper pattern to get started."
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
        <div className="flex flex-col gap-2">
          {groupedPatterns.map(({ regulation, patterns: regPatterns }) => {
            const isOpen = openRegulation === regulation;
            const count = regPatterns.length;
            const subtext = `${count} exam ${count === 1 ? 'type' : 'types'}`;

            return (
              <div
                key={regulation}
                className="overflow-hidden rounded-lg border border-[#3A3A38] bg-[#2C2C2A] transition-colors"
              >
                {/* SubjectRow-styled Regulation Card */}
                <button
                  type="button"
                  onClick={() => toggleRegulation(regulation)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-[#333331] transition-colors duration-150"
                  aria-expanded={isOpen}
                  aria-label={`${regulation}, ${subtext}`}
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-[14px] font-medium text-[#ECECEA] truncate">{regulation}</p>
                    <p className="text-[12px] text-[#8C8C8A] mt-0.5">{subtext}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-[#5A5A58] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-90 text-[#ECECEA]' : ''
                    }`}
                  />
                </button>

                {/* Expanded accordion content */}
                {isOpen && (
                  <div className="border-t border-[#3A3A38] bg-[#1F1F1E]">
                    {/* Desktop table: Exam Type | Parts | Updated | Actions */}
                    <div className="hidden sm:block">
                      <div className="flex items-center px-4 py-2 text-[11px] uppercase tracking-wider text-[#8C8C8A] border-b border-[#3A3A38]/50 bg-[#1A1A19]">
                        <div className="w-36 shrink-0">Exam Type</div>
                        <div className="flex-1 min-w-0">Parts</div>
                        <div className="w-32 shrink-0">Updated</div>
                        <div className="w-20 shrink-0 text-right">Actions</div>
                      </div>

                      {regPatterns.map(pattern => (
                        <div
                          key={pattern.id}
                          className="flex items-center px-4 py-3 border-b border-[#3A3A38]/40 last:border-b-0 hover:bg-[#252524] transition-colors"
                        >
                          <span className="w-36 shrink-0 text-[13px] font-medium text-[#ECECEA] truncate">
                            {pattern.examType}
                          </span>

                          <span className="flex-1 min-w-0 flex flex-wrap gap-1 pr-3">
                            {pattern.parts?.map((p: PatternPart, idx: number) => (
                              <span
                                key={p.id || idx}
                                className="px-1.5 py-0.5 bg-[#2C2C2A] border border-[#3A3A38] rounded text-[11px] text-[#8C8C8A]"
                              >
                                {p.partName}
                              </span>
                            ))}
                          </span>

                          <span className="w-32 shrink-0 text-[12px] text-[#8C8C8A]">
                            {pattern.updatedAt ? new Date(pattern.updatedAt).toLocaleDateString() : '—'}
                          </span>

                          <div className="flex w-20 shrink-0 items-center justify-end gap-2">
                            <button
                              type="button"
                              title="Edit pattern"
                              aria-label={`Edit ${pattern.examType} pattern`}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/patterns/${pattern.id}`);
                              }}
                              className="h-8 w-8 flex items-center justify-center rounded-md text-[#8C8C8A] hover:text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              title="Delete pattern"
                              aria-label={`Delete ${pattern.examType} pattern`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(pattern);
                              }}
                              className="h-8 w-8 flex items-center justify-center rounded-md text-[#8C8C8A] hover:text-red-400 hover:bg-[#2C2C2A] transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mobile stacked mini-card view: no horizontal scroll */}
                    <div className="sm:hidden flex flex-col divide-y divide-[#3A3A38]/50">
                      {regPatterns.map(pattern => (
                        <div key={pattern.id} className="p-3 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[13px] font-medium text-[#ECECEA] block">
                                {pattern.examType}
                              </span>
                              <span className="text-[11px] text-[#8C8C8A]">
                                Updated {pattern.updatedAt ? new Date(pattern.updatedAt).toLocaleDateString() : '—'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                aria-label={`Edit ${pattern.examType} pattern`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin/patterns/${pattern.id}`);
                                }}
                                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-[#8C8C8A] hover:text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${pattern.examType} pattern`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(pattern);
                                }}
                                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-[#8C8C8A] hover:text-red-400 hover:bg-[#2C2C2A] transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            {pattern.parts?.map((p: PatternPart, idx: number) => (
                              <span
                                key={p.id || idx}
                                className="px-1.5 py-0.5 bg-[#2C2C2A] border border-[#3A3A38] rounded text-[10px] text-[#8C8C8A]"
                              >
                                {p.partName}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete pattern?"
        description={`Are you sure you want to delete the ${deleteTarget?.examType} pattern for ${deleteTarget?.regulation}?`}
        loading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
