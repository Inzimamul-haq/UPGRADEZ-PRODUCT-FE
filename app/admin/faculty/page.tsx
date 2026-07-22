"use client";

import React, { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { FacultyTableRow } from '@/components/admin/FacultyTableRow';
import { EmptyState } from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

type DepartmentOption = {
  id: string;
  name: string;
  branch: string;
};

export default function AdminFacultyPage() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [searchName, setSearchName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editRole, setEditRole] = useState('');

  const toast = useToast();

  const fetchFaculty = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/profiles/faculty', {
        params: { search: searchName, page, limit: rowsPerPage }
      });
      setFaculty(res.data.faculty);
      setTotal(res.data.pagination.total);
    } catch (err: any) {
      toast.error('Failed to load faculty');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [searchName, page, rowsPerPage]);

  useEffect(() => {
    if (!editModalOpen) return;
    const loadDepartments = async () => {
      try {
        const { data } = await api.get<{ departments: DepartmentOption[] }>('/api/departments');
        setDepartments(data.departments ?? []);
      } catch {
        toast.error('Failed to load departments');
      }
    };
    loadDepartments();
  }, [editModalOpen]);


  const handleEdit = (id: string) => {
    const fac = faculty.find(f => f.id === id);
    if (!fac) return;
    setEditingFaculty(fac);
    setEditName(fac.name);
    setEditEmail(fac.email);
    setEditDepartmentId(fac.departmentId || fac.department?.id || '');
    setEditRole(fac.role);
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingFaculty) return;
    try {
      await api.put(`/api/profiles/faculty/${editingFaculty.id}`, {
        name: editName,
        email: editEmail,
        departmentId: editDepartmentId || null,
        role: editRole
      });
      toast.success('Faculty updated successfully');
      setEditModalOpen(false);
      fetchFaculty();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update faculty');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/profiles/faculty/${id}`);
      toast.success('Faculty deleted successfully');
      fetchFaculty();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete faculty');
    }
  };

  const totalPages = Math.ceil(total / parseInt(rowsPerPage, 10));

  return (
    <div className="px-6 py-6 w-full relative">
      <h1 className="text-[16px] font-medium text-[#ECECEA]">Faculty</h1>

      <div className="mt-4 mb-4 flex flex-wrap gap-3">
        <div className="relative">
          <input
            placeholder="Search name"
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setPage(1);
            }}
            className="w-48 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]"
          />
        </div>
      </div>

      <div className="border border-[#3A3A38] rounded-lg overflow-x-auto bg-[#1F1F1E]">
        <div className="min-w-[900px]">
          <div className="flex items-center px-4 py-2.5 bg-[#1F1F1E] text-[11px] text-[#5A5A58] uppercase tracking-wider">
            <div className="w-[20%]">Name</div>
            <div className="w-[26%]">Email</div>
            <div className="w-[24%]">Department</div>
            <div className="w-[10%]">Role</div>
            <div className="w-[20%] text-right">Action</div>
          </div>

          <div className="flex flex-col">
            {isLoading ? (
               <div className="py-8 text-center text-[#5A5A58] text-[13px]">Loading...</div>
            ) : faculty.length === 0 ? (
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
                  faculty={{
                    id: f.id,
                    name: f.name,
                    email: f.email,
                    branch: f.branch || '',
                    department: f.department?.name || '-',
                    role: f.role,
                  }}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>

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

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-xl">
            <h2 className="mb-5 text-[14px] font-medium text-[#ECECEA]">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[12px] text-[#8C8C8A]">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-[#8C8C8A]">Email</label>
                <input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-[#8C8C8A]">Department</label>
                <select
                  value={editDepartmentId}
                  onChange={(e) => setEditDepartmentId(e.target.value)}
                  className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
                >
                  <option value="">— Select Department —</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-[#8C8C8A]">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
                >
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                  <option value="student">Student (Demote)</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-[13px] text-[#8C8C8A] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-2 text-[13px] text-[#ECECEA] transition-colors hover:bg-[#333331]"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
