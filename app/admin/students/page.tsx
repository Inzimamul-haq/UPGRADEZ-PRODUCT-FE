"use client";

import React, { useState } from 'react';
import { Users, Search } from 'lucide-react';
import { StudentTableRow } from '@/components/admin/StudentTableRow';
import { EmptyState } from '@/components/ui/EmptyState';

const initialStudents = [
  { id: '1', name: 'John Doe', email: 'john@example.com', year: '3rd Year', branch: 'CSE', section: 'A', joined: '2023-08-12' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', year: '2nd Year', branch: 'ECE', section: 'B', joined: '2023-08-15' },
  { id: '3', name: 'Alice Johnson', email: 'alice@example.com', year: '1st Year', branch: 'IT', section: '', joined: '2023-09-01' },
];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState(initialStudents);
  const [yearFilter, setYearFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [searchName, setSearchName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('10');

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkYear, setBulkYear] = useState('1st Year');
  const [bulkBranch, setBulkBranch] = useState('');
  const [bulkPromoteTo, setBulkPromoteTo] = useState('');

  const handleDelete = (id: string) => {
    setStudents(students.filter((s) => s.id !== id));
  };

  const handlePromoteRole = (id: string, role: string) => {
    // Role promotion logic (mocked)
    alert(`Promoted student ${id} to ${role}`);
  };

  const filteredStudents = students.filter((s) => {
    const matchYear = yearFilter === 'All' || s.year === yearFilter;
    const matchBranch = !branchFilter || s.branch.toLowerCase().includes(branchFilter.toLowerCase());
    const matchSection = !sectionFilter || s.section?.toLowerCase().includes(sectionFilter.toLowerCase());
    const matchName = !searchName || s.name.toLowerCase().includes(searchName.toLowerCase());
    return matchYear && matchBranch && matchSection && matchName;
  });

  const availablePromoteYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'].filter(y => {
    return parseInt(y[0]) > parseInt(bulkYear[0]);
  });

  const handleBulkUpdate = () => {
    if (!bulkBranch || !bulkPromoteTo) return;
    
    setStudents(prev => prev.map(s => {
      if (s.year === bulkYear && s.branch.toLowerCase() === bulkBranch.toLowerCase()) {
        return { ...s, year: bulkPromoteTo };
      }
      return s;
    }));
    setShowBulkModal(false);
  };

  return (
    <div className="px-6 py-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Students</h1>
        <button 
          onClick={() => setShowBulkModal(true)}
          className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-3 py-1.5 text-[14px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
        >
          Bulk Update
        </button>
      </div>

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
          placeholder="Branch" 
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="w-32 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
        />
        
        <input 
          placeholder="Section" 
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="w-24 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
        />
      </div>

      <div className="mt-4 border border-[#3A3A38] rounded-lg overflow-x-auto bg-[#1F1F1E]">
        <div className="min-w-[800px]">
          <div className="flex items-center px-4 py-2.5 bg-[#1F1F1E] text-[11px] text-[#5A5A58] uppercase tracking-wider">
            <div className="w-[20%]">Name</div>
            <div className="w-[25%]">Email</div>
            <div className="w-[10%]">Year</div>
            <div className="w-[10%]">Branch</div>
            <div className="w-[10%]">Section</div>
            <div className="w-[10%]">Joined</div>
            <div className="w-[15%] text-right">Action</div>
          </div>
          
          <div className="flex flex-col">
            {filteredStudents.length === 0 ? (
              <div className="py-8">
                <EmptyState 
                  icon={Users} 
                  heading="No students found" 
                  subtext="Try adjusting your filters" 
                />
              </div>
            ) : (
              filteredStudents.map((s) => (
                <StudentTableRow 
                  key={s.id} 
                  student={s} 
                  onDelete={handleDelete} 
                  onPromote={handlePromoteRole}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#2E2E2C] bg-[#1F1F1E]">
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-[#8C8C8A]">Showing 1 to {Math.min(parseInt(rowsPerPage), filteredStudents.length)} of {filteredStudents.length} results</span>
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

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-[#1F1F1E] border border-[#3A3A38] rounded-lg p-6 max-w-sm w-full z-50">
            <h2 className="text-[14px] font-medium text-[#ECECEA] mb-4">Bulk Promote Students</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] text-[#8C8C8A] mb-1">Current Year</label>
                <select 
                  value={bulkYear} 
                  onChange={(e) => {
                    setBulkYear(e.target.value);
                    setBulkPromoteTo('');
                  }}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] text-[#8C8C8A] mb-1">Branch</label>
                <input 
                  value={bulkBranch}
                  onChange={(e) => setBulkBranch(e.target.value)}
                  placeholder="e.g. CSE"
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#8C8C8A] mb-1">Promote To</label>
                <select 
                  value={bulkPromoteTo} 
                  onChange={(e) => setBulkPromoteTo(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                >
                  <option value="" disabled>Select Year</option>
                  {availablePromoteYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowBulkModal(false)}
                className="text-[13px] text-[#5A5A58] hover:text-[#8C8C8A] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkUpdate}
                disabled={!bulkBranch || !bulkPromoteTo}
                className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-4 py-1.5 text-[13px] text-[#ECECEA] hover:bg-[#333331] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
