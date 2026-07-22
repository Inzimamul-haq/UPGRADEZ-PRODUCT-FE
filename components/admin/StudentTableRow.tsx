"use client";

import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import api from '@/lib/api';
import { BRANCH_OPTIONS } from '@/lib/constants';
import { DepartmentOption, StudentTableRowProps } from '@/lib/types';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

const ROLE_OPTIONS = ['student', 'faculty', 'admin'];

export function StudentTableRow({ student, onDelete, onPromoteSuccess }: StudentTableRowProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  const rawYear = student.year ? student.year.replace(/\D/g, '') : '';

  const [form, setForm] = useState({
    name: student.name,
    email: student.email,
    year: rawYear,
    branch: student.branch === '-' ? '' : student.branch,
    departmentId: student.departmentId ?? '',
    section: student.section === '-' ? '' : (student.section || ''),
    role: student.role || 'student',
  });

  useEffect(() => {
    if (!showEditModal) return;
    const loadDepartments = async () => {
      try {
        const { data } = await api.get<{ departments: DepartmentOption[] }>('/api/departments');
        setDepartments(data.departments ?? []);
      } catch {
        setEditError('Failed to load departments');
      }
    };
    loadDepartments();
  }, [showEditModal]);

  const filteredDepartments = useMemo(() => {
    if (!form.branch) return departments;
    return departments.filter(
      (d) => d.branch.toUpperCase() === form.branch.toUpperCase()
    );
  }, [departments, form.branch]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'branch') {
        next.departmentId = '';
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setEditError('');
    try {
      await api.patch(`/api/profiles/students/${student.id}`, {
        name: form.name.trim(),
        email: form.email.trim(),
        year: form.year,
        departmentId: form.departmentId || null,
        section: form.section.trim() || undefined,
        role: form.role,
      });
      setShowEditModal(false);
      onPromoteSuccess();
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center px-4 py-3 border-t border-[#2E2E2C] hover:bg-[#2C2C2A] min-w-[1000px]">
        <div className="w-[12%] text-[13px] text-[#ECECEA] truncate pr-2">{student.rollNo || '-'}</div>
        <div className="w-[14%] text-[13px] text-[#ECECEA] truncate pr-2">{student.name}</div>
        <div className="w-[18%] text-[13px] text-[#8C8C8A] truncate pr-2">{student.email}</div>
        <div className="w-[6%] text-[13px] text-[#8C8C8A]">{student.year}</div>
        <div className="w-[10%] text-[13px] text-[#8C8C8A]">{student.batchYear || '-'}</div>
        <div className="w-[8%] text-[13px] text-[#8C8C8A] truncate pr-2">{student.branch}</div>
        <div className="w-[12%] text-[13px] text-[#8C8C8A] truncate pr-2">{student.department}</div>
        <div className="w-[8%] text-[13px] text-[#8C8C8A]">{student.section || '-'}</div>
        <div className="w-[12%] flex justify-end items-center gap-2">
          <button
            onClick={() => { setShowEditModal(true); setEditError(''); }}
            title="Edit student"
            className="p-1.5 rounded border border-[#3A3A38] bg-[#1F1F1E] hover:bg-[#2C2C2A] transition-colors"
          >
            <Pencil size={13} className="text-[#8C8C8A]" />
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            title="Delete student"
            className="p-1.5 rounded border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={13} className="text-red-400" />
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          name={student.name}
          entityLabel="Student"
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => { onDelete(student.id); setShowDeleteModal(false); }}
        />
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-[#3A3A38] bg-[#1F1F1E] shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2C]">
              <h2 className="text-[14px] font-medium text-[#ECECEA]">Edit Student</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#5A5A58] hover:text-[#ECECEA] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Name</label>
                <input
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] placeholder:text-[#5A5A58]"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  type="email"
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] placeholder:text-[#5A5A58]"
                  placeholder="Email address"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Year</label>
                  <select
                    value={form.year}
                    onChange={e => handleChange('year', e.target.value)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                  >
                    <option value="">— Select —</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div className="w-28">
                  <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Section</label>
                  <input
                    value={form.section}
                    onChange={e => handleChange('section', e.target.value)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] placeholder:text-[#5A5A58]"
                    placeholder="e.g. A"
                    maxLength={5}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Branch</label>
                <select
                  value={form.branch}
                  onChange={e => handleChange('branch', e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                >
                  <option value="">— Select Branch —</option>
                  {BRANCH_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Department</label>
                <select
                  value={form.departmentId}
                  onChange={e => handleChange('departmentId', e.target.value)}
                  disabled={!form.branch}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] disabled:opacity-50"
                >
                  <option value="">— Select Department —</option>
                  {filteredDepartments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Role</label>
                <select
                  value={form.role}
                  onChange={e => handleChange('role', e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>

              {editError && (
                <p className="text-[12px] text-red-400">{editError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#2E2E2C]">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="text-[13px] text-[#8C8C8A] hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.email}
                className="bg-[#2C2C2A] border border-[#4A4A48] rounded-md px-5 py-2 text-[13px] text-[#ECECEA] hover:bg-[#333331] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
