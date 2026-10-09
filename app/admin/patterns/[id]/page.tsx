"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import PatternBuilder from '@/components/admin/PatternBuilder';

export default function EditPatternPage() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === 'new';
  
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      fetchPattern();
    }
  }, [id]);

  const fetchPattern = async () => {
    try {
      const res = await api.get(`/api/patterns/${id}`);
      setInitialData(res.data.pattern);
    } catch (err) {
      console.error(err);
      alert('Failed to load pattern');
      router.push('/admin/patterns');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#8C8C8A]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6 mt-8 sm:mt-0">
        <div>
          <h1 className="text-[16px] font-medium text-[#ECECEA] tracking-tight">
            {isNew ? 'Create Pattern' : 'Edit Pattern'}
          </h1>
          <p className="text-[12px] text-[#8C8C8A] mt-0.5">
            {isNew ? 'Define a new question paper pattern' : `Editing pattern for regulation ${initialData?.regulation}`}
          </p>
        </div>
        <Link 
          href="/admin/patterns" 
          className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[14px] text-[#ECECEA] transition-colors hover:bg-[#333331] text-center w-full sm:w-auto"
        >
          Back to Patterns
        </Link>
      </div>

      <div className="bg-[#1F1F1E] border border-[#3A3A38] rounded-xl p-4 sm:p-6">
        <PatternBuilder 
          initialData={initialData} 
          onSave={() => router.push('/admin/patterns')}
        />
      </div>
    </div>
  );
}
