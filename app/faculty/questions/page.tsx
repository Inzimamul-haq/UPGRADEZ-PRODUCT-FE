"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { SubjectRow } from '@/components/questions/SubjectRow';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { QUALIFICATION_OPTIONS } from '@/lib/constants';

export default function FacultyGlobalQuestionsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('All');
  const [qualificationFilter, setQualificationFilter] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await api.get('/api/subjects');
        setSubjects(data.subjects || []);
      } catch (err) {
        console.error('Failed to fetch subjects', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const filteredSubjects = subjects.filter((s) => {
    const sYearStr = s.year ? `${s.year}st Year`.replace('1st', '1st').replace('2st', '2nd').replace('3st', '3rd').replace('4st', '4th') : '';
    // A simplified year matching, as DB has numbers (1,2,3,4)
    const matchYear = yearFilter === 'All' || s.year?.toString() === yearFilter.replace(/\D/g, '');
    const matchQual = !qualificationFilter || (s.qualification && s.qualification === qualificationFilter);
    return matchYear && matchQual;
  });

  return (
    <div className="px-6 py-6 w-full max-w-4xl mx-auto">
      <div>
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Global Questions</h1>
        <p className="text-[12px] text-[#8C8C8A] mt-0.5">Browse all subjects across the institution</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 mb-6">
        <select 
          value={yearFilter} 
          onChange={(e) => setYearFilter(e.target.value)}
          className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
        >
          <option value="All">All Years</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>
        <select 
          value={qualificationFilter}
          onChange={(e) => setQualificationFilter(e.target.value)}
          className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
        >
          <option value="">All Qualifications</option>
          {QUALIFICATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="py-12 border border-[#3A3A38] rounded-lg bg-[#1F1F1E] flex justify-center">
            <span className="text-[13px] text-[#5A5A58]">Loading subjects...</span>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="py-12 border border-[#3A3A38] rounded-lg bg-[#1F1F1E]">
            <EmptyState 
              icon={BookOpen} 
              heading="No subjects found" 
              subtext="Try adjusting your filters to find subjects." 
            />
          </div>
        ) : (
          filteredSubjects.map((s) => (
            <SubjectRow key={s.id} subject={s} />
          ))
        )}
      </div>
    </div>
  );
}
