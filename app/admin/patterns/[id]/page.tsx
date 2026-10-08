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
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/patterns" className="p-2 rounded-xl bg-[#252525] border border-[#30302E] text-[#8C8C8A] hover:text-[#ECECEA] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-[28px] font-semibold text-[#ECECEA] tracking-tight">
            {isNew ? 'Create Pattern' : 'Edit Pattern'}
          </h1>
          <p className="text-[14px] text-[#8C8C8A] mt-1">
            {isNew ? 'Define a new question paper pattern' : `Editing pattern for regulation ${initialData?.regulation}`}
          </p>
        </div>
      </div>

      <div className="bg-[#1C1C1B] border border-[#30302E] rounded-2xl p-6">
        <PatternBuilder 
          initialData={initialData} 
          onSave={() => router.push('/admin/patterns')}
        />
      </div>
    </div>
  );
}
