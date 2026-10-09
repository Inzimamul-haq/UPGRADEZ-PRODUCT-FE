"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function PatternsListPage() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pattern?')) return;
    try {
      await api.delete(`/api/patterns/${id}`);
      setPatterns(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete pattern');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl bg-[#252525] border border-[#30302E] text-[#8C8C8A] hover:text-[#ECECEA] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-[28px] font-semibold text-[#ECECEA] tracking-tight">Question Paper Patterns</h1>
            <p className="text-[14px] text-[#8C8C8A] mt-1">Configure patterns and slot generation logic by regulation</p>
          </div>
        </div>
        <Link
          href="/admin/patterns/new"
          className="flex items-center gap-2 bg-[#ECECEA] text-[#121212] px-5 py-2.5 rounded-xl font-medium text-[14px] hover:bg-white transition-all shadow-sm"
        >
          <Plus size={18} />
          Create Pattern
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#8C8C8A]" />
        </div>
      ) : patterns.length === 0 ? (
        <div className="text-center py-20 bg-[#1C1C1B] rounded-2xl border border-[#30302E]">
          <div className="text-[#8C8C8A] mb-4">No patterns configured yet</div>
          <Link href="/admin/patterns/new" className="text-[#ECECEA] underline text-sm">Create your first pattern</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patterns.map(pattern => (
            <div key={pattern.id} className="bg-[#1C1C1B] border border-[#30302E] rounded-2xl p-6 hover:border-[#4A4A48] transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-medium text-[#ECECEA]">{pattern.regulation}</h3>
                  <p className="text-sm text-[#8C8C8A]">{pattern.examType}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/patterns/${pattern.id}`} className="text-[#8C8C8A] hover:text-[#ECECEA] transition-colors">
                    <Edit2 size={18} />
                  </Link>
                  <button onClick={() => handleDelete(pattern.id)} className="text-[#8C8C8A] hover:text-red-400 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-4">
                  {pattern.parts.map((p: any) => (
                    <span key={p.id} className="px-2 py-1 bg-[#252525] border border-[#3A3A38] rounded-md text-[12px] text-[#A0A09E]">
                      {p.partName}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="text-[12px] text-[#666664] pt-4 border-t border-[#30302E]">
                Updated {new Date(pattern.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
