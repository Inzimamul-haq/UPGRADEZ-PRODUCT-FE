"use client";

import React, { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { FacultyTableRow } from '@/components/admin/FacultyTableRow';
import { TableShell } from '@/components/ui/TableShell';
import { TablePagination } from '@/components/ui/TablePagination';
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

      <TableShell
        columns={[
          { label: 'Name', width: '20%' },
          { label: 'Email', width: '26%' },
          { label: 'Department', width: '24%' },
          { label: 'Role', width: '10%' },
          { label: 'Action', width: '20%', align: 'right' },
        ]}
        isLoading={isLoading}
        isEmpty={faculty.length === 0}
        emptyIcon={GraduationCap}
        emptyHeading="No faculty found"
        minWidth="900px"
      >
        {faculty.map((f) => (
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
        ))}
      </TableShell>

      <TablePagination
        page={page}
        total={total}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(1); }}
      />

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
