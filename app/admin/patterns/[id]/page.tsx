"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import PatternBuilder from '@/components/admin/PatternBuilder';

export default function EditPatternPage() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === 'new';

  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetchPattern();
    }
  }, [id]);

  const fetchPattern = async () => {
    try {
      setLoadError(null);
      const res = await api.get(`/api/patterns/${id}`);
      setInitialData(res.data.pattern);
    } catch (err: any) {
      console.error(err);
      setLoadError(err.response?.data?.error || err.response?.data?.message || 'Failed to load pattern');
    } finally {
      setLoading(false);
    }
  };

  const handleBackNavigation = () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
    } else {
      router.push('/admin/patterns');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-[#8C8C8A]" />
        <span className="text-[12px] text-[#8C8C8A] mt-2">Loading pattern...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 py-4 sm:py-6">
      {/* Header with Back button matching list page */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6 mt-8 sm:mt-0">
        <div>
          <h1 className="text-[16px] font-medium text-[#ECECEA] tracking-tight">
            {isNew ? 'Create Pattern' : 'Edit Pattern'}
          </h1>
          <p className="text-[12px] text-[#8C8C8A] mt-0.5">
            {isNew
              ? 'Define a new question paper pattern for regulations and exams'
              : `Editing pattern for regulation ${initialData?.regulation || ''}`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleBackNavigation}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[14px] text-[#ECECEA] transition-colors hover:bg-[#333331] text-center w-full sm:w-auto min-h-[36px]"
        >
          <ArrowLeft size={15} />
          <span>Back to Patterns</span>
        </button>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-400 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{loadError}</span>
          </div>
          <Link
            href="/admin/patterns"
            className="text-[12px] text-red-300 underline hover:text-red-200"
          >
            Return to patterns list
          </Link>
        </div>
      ) : (
        <PatternBuilder
          initialData={initialData}
          onSave={() => {
            setIsDirty(false);
            router.push('/admin/patterns');
          }}
          onCancel={handleBackNavigation}
          setIsDirty={setIsDirty}
        />
      )}

      {/* Unsaved changes confirmation modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-[#2C2C2A] border border-[#3A3A38] p-5 shadow-2xl">
            <h3 className="text-[15px] font-semibold text-[#ECECEA]">Unsaved Changes</h3>
            <p className="text-[13px] text-[#8C8C8A] mt-1.5 leading-relaxed">
              You have unsaved changes in this pattern. Are you sure you want to leave? Your edits will be lost.
            </p>
            <div className="flex gap-2.5 justify-end mt-5">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="rounded-lg bg-[#3A3A38] px-4 py-2 text-[12px] font-medium text-[#ECECEA] hover:bg-[#4A4A48] transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  router.push('/admin/patterns');
                }}
                className="rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2 text-[12px] font-medium text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Discard &amp; Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
