"use client";

import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { FacultyTableRow } from '@/components/admin/FacultyTableRow';
import { EmptyState } from '@/components/ui/EmptyState';

const initialFaculty = [
  { id: '1', name: 'Dr. Alan Turing', email: 'alan@example.com', department: 'Computer Science', joined: '2020-01-15' },
  { id: '2', name: 'Dr. Ada Lovelace', email: 'ada@example.com', department: 'Mathematics', joined: '2019-11-20' },
];

export default function AdminFacultyPage() {
  const [faculty, setFaculty] = useState(initialFaculty);

  const handleRevoke = (id: string) => {
    setFaculty(faculty.filter((f) => f.id !== id));
  };

  const handleDemote = (id: string) => {
    // Demote logic (mocked)
    setFaculty(faculty.filter((f) => f.id !== id));
    alert(`Demoted faculty ${id} to student.`);
  };

  return (
    <div className="px-6 py-6 w-full">
      <h1 className="text-[16px] font-medium text-[#ECECEA] mb-4">Faculty</h1>

      <div className="border border-[#3A3A38] rounded-lg overflow-x-auto bg-[#1F1F1E]">
        <div className="min-w-[800px]">
          <div className="flex items-center px-4 py-2.5 bg-[#1F1F1E] text-[11px] text-[#5A5A58] uppercase tracking-wider">
            <div className="w-[25%]">Name</div>
            <div className="w-[30%]">Email</div>
            <div className="w-[20%]">Department</div>
            <div className="w-[10%]">Joined</div>
            <div className="w-[15%] text-right">Action</div>
          </div>
          
          <div className="flex flex-col">
            {faculty.length === 0 ? (
              <div className="py-8">
                <EmptyState 
                  icon={GraduationCap} 
                  heading="No faculty found" 
                />
              </div>
            ) : (
              faculty.map((f) => (
                <FacultyTableRow 
                  key={f.id} 
                  faculty={f} 
                  onRevoke={handleRevoke}
                  onDemote={handleDemote}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
