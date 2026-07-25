"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Users, User, UserCog, Search } from 'lucide-react';
import { TableShell, ColumnDef } from '@/components/ui/TableShell';
import { TablePagination } from '@/components/ui/TablePagination';
import api from '@/lib/api';
import { UserModal } from '@/components/super-admin/UserModal';
import { ConfirmDeleteModal } from '@/components/super-admin/ConfirmDeleteModal';
import { College, Department } from '@/lib/types';

export default function UsersPage() {
  const [role, setRole] = useState<'student' | 'staff'>('student');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  
  const [selectedBatchYear, setSelectedBatchYear] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  // Table Data
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState("10");

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  useEffect(() => {
    api.get('/api/superadmin/users/filters/colleges')
      .then(res => setColleges(Array.isArray(res.data) ? res.data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCollege) {
      api.get(`/api/superadmin/users/filters/departments?collegeId=${selectedCollege}`)
        .then(res => {
          setDepartments(Array.isArray(res.data) ? res.data : []);
          setSelectedDepartment('');
          setSelectedBatchYear('');
          setSelectedSection('');
        })
        .catch(console.error);
    } else {
      setDepartments([]);
      setSelectedDepartment('');
      setSelectedBatchYear('');
      setSelectedSection('');
    }
  }, [selectedCollege]);

  // Derived Batch Years
  const batchYears = useMemo(() => {
    if (!selectedDepartment) return [];
    const dept = departments.find(d => d.id === selectedDepartment);
    if (!dept) return [];
    
    const duration = dept.durationYears || 4;
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = -1; i < 5; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + duration;
      years.push(`${startYear}-${endYear}`);
    }
    return years.sort().reverse();
  }, [selectedDepartment, departments]);

  // Derived Sections
  const sections = useMemo(() => {
    if (!selectedDepartment) return [];
    const dept = departments.find(d => d.id === selectedDepartment);
    return dept?.sections || [];
  }, [selectedDepartment, departments]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit,
        });
        if (selectedCollege) query.append('collegeId', selectedCollege);
        if (selectedDepartment) query.append('departmentId', selectedDepartment);
        if (searchQuery) query.append('search', searchQuery); // Placeholder for future backend support
        if (role === 'student') {
          if (selectedBatchYear) query.append('batchYear', selectedBatchYear);
          if (selectedSection) query.append('section', selectedSection);
        }

        const res = await api.get(`/api/superadmin/users/${role === 'student' ? 'students' : 'staff'}?${query.toString()}`);
        
        setData(res.data?.data || []);
        setTotal(res.data?.meta?.total || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [role, selectedCollege, selectedDepartment, selectedBatchYear, selectedSection, page, limit, searchQuery]);

  const refreshData = () => {
    setPage(1);
    // fetchData will be triggered by page change or we can force it, but since page is in deps, it triggers if page changes. If page is already 1, we need to trigger it manually.
    // A simple hack is to just re-fetch:
    const query = new URLSearchParams({
      page: page.toString(),
      limit,
    });
    if (selectedCollege) query.append('collegeId', selectedCollege);
    if (selectedDepartment) query.append('departmentId', selectedDepartment);
    if (searchQuery) query.append('search', searchQuery);
    if (role === 'student') {
      if (selectedBatchYear) query.append('batchYear', selectedBatchYear);
      if (selectedSection) query.append('section', selectedSection);
    }
    setIsLoading(true);
    api.get(`/api/superadmin/users/${role === 'student' ? 'students' : 'staff'}?${query.toString()}`)
      .then(res => {
        setData(res.data?.data || []);
        setTotal(res.data?.meta?.total || 0);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const handleDelete = async (secret?: string) => {
    if (!userToDelete) return;
    try {
      await api.delete(`/api/superadmin/users/${userToDelete.id}`, {
        headers: { 'x-super-admin-secret': secret }
      });
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      refreshData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const studentColumns: ColumnDef[] = [
    { label: "Roll No", width: "120px" },
    { label: "Name", width: "200px" },
    { label: "Email", width: "250px" },
    { label: "Department", width: "150px" },
    { label: "College", width: "120px" },
    { label: "Batch Year", width: "120px" },
    { label: "Year", width: "80px" },
    { label: "Section", width: "80px" },
    { label: "Joined Date", width: "120px" },
    { label: "Actions", width: "100px", align: "right" },
  ];

  const staffColumns: ColumnDef[] = [
    { label: "Name", width: "200px" },
    { label: "Email", width: "250px" },
    { label: "Department", width: "150px" },
    { label: "College", width: "120px" },
    { label: "Joined Date", width: "120px" },
    { label: "Role", width: "100px" },
    { label: "Actions", width: "100px", align: "right" },
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header & Role Toggle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-text-muted text-sm">View and manage all users across colleges</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-panel border border-border-default rounded-lg p-1 w-fit">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${role === 'student' ? 'bg-[#2C2C2A] text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
              onClick={() => {
                setRole('student');
                setPage(1);
              }}
            >
              <User className="w-4 h-4" />
              Students
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${role === 'staff' ? 'bg-[#2C2C2A] text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
              onClick={() => {
                setRole('staff');
                setPage(1);
                setSelectedBatchYear('');
                setSelectedSection('');
              }}
            >
              <UserCog className="w-4 h-4" />
              Faculty & Admin
            </button>
          </div>
          
          <button 
            onClick={() => { setUserToEdit(null); setIsUserModalOpen(true); }}
            className="rounded-md bg-[#ECECEA] px-4 py-2 text-sm font-medium text-[#1C1C1B] transition-colors hover:bg-white"
          >
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-panel border border-border-default rounded-lg space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-[#2C2C2A] border border-border-default rounded-md text-sm text-text-primary outline-none focus:border-text-muted transition-colors"
          />
        </div>

        {/* Grid Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted uppercase font-semibold tracking-wider">College</label>
            <select 
              value={selectedCollege} 
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="bg-[#2C2C2A] border border-border-default rounded-md text-sm text-text-primary px-3 py-2 outline-none focus:border-text-muted transition-colors"
            >
              <option value="">All Colleges</option>
              {colleges.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted uppercase font-semibold tracking-wider">Department</label>
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={!selectedCollege}
              className="bg-[#2C2C2A] border border-border-default rounded-md text-sm text-text-primary px-3 py-2 outline-none focus:border-text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.branch})</option>
              ))}
            </select>
          </div>

          {role === 'student' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted uppercase font-semibold tracking-wider">Batch Year</label>
                <select 
                  value={selectedBatchYear} 
                  onChange={(e) => setSelectedBatchYear(e.target.value)}
                  disabled={!selectedDepartment}
                  className="bg-[#2C2C2A] border border-border-default rounded-md text-sm text-text-primary px-3 py-2 outline-none focus:border-text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Batches</option>
                  {batchYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted uppercase font-semibold tracking-wider">Section</label>
                <select 
                  value={selectedSection} 
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={!selectedDepartment}
                  className="bg-[#2C2C2A] border border-border-default rounded-md text-sm text-text-primary px-3 py-2 outline-none focus:border-text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Sections</option>
                  {sections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <TableShell
        columns={role === 'student' ? studentColumns : staffColumns}
        isLoading={isLoading}
        isEmpty={data.length === 0}
        emptyIcon={Users}
        emptyHeading={`No ${role === 'student' ? 'students' : 'staff'} found`}
        emptySubtext="Try adjusting your filters to see more results."
        minWidth="1000px"
      >
        {data.map((user) => (
          <div key={user.id} className="flex items-center px-4 py-3 border-b border-[#2E2E2C] last:border-0 hover:bg-[#2C2C2A]/50 transition-colors text-sm text-text-primary">
            {role === 'student' ? (
              <>
                <div style={{ width: "120px" }}>{user.rollNo || '-'}</div>
                <div style={{ width: "200px" }} className="font-medium truncate pr-2">{user.name}</div>
                <div style={{ width: "250px" }} className="text-text-muted truncate pr-2">{user.email}</div>
                <div style={{ width: "150px" }} className="truncate pr-2">{user.department?.name || '-'}</div>
                <div style={{ width: "120px" }} className="truncate pr-2">{user.college?.shortName || '-'}</div>
                <div style={{ width: "120px" }}>{user.batchYear || '-'}</div>
                <div style={{ width: "80px" }}>{user.year || '-'}</div>
                <div style={{ width: "80px" }}>{user.section || '-'}</div>
                <div style={{ width: "120px" }} className="text-text-muted">{formatDate(user.createdAt)}</div>
              </>
            ) : (
              <>
                <div style={{ width: "200px" }} className="font-medium truncate pr-2">{user.name}</div>
                <div style={{ width: "250px" }} className="text-text-muted truncate pr-2">{user.email}</div>
                <div style={{ width: "150px" }} className="truncate pr-2">{user.department?.name || '-'}</div>
                <div style={{ width: "120px" }} className="truncate pr-2">{user.college?.shortName || '-'}</div>
                <div style={{ width: "120px" }} className="text-text-muted">{formatDate(user.createdAt)}</div>
                <div style={{ width: "100px" }}>
                  <span className="px-2 py-0.5 rounded text-xs bg-[#3A3A38] text-text-primary capitalize">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              </>
            )}
            <div style={{ width: "100px" }} className="flex justify-end gap-3">
              <button onClick={() => { setUserToEdit(user); setIsUserModalOpen(true); }} className="text-text-muted hover:text-text-primary text-xs transition-colors font-medium">Edit</button>
              <button onClick={() => { setUserToDelete(user); setIsDeleteModalOpen(true); }} className="text-red-400 hover:text-red-300 text-xs transition-colors font-medium">Delete</button>
            </div>
          </div>
        ))}
      </TableShell>

      {total > 0 && (
        <TablePagination
          page={page}
          total={total}
          rowsPerPage={limit}
          onPageChange={setPage}
          onRowsPerPageChange={(v) => {
            setLimit(v);
            setPage(1);
          }}
        />
      )}

      <UserModal 
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSuccess={refreshData}
        userToEdit={userToEdit}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
        requireSecret={true}
      />
    </div>
  );
}