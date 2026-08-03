"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/api';
import { BRANCH_OPTIONS } from '@/lib/constants';
import { DepartmentOption } from '@/lib/types';
import { useToast } from '@/context/ToastContext';

interface AddProfileModalProps {
  onClose: () => void;
  onSuccess: () => void;
  defaultRole: 'student' | 'faculty' | 'admin';
}

export function AddProfileModal({ onClose, onSuccess, defaultRole }: AddProfileModalProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: defaultRole,
    year: '',
    branch: '',
    departmentId: '',
    section: '',
    rollNo: '',
    batchYear: '',
    regulation: '',
  });

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const { data } = await api.get<{ departments: DepartmentOption[] }>('/api/departments');
        setDepartments(data.departments ?? []);
      } catch {
        setError('Failed to load departments');
      }
    };
    loadDepartments();
  }, []);

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
    setError('');
    try {
      await api.post('/api/profiles', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password || undefined,
        role: form.role,
        year: form.year ? parseInt(form.year, 10) : undefined,
        departmentId: form.departmentId || null,
        section: form.section.trim() || undefined,
        rollNo: form.rollNo.trim() || undefined,
        batchYear: form.batchYear.trim() || undefined,
        regulation: form.regulation.trim() || undefined,
      });
      toast.success(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} added successfully`);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="w-full max-w-md rounded-lg border border-[#3A3A38] bg-[#1F1F1E] shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2C]">
          <h2 className="text-[14px] font-medium text-[#ECECEA]">
            Add {defaultRole === 'student' ? 'Student' : defaultRole === 'faculty' ? 'Faculty' : 'Admin'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#5A5A58] hover:text-[#ECECEA] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Name *</label>
            <input
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] placeholder:text-[#5A5A58]"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Email *</label>
            <input
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              type="email"
              className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] placeholder:text-[#5A5A58]"
              placeholder="Email address"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Password (Optional)</label>
            <input
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              type="password"
              className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] placeholder:text-[#5A5A58]"
              placeholder="Set initial password (min 6 chars)"
            />
            <p className="text-[#5A5A58] text-[10px] mt-1">If blank, user must sign in with Google or reset password.</p>
          </div>

          <div>
            <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Role</label>
            <select
              value={form.role}
              onChange={e => handleChange('role', e.target.value)}
              className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {(form.role === 'student' || form.role === 'faculty') && (
            <>
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
            </>
          )}

          {form.role === 'student' && (
            <>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Roll Number</label>
                  <input
                    value={form.rollNo}
                    onChange={e => handleChange('rollNo', e.target.value)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] placeholder:text-[#5A5A58]"
                    placeholder="e.g. 21CS01"
                  />
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
                    <option value="5">5th Year</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Batch Year</label>
                  <input
                    value={form.batchYear}
                    onChange={e => handleChange('batchYear', e.target.value)}
                    className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] placeholder:text-[#5A5A58]"
                    placeholder="e.g. 2021-2025"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#8C8C8A] mb-1.5 uppercase tracking-wide">Regulation</label>
                <input
                  value={form.regulation}
                  onChange={e => handleChange('regulation', e.target.value)}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] placeholder:text-[#5A5A58]"
                  placeholder="e.g. R2021"
                />
              </div>
            </>
          )}

          {/* {error && (
            <p className="text-[12px] text-red-400">{error}</p>
          )} */}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#2E2E2C]">
          <button
            onClick={onClose}
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
            {saving ? 'Adding...' : 'Add Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
