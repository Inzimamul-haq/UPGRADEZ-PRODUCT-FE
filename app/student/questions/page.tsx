"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap } from 'lucide-react';
import { SubjectRow } from '@/components/questions/SubjectRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { isStudentProfileReadyForSubjects } from '@/lib/profile';
import { StudentSubject } from '@/lib/types';
import api from '@/lib/api';

export default function StudentQuestionsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<StudentSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [incompleteProfile, setIncompleteProfile] = useState(false);
  const [regulationMismatch, setRegulationMismatch] = useState(false);
  const [viewingYear, setViewingYear] = useState<number | null>(null);

  const profileYear = user?.year ?? null;
  const departmentId = user?.department?.id ?? null;
  const canTogglePreviousYear = profileYear !== null && profileYear > 1;
  const isViewingPreviousYear =
    profileYear !== null && viewingYear !== null && viewingYear < profileYear;

  const fetchSubjects = useCallback(async (year: number) => {
    try {
      setLoading(true);
      setIncompleteProfile(false);
      setRegulationMismatch(false);

      const { data } = await api.get('/api/subjects/for-student', {
        params: { year },
      });

      setSubjects(data.subjects || []);
      setRegulationMismatch(!!data.regulationMismatch);
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.incompleteProfile) {
        setIncompleteProfile(true);
        setSubjects([]);
      } else {
        console.error(err);
        setSubjects([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || !isStudentProfileReadyForSubjects(user)) {
      setIncompleteProfile(true);
      setLoading(false);
      return;
    }

    if (profileYear !== null && viewingYear === null) {
      setViewingYear(profileYear);
      return;
    }

    if (viewingYear !== null) {
      fetchSubjects(viewingYear);
    }
  }, [user, profileYear, viewingYear, fetchSubjects]);

  const handleYearToggle = () => {
    if (!profileYear || !canTogglePreviousYear) return;
    setViewingYear(isViewingPreviousYear ? profileYear : profileYear - 1);
  };

  if (incompleteProfile) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[16px] font-medium text-[#ECECEA]">Questions</h1>
            <p className="text-[12px] text-[#8C8C8A]">Browse by subject</p>
          </div>
        </div>
        <div className="mt-6 py-12 border border-[#3A3A38] rounded-lg bg-[#1F1F1E]">
          <EmptyState
            icon={GraduationCap}
            heading="Complete your profile to view subjects"
            subtext="We need your branch, department, year, regulation, batch year, and section before we can show your subjects."
            action={
              <Link
                href="/onboarding"
                className="inline-block text-[13px] font-medium text-white bg-[var(--theme-color)] rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
              >
                Finish onboarding
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-medium text-[#ECECEA]">Questions</h1>
          <p className="text-[12px] text-[#8C8C8A]">Browse by subject</p>
        </div>
        {canTogglePreviousYear && (
          <button
            onClick={handleYearToggle}
            className="text-[13px] text-[#ECECEA] bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 hover:bg-[#333331] transition-colors"
          >
            {isViewingPreviousYear ? 'Current year' : 'Previous year'}
          </button>
        )}
      </div>

      {regulationMismatch && (
        <p className="mt-4 text-[12px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          No subjects matched your regulation ({user?.regulation}). Showing all subjects for this year instead.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {loading ? (
          <div className="py-12 border border-[#3A3A38] rounded-lg bg-[#1F1F1E] flex justify-center">
            <span className="text-[13px] text-[#5A5A58]">Loading subjects...</span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="py-12 border border-[#3A3A38] rounded-lg bg-[#1F1F1E]">
            <EmptyState
              icon={BookOpen}
              heading="No subjects found"
              subtext={
                isViewingPreviousYear
                  ? 'No subjects are available for the previous year yet.'
                  : 'No subjects are available for your profile yet.'
              }
            />
          </div>
        ) : (
          subjects.map((subject) => (
            <SubjectRow
              key={subject.id}
              subject={{
                id: subject.id,
                name: subject.name,
                code: subject.code,
                department: user?.department?.name ?? '',
                year: subject.year?.toString() ?? '',
              }}
              href={`/student/questions/${subject.id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
