"use client";

import React, { useState, useEffect } from 'react';
import { Users, Search, SlidersHorizontal, X } from 'lucide-react';
import { StudentTableRow } from '@/components/admin/StudentTableRow';
import { TableShell } from '@/components/ui/TableShell';
import { TablePagination } from '@/components/ui/TablePagination';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { AddProfileModal } from '@/components/admin/AddProfileModal';

import { BRANCH_OPTIONS } from '@/lib/constants';
import { extractNumber } from '@/lib/utils';

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

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkYear, setBulkYear] = useState('1');
  const [bulkBranch, setBulkBranch] = useState('');
  const [bulkDepartment, setBulkDepartment] = useState('');
  const [bulkPromoteTo, setBulkPromoteTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

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
        params.year = parseInt(extractNumber(yearFilter), 10);
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
      } catch (err) { }
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
    try {
      await api.delete(`/api/profiles/faculty/${id}`);
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
    <div className="px-3 sm:px-6 py-4 sm:py-6 w-full relative">
      {/* Header - mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-8 p-2 sm:mt-0">
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Students</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-3 py-1.5 text-[12px] sm:text-[14px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
          >
            Add Student
          </button>
          <button
            onClick={handleDownloadCSV}
            className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-3 py-1.5 text-[12px] sm:text-[14px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
          >
            Download
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-3 py-1.5 text-[12px] sm:text-[14px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
          >
            Bulk Update
          </button>
        </div>
      </div>

      {/* Mobile Search and Filter Button */}
      <div className="sm:hidden mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5A5A58]" />
          <input
            placeholder="Search name"
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
          />
        </div>
        <button
          onClick={() => setShowMobileFilters(true)}
          className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] flex items-center gap-1.5"
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </div>

      {/* Desktop Filters */}


      {(() => {
        const filterControls = (
          <>
            {/* Department */}
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setYearFilter('All');
                setBatchYearFilter('All');
                setRegulationFilter('All');
                setPage(1);
              }}
              className="w-full sm:w-auto sm:flex-none rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-2 sm:px-3 py-2 sm:py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] min-w-[0px] sm:min-w-[150px]"
            >
              <option value="">All Departments</option>
              {departments.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.branch} - {opt.name}</option>
              ))}
            </select>

            {/* Batch Year */}
            <select
              value={batchYearFilter}
              onFocus={() => {
                if (!departmentFilter) {
                  toast.error('Select a department first');
                }
              }}
              onChange={(e) => {
                if (!departmentFilter) return;
                setBatchYearFilter(e.target.value);
                setPage(1);
              }}
              className={`w-full sm:w-auto sm:flex-none rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-2 sm:px-3 py-2 sm:py-1.5 text-[13px] focus:outline-none focus:border-[#4A4A48] min-w-[0px] sm:min-w-[130px] ${!departmentFilter ? 'text-[#5A5A58] cursor-not-allowed opacity-60' : 'text-[#ECECEA]'
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

            {/* Regulation */}
            <select
              value={regulationFilter}
              onFocus={() => {
                if (!departmentFilter) {
                  toast.error('Select a department first');
                }
              }}
              onChange={(e) => {
                if (!departmentFilter) return;
                setRegulationFilter(e.target.value);
                setPage(1);
              }}
              className={`w-full sm:w-auto sm:flex-none rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-2 sm:px-3 py-2 sm:py-1.5 text-[13px] focus:outline-none focus:border-[#4A4A48] min-w-[0px] sm:min-w-[130px] ${!departmentFilter ? 'text-[#5A5A58] cursor-not-allowed opacity-60' : 'text-[#ECECEA]'
                }`}
            >
              <option value="All">All Regulations</option>
              {availableRegulations.length > 0 ? (
                availableRegulations.map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))
              ) : (
                <option value="" disabled>No regulations</option>
              )}
            </select>

            {/* Year */}
            <select
              value={yearFilter}
              onFocus={() => {
                if (!departmentFilter) {
                  toast.error('Select a department first');
                }
              }}
              onChange={(e) => {
                if (!departmentFilter) return;
                setYearFilter(e.target.value);
                setPage(1);
              }}
              className={`w-full sm:w-auto sm:flex-none rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-2 sm:px-3 py-2 sm:py-1.5 text-[13px] focus:outline-none focus:border-[#4A4A48] min-w-[0px] sm:min-w-[130px] ${!departmentFilter ? 'text-[#5A5A58] cursor-not-allowed opacity-60' : 'text-[#ECECEA]'
                }`}
            >
              <option value="All">All Years</option>
              {Array.from({ length: maxYears }, (_, i) => i + 1).map(y => (
                <option key={y} value={String(y)}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>
              ))}
            </select>

            {/* Section */}
            {departmentFilter ? (
              <select
                value={sectionFilter}
                onChange={(e) => {
                  setSectionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto sm:flex-none rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-2 sm:px-3 py-2 sm:py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] min-w-[0px] sm:min-w-[120px]"
              >
                <option value="">All Sections</option>
                {departments.find(d => d.id === departmentFilter)?.sections?.map((s: string) => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            ) : (
              <select
                disabled
                className="w-full sm:w-auto sm:flex-none rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-2 sm:px-3 py-2 sm:py-1.5 text-[13px] text-[#5A5A58] focus:outline-none focus:border-[#4A4A48] min-w-[0px] sm:min-w-[120px] opacity-50 cursor-not-allowed"
              >
                <option value="">All Sections</option>
              </select>
            )}
          </>
        );

        return (
          <>
            {/* Desktop filters wrapper */}
            <div className="hidden sm:flex mt-4 items-center gap-2 sm:gap-3 w-full">
              {/* Search */}
              <div className="relative w-[200px] flex-none">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A58]"
                />
                <input
                  placeholder="Search name"
                  value={searchName}
                  onChange={(e) => {
                    setSearchName(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
                />
              </div>

              {/* Filters */}
              {filterControls}
            </div>

            {/* Mobile Filter Modal - rendered outside the hidden sm:flex div! */}
            {showMobileFilters && (
              <div className="fixed inset-0 z-50 flex items-center sm:hidden bg-black/60 backdrop-blur-sm transition-opacity p-2">
                <div className="w-full bg-[#1F1F1E] rounded-t-xl border-t border-[#3A3A38] p-5 flex flex-col gap-4 animate-in slide-in-from-bottom-full duration-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[15px] font-medium text-[#ECECEA]">Filters</span>
                    <button onClick={() => setShowMobileFilters(false)} className="text-[#8C8C8A] p-1 bg-[#2C2C2A] rounded-md">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    {filterControls}
                  </div>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full mt-2 bg-[#ECECEA] text-[#1C1C1B] py-2.5 rounded-lg text-[14px] font-medium transition-colors hover:bg-white"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Mobile card list — hidden on sm+ */}
      <div className="sm:hidden mt-4 flex flex-col divide-y divide-[#2E2E2C] border border-[#3A3A38] rounded-lg overflow-hidden bg-[#1F1F1E]">
        {isLoading ? (
          <p className="px-4 py-6 text-[13px] text-[#5A5A58]">Loading...</p>
        ) : students.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-[#5A5A58] text-center">No students found</p>
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
              variant="card"
              isExpanded={expandedId === s.id}
              onToggleExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
            />
          ))
        )}
      </div>

      {/* Table */}
      <TableShell
        columns={[
          { label: 'Roll No', width: '12%' },
          { label: 'Name', width: '14%' },
          { label: 'Email', width: '18%' },
          { label: 'Year', width: '6%' },
          { label: 'Batch', width: '10%' },
          { label: 'Branch', width: '8%' },
          { label: 'Department', width: '12%' },
          { label: 'Section', width: '8%' },
          { label: 'Action', width: '12%', align: 'right' },
        ]}
        isLoading={isLoading}
        isEmpty={students.length === 0}
        emptyIcon={Users}
        emptyHeading="No students found"
        emptySubtext="Try adjusting your filters"
        minWidth="1000px"
      >
        {students.map((s) => (
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
        ))}
      </TableShell>

      <TablePagination
        page={page}
        total={total}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(1); }}
      />

      {/* Bulk Update Modal - mobile responsive */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#1F1F1E] border border-[#3A3A38] rounded-lg p-4 sm:p-6 max-w-sm w-full shadow-xl mx-2 sm:mx-0">
            <h2 className="text-[14px] font-medium text-[#ECECEA] mb-4">Bulk Promote Students</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] sm:text-[12px] text-[#8C8C8A] mb-1">Current Year</label>
                <select
                  value={bulkYear}
                  onChange={(e) => {
                    setBulkYear(e.target.value);
                    setBulkPromoteTo('');
                  }}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[12px] sm:text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  {bulkMaxYears >= 3 && <option value="3">3rd Year</option>}
                  {bulkMaxYears >= 4 && <option value="4">4th Year</option>}
                  {bulkMaxYears >= 5 && <option value="5">5th Year</option>}
                </select>
              </div>

              <div>
                <label className="block text-[11px] sm:text-[12px] text-[#8C8C8A] mb-1">Branch</label>
                <select
                  value={bulkBranch}
                  onChange={(e) => setBulkBranch(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[12px] sm:text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                >
                  <option value="" disabled>Select Branch</option>
                  {BRANCH_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] sm:text-[12px] text-[#8C8C8A] mb-1">Department</label>
                <select
                  value={bulkDepartment}
                  onChange={(e) => setBulkDepartment(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[12px] sm:text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
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
                <label className="block text-[11px] sm:text-[12px] text-[#8C8C8A] mb-1">Promote To</label>
                <select
                  value={bulkPromoteTo}
                  onChange={(e) => setBulkPromoteTo(e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[12px] sm:text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                >
                  <option value="" disabled>Select Year</option>
                  {availablePromoteYears.map(y => (
                    <option key={y} value={y}>{y} Year</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-[12px] sm:text-[13px] text-[#5A5A58] hover:text-[#8C8C8A] transition-colors py-2 sm:py-0"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={!bulkDepartment || !bulkPromoteTo}
                className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-4 py-2 sm:py-1.5 text-[12px] sm:text-[13px] text-[#ECECEA] hover:bg-[#333331] disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
              >
                Promote
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddProfileModal
          defaultRole="student"
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchStudents(); }}
        />
      )}
    </div>
  );
}