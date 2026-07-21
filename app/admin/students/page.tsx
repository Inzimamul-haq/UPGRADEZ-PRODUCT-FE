"use client";

import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { StudentTableRow } from '@/components/admin/StudentTableRow';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';

import { BRANCH_OPTIONS } from '@/lib/constants';

export default function AdminStudentsPage() {
  const { user } = useAuth();

  const [students, setStudents] = useState<any[]>([]);
  const [yearFilter, setYearFilter] = useState('All');
  const [batchYearFilter, setBatchYearFilter] = useState('All');
  const [regulationFilter, setRegulationFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [searchName, setSearchName] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [availableRegulations, setAvailableRegulations] = useState<string[]>(['R2021', 'R2025']);
  
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkYear, setBulkYear] = useState('1');
  const [bulkBranch, setBulkBranch] = useState('');
  const [bulkDepartment, setBulkDepartment] = useState('');
  const [bulkPromoteTo, setBulkPromoteTo] = useState('');
  
  const selectedDept = departments.find(d => d.id === departmentFilter);
  const maxYears = selectedDept?.durationYears || 4;

  const selectedBulkDept = departments.find(d => d.id === bulkDepartment);
  const bulkMaxYears = selectedBulkDept?.durationYears || 4;
  
  const toast = useToast();

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        search: searchName,
        departmentId: departmentFilter,
        section: sectionFilter,
        page,
        limit: rowsPerPage
      };
      if (yearFilter !== 'All') {
        params.year = parseInt(yearFilter.replace(/\D/g, ''), 10);
      }
      if (batchYearFilter !== 'All') {
        params.batchYear = batchYearFilter;
      }
      if (regulationFilter !== 'All') {
        params.regulation = regulationFilter;
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
    (async () => {
      try {
        const { data } = await api.get('/api/departments');
        setDepartments(data.departments || []);
      } catch (err) {}
    })();
  }, []);

  useEffect(() => {
    if (departmentFilter) {
      api.get(`/api/departments/${departmentFilter}/config`)
        .then(res => setAvailableRegulations(res.data.availableRegulations || []))
        .catch(() => setAvailableRegulations([]));
    } else {
      setAvailableRegulations(['R2021', 'R2025']);
    }
    // If current regulation filter is not in new list, reset to 'All'
    setRegulationFilter('All');
  }, [departmentFilter]);

  useEffect(() => {
    fetchStudents();
  }, [searchName, yearFilter, batchYearFilter, regulationFilter, branchFilter, departmentFilter, sectionFilter, page, rowsPerPage]);

  const handleDownloadCSV = () => {
    if (students.length === 0) {
      toast.error('No data to download');
      return;
    }
    const headers = ['Roll No', 'Name', 'Email', 'Year', 'Batch', 'Regulation', 'Branch', 'Department', 'Section'];
    const rows = students.map(s => [
      s.rollNo || '-',
      s.name || '-',
      s.email || '-',
      s.year ? `${s.year} Year` : '-',
      s.batchYear || '-',
      s.regulation || '-',
      s.department?.branch || '-',
      s.department?.name || '-',
      s.section || '-'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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


  const availablePromoteYears = Array.from({ length: bulkMaxYears }, (_, i) => String(i + 1)).filter(y => {
    return parseInt(y) > parseInt(bulkYear);
  });

  const handleBulkUpdate = async () => {
    if (!bulkDepartment || !bulkPromoteTo) return;
    try {
      await api.post('/api/profiles/students/bulk-promote', {
        currentYear: bulkYear,
        departmentId: bulkDepartment,
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
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadCSV}
            className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-3 py-1.5 text-[14px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
          >
            Download Data
          </button>
          <button 
            onClick={() => setShowBulkModal(true)}
            className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-3 py-1.5 text-[14px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
          >
            Bulk Update
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {/* 1. Search */}
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

        {/* 2. Department */}
        <select 
          value={departmentFilter}
          onChange={(e) => {
            setDepartmentFilter(e.target.value);
            setYearFilter('All');
            setBatchYearFilter('All');
            setRegulationFilter('All');
            setPage(1);
          }}
          className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
        >
          <option value="">All Departments</option>
          {departments.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.branch} · {opt.name}</option>
          ))}
        </select>

        {/* 3. Batch Year — guarded */}
        <select 
          value={batchYearFilter} 
          onFocus={() => {
            if (!departmentFilter) {
              toast.error('Select a department first to filter by batch year');
            }
          }}
          onChange={(e) => {
            if (!departmentFilter) return;
            setBatchYearFilter(e.target.value);
            setPage(1);
          }}
          className={`bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#4A4A48] ${
            !departmentFilter ? 'text-[#5A5A58] cursor-not-allowed opacity-60' : 'text-[#ECECEA]'
          }`}
        >
          <option value="All">All Batches</option>
          {Array.from({ length: 6 }, (_, i) => {
            const startYear = 2019 + i;
            const endYear = startYear + maxYears;
            const batch = `${startYear}-${endYear}`;
            return <option key={batch} value={batch}>{batch}</option>;
          })}
        </select>

        {/* 4. Regulation — guarded */}
        <select 
          value={regulationFilter} 
          onFocus={() => {
            if (!departmentFilter) {
              toast.error('Select a department first to filter by regulation');
            }
          }}
          onChange={(e) => {
            if (!departmentFilter) return;
            setRegulationFilter(e.target.value);
            setPage(1);
          }}
          className={`bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#4A4A48] ${
            !departmentFilter ? 'text-[#5A5A58] cursor-not-allowed opacity-60' : 'text-[#ECECEA]'
          }`}
        >
          <option value="All">All Regulations</option>
          {availableRegulations.length > 0 ? (
            availableRegulations.map(reg => (
              <option key={reg} value={reg}>{reg}</option>
            ))
          ) : (
            <option value="" disabled>No regulations available</option>
          )}
        </select>

        {/* 5. Year — guarded */}
        <select 
          value={yearFilter} 
          onFocus={() => {
            if (!departmentFilter) {
              toast.error('Select a department first to filter by year');
            }
          }}
          onChange={(e) => {
            if (!departmentFilter) return;
            setYearFilter(e.target.value);
            setPage(1);
          }}
          className={`bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#4A4A48] ${
            !departmentFilter ? 'text-[#5A5A58] cursor-not-allowed opacity-60' : 'text-[#ECECEA]'
          }`}
        >
          <option value="All">All Years</option>
          {Array.from({ length: maxYears }, (_, i) => i + 1).map(y => (
            <option key={y} value={String(y)}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>
          ))}
        </select>
        
        {/* 6. Section — only if dept selected */}
        {departmentFilter ? (
          <select 
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value);
              setPage(1);
            }}
            className="w-32 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
          >
            <option value="">All Sections</option>
            {departments.find(d => d.id === departmentFilter)?.sections?.map((s: string) => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        ) : (
          <select 
            disabled
            className="w-32 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#5A5A58] focus:outline-none focus:border-[#4A4A48] opacity-50 cursor-not-allowed"
          >
            <option value="">All Sections</option>
          </select>
        )}
      </div>

      <div className="mt-4 border border-[#3A3A38] rounded-lg overflow-x-auto bg-[#1F1F1E]">
        <div className="min-w-[1000px]">
          <div className="flex items-center px-4 py-2.5 bg-[#1F1F1E] text-[11px] text-[#5A5A58] uppercase tracking-wider">
            <div className="w-[12%]">Roll No</div>
            <div className="w-[14%]">Name</div>
            <div className="w-[18%]">Email</div>
            <div className="w-[6%]">Year</div>
            <div className="w-[10%]">Batch</div>
            <div className="w-[8%]">Branch</div>
            <div className="w-[12%]">Department</div>
            <div className="w-[8%]">Section</div>
            <div className="w-[12%] text-right">Action</div>
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
                    branch: s.department?.branch || '-',
                    department: s.department?.name || '-',
                    departmentId: s.departmentId || s.department?.id,
                    section: s.section || '-',
                    joined: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-',
                    role: s.role || 'student',
                    batchYear: s.batchYear,
                    rollNo: s.rollNo,
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
                  {bulkMaxYears >= 3 && <option value="3">3rd Year</option>}
                  {bulkMaxYears >= 4 && <option value="4">4th Year</option>}
                  {bulkMaxYears >= 5 && <option value="5">5th Year</option>}
                </select>
              </div>

              <div>
                <label className="block text-[12px] text-[#8C8C8A] mb-1">Branch</label>
                <select 
                  value={bulkBranch} 
                  onChange={(e) => setBulkBranch(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                >
                  <option value="" disabled>Select Branch</option>
                  {BRANCH_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] text-[#8C8C8A] mb-1">Department</label>
                <select 
                  value={bulkDepartment} 
                  onChange={(e) => setBulkDepartment(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                >
                  <option value="">— Select Department —</option>
                  {departments
                    .filter(d => !bulkBranch || d.branch === bulkBranch)
                    .map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
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
                disabled={!bulkDepartment || !bulkPromoteTo}
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
