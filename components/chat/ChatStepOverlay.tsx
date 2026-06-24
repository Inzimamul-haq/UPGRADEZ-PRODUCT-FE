"use client";

import React, { useState, useEffect } from 'react';
import { Subject } from '@/lib/types';
import { SubjectCard } from '@/components/dashboard/SubjectCard';
import { ChevronLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';
interface ChatStepOverlayProps {
  role?: string;
  onComplete: (data: { year?: string; branch?: string; subject: Subject; examType: string }) => void;
}

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH' , `CIVIL`];
const EXAM_TYPES = ['CAT 1', 'CAT 2', 'Model', 'University'];

const mapYearToNumber = (y: string) => {
  if (y.startsWith('1')) return 1;
  if (y.startsWith('2')) return 2;
  if (y.startsWith('3')) return 3;
  if (y.startsWith('4')) return 4;
  return undefined;
};

const BRANCH_TO_DEPARTMENT: Record<string, string> = {
  CSE: 'BE/COMPUTER SCIENCE ENGINEERING',
  IT: 'BTECH/INFORMATION TECHNOLOGY',
  ECE: 'BE/ELECTRONICS AND COMMUNICATION ENGINEERING',
  EEE: 'BE/ELECTRICAL AND ELECTRONICS ENGINEERING',
  MECH: 'BE/MECHANICAL ENGINEERING',
};

export const mapBranchToDepartment = (branch: string) => {
  return BRANCH_TO_DEPARTMENT[branch.trim().toUpperCase()];
};

export function ChatStepOverlay({ role = 'student', onComplete }: ChatStepOverlayProps) {
  const isFaculty = role === 'faculty' || role === 'admin' || role === 'super_admin' || role === 'super-admin';
  const initialStep = isFaculty ? 1 : 3;

  const [step, setStep] = useState(initialStep);
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    if (step === 3) {
      setLoadingSubjects(true);
      const fetchSubjects = async () => {
        try {
          const params = new URLSearchParams();
          if (isFaculty && year) {
            const y = mapYearToNumber(year);
            if (y) params.append('year', y.toString());
          }
          if (isFaculty && branch) {
            const d = mapBranchToDepartment(branch);
            if (d) params.append('department', d);
          }

          const { data } = await api.get('/api/subjects', {
            params: {
              ...(isFaculty && year ? { year: mapYearToNumber(year) } : {}),
              ...(isFaculty && branch
                ? { department: mapBranchToDepartment(branch) }
                : {}),
            },
          });

          setSubjects(data.subjects ?? []);
        } catch (err) {
          console.error('Failed to fetch subjects', err);
          setSubjects([]);
        } finally {
          setLoadingSubjects(false);
        }
      };
      fetchSubjects();
    }
  }, [step, year, branch, isFaculty]);

  const goBack = () => {
    if (step > initialStep) setStep(step - 1);
  };

  const handleSelectYear = (y: string) => { setYear(y); setStep(2); };
  const handleSelectBranch = (b: string) => { setBranch(b); setStep(3); };
  const handleSelectSubject = (subject: Subject) => { setSelectedSubject(subject); setStep(4); };
  const handleSelectExamType = (type: string) => {
    if (selectedSubject) {
      onComplete({ year, branch, subject: selectedSubject, examType: type });
    }
  };

  return (
    <div className="absolute inset-0 bg-[#1C1C1B] z-30 flex flex-col items-center justify-center px-6">
      {step > initialStep && (
        <button onClick={goBack} className="absolute top-6 left-6 md:left-10 text-[#8C8C8A] hover:text-[#ECECEA] transition-colors flex items-center gap-1 text-[13px]">
          <ChevronLeft size={16} /> Back
        </button>
      )}

      {step === 1 && isFaculty && (
        <div className="w-full max-w-md text-center">
          <h2 className="text-[22px] font-medium text-[#ECECEA] mb-2">Academic Year</h2>
          <p className="text-[13px] text-[#8C8C8A] mb-8">Select the year for the question paper</p>
          <div className="flex flex-col gap-3">
            {YEARS.map(y => (
              <button key={y} onClick={() => handleSelectYear(y)} className="bg-[#2C2C2A] border border-[#3A3A38] rounded-xl px-4 py-5 text-[15px] font-medium text-[#ECECEA] hover:bg-[#333331] hover:border-[#4A4A48] transition-all">
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && isFaculty && (
        <div className="w-full max-w-md text-center">
          <h2 className="text-[22px] font-medium text-[#ECECEA] mb-2">Branch</h2>
          <p className="text-[13px] text-[#8C8C8A] mb-8">Select department / branch</p>
          <div className="grid grid-cols-2 gap-3">
            {BRANCHES.map(b => (
              <button key={b} onClick={() => handleSelectBranch(b)} className="bg-[#2C2C2A] border border-[#3A3A38] rounded-xl px-4 py-5 text-[15px] font-medium text-[#ECECEA] hover:bg-[#333331] hover:border-[#4A4A48] transition-all">
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-2xl">
          <h2 className="text-[22px] font-medium text-[#ECECEA] mb-2 text-center">
            {isFaculty ? 'Subject' : 'Which subject?'}
          </h2>
          <p className="text-[13px] text-[#8C8C8A] text-center mb-8">
            {isFaculty ? `${branch} — ${year}` : 'Pick a subject to start your study session'}
          </p>

          {loadingSubjects ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin text-[#8C8C8A]" size={24} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subjects.map(subject => (
                <SubjectCard key={subject.id} subject={subject} onClick={() => handleSelectSubject(subject)} />
              ))}
              {subjects.length === 0 && (
                <p className="text-[13px] text-[#8C8C8A] text-center col-span-full py-6 bg-[#2C2C2A] rounded-xl border border-[#3A3A38]">No subjects found for {year} {branch}</p>
              )}
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="w-full max-w-md">
          <h2 className="text-[22px] font-medium text-[#ECECEA] mb-2 text-center">
            {isFaculty ? 'Exam Type' : 'What are you preparing for?'}
          </h2>
          <p className="text-[13px] text-[#8C8C8A] text-center mb-8">
            {isFaculty ? 'Select the paper type' : 'Choose an exam type to focus your session'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {EXAM_TYPES.map(type => (
              <button
                key={type}
                onClick={() => handleSelectExamType(type)}
                className="border border-[#3A3A38] bg-[#2C2C2A] rounded-xl px-4 py-6 text-[15px] font-medium text-[#ECECEA] hover:bg-[#333331] hover:border-[#4A4A48] cursor-pointer transition-all text-center"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
