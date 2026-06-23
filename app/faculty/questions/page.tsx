"use client";

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { SubjectRow } from '@/components/questions/SubjectRow';
import { EmptyState } from '@/components/ui/EmptyState';

const initialSubjects = [
  { id: '1', name: 'Data Structures', code: 'CS8351', department: 'Computer Science', branch: 'CSE', year: '2nd Year' },
  { id: '2', name: 'Machine Learning', code: 'CS8691', department: 'Computer Science', branch: 'CSE', year: '3rd Year' },
  { id: '3', name: 'Circuit Theory', code: 'EE8251', department: 'Electrical', branch: 'ECE', year: '1st Year' },
  { id: '4', name: 'Engineering Physics', code: 'PH8151', department: 'Science', branch: 'MECH', year: '1st Year' },
];

export default function FacultyGlobalQuestionsPage() {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [yearFilter, setYearFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');

  const filteredSubjects = subjects.filter((s) => {
    const matchYear = yearFilter === 'All' || s.year === yearFilter;
    const matchBranch = branchFilter === 'All' || s.branch.toLowerCase().includes(branchFilter.toLowerCase());
    return matchYear && matchBranch;
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
        
        <input 
          placeholder="Filter by Branch (e.g. CSE)" 
          value={branchFilter === 'All' ? '' : branchFilter}
          onChange={(e) => setBranchFilter(e.target.value || 'All')}
          className="w-48 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
        />
      </div>

      <div className="flex flex-col gap-2">
        {filteredSubjects.length === 0 ? (
          <div className="py-12 border border-[#3A3A38] rounded-lg bg-[#1F1F1E]">
            <EmptyState 
              icon={BookOpen} 
              heading="No subjects found" 
              subtext="Try adjusting your filters to find subjects." 
            />
          </div>
        ) : (
          filteredSubjects.map((s) => (
            <SubjectRow key={s.id} subject={s} href={`/faculty/questions/${s.id}`} />
          ))
        )}
      </div>
    </div>
  );
}
