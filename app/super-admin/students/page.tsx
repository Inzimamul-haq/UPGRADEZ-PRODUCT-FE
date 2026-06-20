"use client";

import React, { useState } from 'react';
import { Users, Search } from 'lucide-react';
import { StudentTableRow } from '@/components/admin/StudentTableRow';
import { EmptyState } from '@/components/ui/EmptyState';

const initialStudents = [
  { id: '1', name: 'John Doe', email: 'john@example.com', year: '3rd Year', branch: 'CSE', section: 'A', joined: '2023-08-12', college: 'Anna University' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', year: '2nd Year', branch: 'ECE', section: 'B', joined: '2023-08-15', college: 'VIT Chennai' },
  { id: '3', name: 'Alice Johnson', email: 'alice@example.com', year: '1st Year', branch: 'IT', section: '', joined: '2023-09-01', college: 'SRM Institute' },
];

export default function SuperAdminStudentsPage() {
  const [students, setStudents] = useState(initialStudents);
  const [collegeFilter, setCollegeFilter] = useState('All');
  const [searchName, setSearchName] = useState('');

  const handleDelete = (id: string) => {
    setStudents(students.filter((s) => s.id !== id));
  };

  const handlePromoteRole = (id: string, role: string) => {
    alert(`Promoted student ${id} to ${role}`);
  };

  const filteredStudents = students.filter((s) => {
    const matchCollege = collegeFilter === 'All' || s.college === collegeFilter;
    const matchName = !searchName || s.name.toLowerCase().includes(searchName.toLowerCase());
    return matchCollege && matchName;
  });

  return (
    <div className="px-6 py-6 w-full">
      <h1 className="text-[16px] font-medium text-[#ECECEA]">All Students (Global)</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A58]" />
          <input 
            placeholder="Search name" 
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="pl-8 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
          />
        </div>

        <select 
          value={collegeFilter} 
          onChange={(e) => setCollegeFilter(e.target.value)}
          className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
        >
          <option value="All">All Colleges</option>
          <option value="Anna University">Anna University</option>
          <option value="VIT Chennai">VIT Chennai</option>
          <option value="SRM Institute">SRM Institute</option>
        </select>
      </div>

      <div className="mt-4 border border-[#3A3A38] rounded-lg overflow-x-auto bg-[#1F1F1E]">
        <div className="min-w-[900px]">
          <div className="flex items-center px-4 py-2.5 bg-[#1F1F1E] text-[11px] text-[#5A5A58] uppercase tracking-wider">
            <div className="w-[15%]">Name</div>
            <div className="w-[15%]">College</div>
            <div className="w-[20%]">Email</div>
            <div className="w-[10%]">Year</div>
            <div className="w-[10%]">Branch</div>
            <div className="w-[10%]">Joined</div>
            <div className="w-[20%] text-right">Action</div>
          </div>
          
          <div className="flex flex-col">
            {filteredStudents.length === 0 ? (
              <div className="py-8">
                <EmptyState 
                  icon={Users} 
                  heading="No students found" 
                />
              </div>
            ) : (
              filteredStudents.map((s) => (
                <div key={s.id} className="flex items-center px-4 py-3 border-t border-[#2E2E2C] hover:bg-[#2C2C2A]">
                  <div className="w-[15%] text-[13px] text-[#ECECEA] truncate pr-2">{s.name}</div>
                  <div className="w-[15%] text-[13px] text-[#8C8C8A] truncate pr-2">{s.college}</div>
                  <div className="w-[20%] text-[13px] text-[#8C8C8A] truncate pr-2">{s.email}</div>
                  <div className="w-[10%] text-[13px] text-[#8C8C8A]">{s.year}</div>
                  <div className="w-[10%] text-[13px] text-[#8C8C8A]">{s.branch}</div>
                  <div className="w-[10%] text-[13px] text-[#8C8C8A]">{s.joined}</div>
                  <div className="w-[20%] flex justify-end">
                    <button onClick={() => handleDelete(s.id)} className="text-[13px] text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
