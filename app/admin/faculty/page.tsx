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
  const [searchName, setSearchName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('10');

  const handleRevoke = (id: string) => {
    setFaculty(faculty.filter((f) => f.id !== id));
  };

  const handleDemote = (id: string) => {
    // Demote logic (mocked)
    setFaculty(faculty.filter((f) => f.id !== id));
    alert(`Demoted faculty ${id} to student.`);
  };

  const filteredFaculty = faculty.filter(f => 
    !searchName || f.name.toLowerCase().includes(searchName.toLowerCase())
  );

  return (
    <div className="px-6 py-6 w-full">
      <h1 className="text-[16px] font-medium text-[#ECECEA]">Faculty</h1>

      <div className="mt-4 mb-4 flex flex-wrap gap-3">
        <div className="relative">
          <input 
            placeholder="Search name" 
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-48 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
          />
        </div>
      </div>

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
            {filteredFaculty.length === 0 ? (
              <div className="py-8">
                <EmptyState 
                  icon={GraduationCap} 
                  heading="No faculty found" 
                />
              </div>
            ) : (
              filteredFaculty.map((f) => (
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
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#2E2E2C] bg-[#1F1F1E]">
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-[#8C8C8A]">Showing 1 to {Math.min(parseInt(rowsPerPage), filteredFaculty.length)} of {filteredFaculty.length} results</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#8C8C8A]">Rows per page:</span>
              <select 
                value={rowsPerPage} 
                onChange={(e) => setRowsPerPage(e.target.value)}
                className="bg-[#2C2C2A] border border-[#3A3A38] rounded text-[12px] text-[#ECECEA] px-1 py-0.5 focus:outline-none"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="70">70</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 text-[12px] text-[#5A5A58] border border-[#2E2E2C] rounded cursor-not-allowed">Previous</button>
            <button className="px-2 py-1 text-[12px] text-[#ECECEA] bg-[#2C2C2A] border border-[#4A4A48] rounded">1</button>
            <button className="px-2 py-1 text-[12px] text-[#5A5A58] border border-[#2E2E2C] rounded cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
