"use client";

import React, { useState } from 'react';
import { Subject } from '@/lib/types';
import { SubjectCard } from '@/components/dashboard/SubjectCard';
import { ChevronLeft } from 'lucide-react';

interface ChatStepOverlayProps {
  role?: string;
  subjects: Subject[];
  onComplete: (data: { year?: string; branch?: string; subjectId: string; examType: string }) => void;
}

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH'];
const EXAM_TYPES = ['CAT 1', 'CAT 2', 'Model', 'University'];

export function ChatStepOverlay({ role = 'student', subjects, onComplete }: ChatStepOverlayProps) {
  const isFaculty = role === 'faculty';
  const initialStep = isFaculty ? 1 : 3; // Faculty starts at 1, Student starts at 3
  
  const [step, setStep] = useState(initialStep);
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const goBack = () => {
    if (step > initialStep) setStep(step - 1);
  };

  const handleSelectYear = (y: string) => { setYear(y); setStep(2); };
  const handleSelectBranch = (b: string) => { setBranch(b); setStep(3); };
  const handleSelectSubject = (id: string) => { setSubjectId(id); setStep(4); };
  const handleSelectExamType = (type: string) => {
    onComplete({ year, branch, subjectId, examType: type });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subjects.map(subject => (
              <SubjectCard key={subject.id} subject={subject} onClick={() => handleSelectSubject(subject.id)} />
            ))}
            {subjects.length === 0 && (
              <p className="text-[13px] text-[#8C8C8A] text-center col-span-full">No subjects available.</p>
            )}
          </div>
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
