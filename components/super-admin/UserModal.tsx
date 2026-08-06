import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/api';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: any; // If null, it's Add Mode
}

export function UserModal({ isOpen, onClose, onSuccess, userToEdit }: UserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [collegeId, setCollegeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [batchYear, setBatchYear] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [rollNo, setRollNo] = useState('');

  // Fetch colleges
  useEffect(() => {
    if (isOpen) {
      api.get('/api/superadmin/users/filters/colleges')
        .then(res => setColleges(Array.isArray(res.data) ? res.data : []))
        .catch(console.error);
    }
  }, [isOpen]);

  // Fetch departments when college changes
  useEffect(() => {
    if (collegeId) {
      api.get(`/api/superadmin/users/filters/departments?collegeId=${collegeId}`)
        .then(res => setDepartments(Array.isArray(res.data) ? res.data : []))
        .catch(console.error);
    } else {
      setDepartments([]);
    }
  }, [collegeId]);

  // Populate on edit
  useEffect(() => {
    if (userToEdit && isOpen) {
      setName(userToEdit.name || '');
      setEmail(userToEdit.email || '');
      setRole(userToEdit.role || 'student');
      setCollegeId(userToEdit.collegeId || '');
      setDepartmentId(userToEdit.departmentId || '');
      setBatchYear(userToEdit.batchYear || '');
      setYear(userToEdit.year?.toString() || '');
      setSection(userToEdit.section || '');
      setRollNo(userToEdit.rollNo || '');
    } else {
      // Reset
      setName('');
      setEmail('');
      setRole('student');
      setCollegeId('');
      setDepartmentId('');
      setBatchYear('');
      setYear('');
      setSection('');
      setRollNo('');
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        name,
        email,
        role,
        collegeId,
      };
      if (departmentId) payload.departmentId = departmentId;
      if (role === 'student') {
        if (year) payload.year = parseInt(year);
        if (batchYear) payload.batchYear = batchYear;
        if (section) payload.section = section;
        if (rollNo) payload.rollNo = rollNo;
      }

      if (userToEdit) {
        await api.put(`/api/superadmin/users/${userToEdit.id}`, payload);
      } else {
        await api.post('/api/superadmin/users', payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save user', error);
      alert('Failed to save user. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-[#2C2C2A] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#3A3A38] p-4">
          <h2 className="text-lg font-semibold text-[#ECECEA]">
            {userToEdit ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-[#8C8C8A] transition-colors hover:bg-[#3A3A38] hover:text-[#ECECEA]">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none">
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[12px] text-[#8C8C8A]">Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} type="text" className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-[#8C8C8A]">Email</label>
                <input required disabled={!!userToEdit} value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none disabled:opacity-50" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[12px] text-[#8C8C8A]">College</label>
                <select required value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none">
                  <option value="">Select College</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] text-[#8C8C8A]">Department (Optional)</label>
                <select disabled={!collegeId} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none disabled:opacity-50">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            {role === 'student' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] text-[#8C8C8A]">Roll No</label>
                  <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} type="text" className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] text-[#8C8C8A]">Batch Year</label>
                  <input value={batchYear} onChange={(e) => setBatchYear(e.target.value)} placeholder="e.g. 2020-2024" type="text" className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] text-[#8C8C8A]">Year</label>
                  <input value={year} onChange={(e) => setYear(e.target.value)} type="number" min="1" max="5" className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] text-[#8C8C8A]">Section</label>
                  <input value={section} onChange={(e) => setSection(e.target.value)} type="text" className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-md bg-[#3A3A38] px-4 py-2 text-[13px] font-medium text-[#ECECEA] transition-colors hover:bg-[#4A4A48]">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-md bg-[#ECECEA] px-4 py-2 text-[13px] font-medium text-[#1C1C1B] transition-colors hover:bg-white disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
