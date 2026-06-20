"use client";

import React, { useState } from 'react';
import { SubjectAccordion } from '@/components/admin/SubjectAccordion';

const initialSubjects = [
  { 
    id: '1', 
    name: 'Data Structures', 
    code: 'CS8351', 
    department: 'Computer Science',
    branch: 'CSE',
    year: '2nd Year',
    academicYear: '2023-2027',
    pdf_url: '/dummy.pdf', 
    pdf_name: 'CS8351_Syllabus.pdf', 
    upload_date: '2023-08-01',
    isPublished: true,
  },
  { 
    id: '2', 
    name: 'Machine Learning', 
    code: 'CS8691', 
    department: 'Computer Science',
    branch: 'CSE',
    year: '3rd Year',
    pdf_url: '/dummy2.pdf',
    pdf_name: 'ML_Syllabus.pdf',
    upload_date: '2023-09-12',
    isPublished: true,
  },
];

export default function AdminSyllabusPage() {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [showAddModal, setShowAddModal] = useState(false);

  const [filterAcademicYear, setFilterAcademicYear] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');

  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newBranch, setNewBranch] = useState('');
  const [newYear, setNewYear] = useState('1st Year');

  const handleAddSubject = () => {
    if (!newName || !newCode || !newDept || !newBranch) return;
    
const newSubject = {
  id: Math.random().toString(36).substr(2, 9),
  name: newName,
  code: newCode,
  department: newDept,
  branch: newBranch,
  year: newYear,
  pdf_url: '',
  pdf_name: '',
  upload_date: '',
  isPublished: true,
};
    
    setSubjects([newSubject, ...subjects]);
    setNewName('');
    setNewCode('');
    setNewDept('');
    setNewBranch('');
    setNewYear('1st Year');
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const handleTogglePublish = (id: string, publishAcademicYear?: string) => {
    setSubjects(subjects.map((s) => {
      if (s.id === id) {
        if (!s.isPublished) return { ...s, isPublished: true };
        return { ...s, isPublished: false, stoppedAcademicYear: publishAcademicYear };
      }
      return s;
    }));
  };

  const filteredSubjects = subjects.filter(s => {
    const matchAY = filterAcademicYear === 'All' || s.academicYear === filterAcademicYear;
    const matchBranch = filterBranch === 'All' || s.branch.toLowerCase().includes(filterBranch.toLowerCase());
    return matchAY && matchBranch;
  });

  return (
    <div className="px-6 py-6 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Syllabus</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-3 py-1.5 text-[14px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
        >
          Add subject
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <select 
          value={filterAcademicYear}
          onChange={(e) => setFilterAcademicYear(e.target.value)}
          className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
        >
          <option value="All">All Academic Years</option>
          <option value="1">1st year</option>
          <option value="2">2nd year</option>
          <option value="3">3rd year</option>
          <option value="4">4th year</option>
        </select>
        
        <input 
          placeholder="Filter by Branch" 
          value={filterBranch === 'All' ? '' : filterBranch}
          onChange={(e) => setFilterBranch(e.target.value || 'All')}
          className="w-48 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
        />
      </div>

      <div className="flex flex-col gap-2">
        {filteredSubjects.map((s) => (
          <SubjectAccordion 
            key={s.id} 
            subject={s} 
            onDelete={handleDelete} 
            onTogglePublish={handleTogglePublish}
          />
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-[#1F1F1E] border border-[#3A3A38] rounded-lg p-6 max-w-md w-full z-50">
            <h2 className="text-[14px] font-medium text-[#ECECEA] mb-4">Add New Subject</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#8C8C8A] mb-1">Subject Name</label>
                  <input 
                    value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#8C8C8A] mb-1">Code</label>
                  <input 
                    value={newCode} onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#8C8C8A] mb-1">Department</label>
                  <input 
                    value={newDept} onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#8C8C8A] mb-1">Branch</label>
                  <input 
                    value={newBranch} onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#8C8C8A] mb-1">Year</label>
                  <select 
                    value={newYear} onChange={(e) => setNewYear(e.target.value)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#8C8C8A] mb-1">Upload PDF / DOCX</label>
                  <input 
                    type="file"
                    accept=".pdf,.docx"
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#8C8C8A] focus:outline-none focus:border-[#4A4A48] file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[12px] file:bg-[#1F1F1E] file:text-[#ECECEA] hover:file:bg-[#333331] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[13px] text-[#5A5A58] hover:text-[#8C8C8A] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSubject}
                disabled={!newName || !newCode || !newDept || !newBranch}
                className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-4 py-1.5 text-[13px] text-[#ECECEA] hover:bg-[#333331] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
