"use client";

import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { StudentTableRow } from '@/components/admin/StudentTableRow';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

import { QUALIFICATION_OPTIONS } from '@/lib/constants';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [yearFilter, setYearFilter] = useState('All');
  const [qualificationFilter, setQualificationFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [searchName, setSearchName] = useState('');
  
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkYear, setBulkYear] = useState('1');
  const [bulkQualification, setBulkQualification] = useState('');
  const [bulkPromoteTo, setBulkPromoteTo] = useState('');

  const toast = useToast();

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        search: searchName,
        qualification: qualificationFilter,
        section: sectionFilter,
        page,
        limit: rowsPerPage
      };
      if (yearFilter !== 'All') {
        params.year = parseInt(yearFilter.replace(/\D/g, ''), 10);
      }

      const res = await api.get('/api/profiles/students', { params });
      setStudents(res.data.students);
      setTotal(res.data.pagination.total);
    } catch (err: any) {
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchName, yearFilter, qualificationFilter, sectionFilter, page, rowsPerPage]);

  const handleDelete = async (id: string) => {
    // We can reuse deleteFaculty endpoint if we want, but wait, the endpoint is /api/profiles/faculty/:id. 
    // Wait, let's just make a generic endpoint or reuse faculty. 
    // But since it's requireAdmin it's fine. Actually let me use a generic one or I can just use /api/profiles/faculty/:id which deletes any profile.
    try {
      await api.delete(`/api/profiles/faculty/${id}`); // this deletes by ID regardless of role
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (err: any) {
      toast.error('Failed to delete student');
    }
  };


  const availablePromoteYears = ['1', '2', '3', '4'].filter(y => {
    return parseInt(y) > parseInt(bulkYear);
  });

  const handleBulkUpdate = async () => {
    if (!bulkQualification || !bulkPromoteTo) return;
    try {
      await api.post('/api/profiles/students/bulk-promote', {
        currentYear: bulkYear,
        qualification: bulkQualification,
        targetYear: bulkPromoteTo
      });
      toast.success('Students promoted successfully');
      setShowBulkModal(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to promote students');
    }
  };

  const totalPages = Math.ceil(total / parseInt(rowsPerPage, 10)) || 1;

  return (
    <div className="px-6 py-6 w-full relative">
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
            onChange={(e) => {
              setSearchName(e.target.value);
              setPage(1);
            }}
            className="pl-8 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
          />
        </div>

        <select 
          value={yearFilter} 
          onChange={(e) => {
            setYearFilter(e.target.value);
            setPage(1);
          }}
          className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
        >
          <option value="All">All Years</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>
        
        <select 
          value={qualificationFilter}
          onChange={(e) => {
            setQualificationFilter(e.target.value);
            setPage(1);
          }}
          className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
        >
          <option value="">All Qualifications</option>
          {QUALIFICATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        
        <input 
          placeholder="Section (e.g. A)" 
          value={sectionFilter}
          onChange={(e) => {
            setSectionFilter(e.target.value);
            setPage(1);
          }}
          className="w-32 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
        />
      </div>

      <div className="mt-4 border border-[#3A3A38] rounded-lg overflow-x-auto bg-[#1F1F1E]">
        <div className="min-w-[800px]">
          <div className="flex items-center px-4 py-2.5 bg-[#1F1F1E] text-[11px] text-[#5A5A58] uppercase tracking-wider">
            <div className="w-[20%]">Name</div>
            <div className="w-[25%]">Email</div>
            <div className="w-[10%]">Year</div>
            <div className="w-[15%]">Qualification</div>
            <div className="w-[10%]">Section</div>
            <div className="w-[10%]">Joined</div>
            <div className="w-[10%] text-right">Action</div>
          </div>
          
          <div className="flex flex-col">
            {isLoading ? (
               <div className="py-8 text-center text-[#5A5A58] text-[13px]">Loading...</div>
            ) : students.length === 0 ? (
              <div className="py-8">
                <EmptyState 
                  icon={Users} 
                  heading="No students found" 
                  subtext="Try adjusting your filters" 
                />
              </div>
            ) : (
              students.map((s) => (
                <StudentTableRow 
                  key={s.id} 
                  student={{
                    id: s.id,
                    name: s.name,
                    email: s.email,
                    year: s.year ? `${s.year} Year` : '-',
                    qualification: s.qualification || '-',
                    section: s.section || '-',
                    joined: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-',
                    role: s.role || 'student',
                  }} 
                  onDelete={handleDelete}
                  onPromoteSuccess={fetchStudents}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#2E2E2C] bg-[#1F1F1E]">
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-[#8C8C8A]">
              Showing {Math.min((page - 1) * parseInt(rowsPerPage) + 1, total)} to {Math.min(page * parseInt(rowsPerPage), total)} of {total} results
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#8C8C8A]">Rows per page:</span>
              <select 
                value={rowsPerPage} 
                onChange={(e) => {
                  setRowsPerPage(e.target.value);
                  setPage(1);
                }}
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
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 text-[12px] text-[#5A5A58] border border-[#2E2E2C] rounded disabled:cursor-not-allowed hover:bg-[#2C2C2A]"
            >
              Previous
            </button>
            <button className="px-2 py-1 text-[12px] text-[#ECECEA] bg-[#2C2C2A] border border-[#4A4A48] rounded">
              {page}
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2 py-1 text-[12px] text-[#5A5A58] border border-[#2E2E2C] rounded disabled:cursor-not-allowed hover:bg-[#2C2C2A]"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1F1F1E] border border-[#3A3A38] rounded-lg p-6 max-w-sm w-full shadow-xl">
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
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] text-[#8C8C8A] mb-1">Qualification</label>
                <select 
                  value={bulkQualification} 
                  onChange={(e) => setBulkQualification(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                >
                  <option value="" disabled>Select Qualification</option>
                  {QUALIFICATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
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
                    <option key={y} value={y}>{y} Year</option>
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
                disabled={!bulkQualification || !bulkPromoteTo}
                className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-4 py-1.5 text-[13px] text-[#ECECEA] hover:bg-[#333331] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Promote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
