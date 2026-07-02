import React from 'react';
import { SubjectRow } from '@/components/questions/SubjectRow';
import { Subject } from '@/lib/types';

export default async function StudentQuestionsPage() {
  const subjects: Subject[] = [
    { id: '1', name: 'Data Structures', code: 'CS201', department: 'Computer Science', year: '2nd' },
    { id: '2', name: 'Operating Systems', code: 'CS301', department: 'Computer Science', year: '2nd' },
    { id: '3', name: 'Computer Networks', code: 'CS302', department: 'Computer Science', year: '3rd' },
    { id: '4', name: 'Database Management', code: 'CS401', department: 'Computer Science', year: '3rd' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-medium text-[#ECECEA]">Questions</h1>
          <p className="text-[12px] text-[#8C8C8A]">Browse by subject</p>
        </div>
        <button className="text-[13px] text-[#ECECEA] bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 hover:bg-[#333331] transition-colors">
          Previous year
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {subjects.map(subject => (
          <SubjectRow key={subject.id} subject={subject} />
        ))}
        {subjects.length === 0 && (
          <p className="text-[13px] text-[#8C8C8A]">No subjects found.</p>
        )}
      </div>
    </div>
  );
}
