"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { SubjectRow } from '@/components/questions/SubjectRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function FacultyGlobalQuestionsPage() {
  const { user, role } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('1');
  const [defaultsApplied, setDefaultsApplied] = useState(false);

  const basePath = role === 'admin' || role === 'super_admin' ? '/admin' : '/faculty';

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [subjectsRes, deptsRes] = await Promise.all([
          api.get('/api/subjects'),
          api.get('/api/departments'),
        ]);
        setSubjects(subjectsRes.data.subjects || []);
        setDepartments(deptsRes.data.departments || []);
      } catch (err) {
        console.error('Failed to fetch', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (defaultsApplied || departments.length === 0) return;

    const facultyDept = (user as any)?.department;
    const initialDept =
      facultyDept?.id && departments.some((d) => d.id === facultyDept.id)
        ? facultyDept.id
        : departments[0].id;

    setDepartmentFilter(initialDept);
    setYearFilter('1');
    setDefaultsApplied(true);
  }, [user, departments, defaultsApplied]);

  const filteredSubjects = subjects.filter((s) => {
    const matchYear = s.year?.toString() === yearFilter;
    const matchDept = s.departments?.some((d: any) => d.id === departmentFilter);
    return matchYear && matchDept;
  });

  const handleDepartmentChange = (deptId: string) => {
    setDepartmentFilter(deptId);
  };

  return (
    <div className="px-6 py-6 w-full max-w-4xl mx-auto">
      <div>
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Global Questions</h1>
        <p className="text-[12px] text-[#8C8C8A] mt-0.5">Browse all subjects across the institution</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 mb-6">
        <select
          value={departmentFilter}
          onChange={(e) => handleDepartmentChange(e.target.value)}
          className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.branch}/{d.name}</option>
          ))}
        </select>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
        >
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
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
            <SubjectRow
              key={s.id}
              subject={s}
              href={`${basePath}/questions/${s.id}?department=${departmentFilter}`}
            />
          ))
        )}
      </div>
    </div>
  );
}