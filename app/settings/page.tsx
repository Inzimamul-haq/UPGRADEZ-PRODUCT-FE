"use client";

import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Users, GraduationCap, FileText, HelpCircle, CreditCard, Building2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { settingsNameSchema } from '@/Schema/validations';

const NAV_BY_ROLE: Record<string, { href: string; icon: any; label: string }[]> = {
  student: [
    { href: '/student/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/student/questions', icon: BookOpen, label: 'Questions' },
  ],
  faculty: [
    { href: '/faculty/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/faculty/papers', icon: FileText, label: 'My Papers' },
    { href: '/faculty/questions', icon: BookOpen, label: 'Questions' },
  ],
  admin: [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/students', icon: Users, label: 'Students' },
    { href: '/admin/faculty', icon: GraduationCap, label: 'Faculty' },
    { href: '/admin/departments', icon: Building2, label: 'Departments' },
    { href: '/admin/syllabus', icon: BookOpen, label: 'Syllabus' },
    { href: '/admin/papers', icon: FileText, label: 'Papers' },
    { href: '/admin/questions', icon: HelpCircle, label: 'Questions' },
  ],
  super_admin: [
    { href: '/super-admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/super-admin/students', icon: Users, label: 'Students' },
    { href: '/super-admin/faculty', icon: GraduationCap, label: 'Faculty' },
    { href: '/super-admin/departments', icon: Building2, label: 'Departments' },
    { href: '/super-admin/syllabus', icon: BookOpen, label: 'Syllabus' },
    { href: '/super-admin/papers', icon: FileText, label: 'Papers' },
    { href: '/super-admin/questions', icon: HelpCircle, label: 'Questions' },
    { href: '/super-admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  ],
};

export default function SettingsPage() {
  const { user, setUser, logout, role } = useAuth();
  const navItems = NAV_BY_ROLE[role ?? 'student'] ?? NAV_BY_ROLE.student;

  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync name from user once auth loads
  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const handleSave = async () => {
    setIsSaving(true);

    const parsed = settingsNameSchema.safeParse({ name });
    if (!parsed.success) {
      alert(parsed.error.issues[0].message);
      setIsSaving(false);
      return;
    }

    try {
      await api.put('/api/auth/me', { name });
      if (user) setUser({ ...user, name });
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError('');
    setIsDeleting(true);
    try {
      await api.delete('/api/auth/me', { data: { password: deletePassword } });
      await logout();
    } catch (error: any) {
      setDeleteError(error.response?.data?.error || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <AppShell role={role ?? 'student'} navItems={navItems}>
      <div className="max-w-3xl mx-auto px-6 py-8 w-full relative">
        <div>
          <h1 className="text-[20px] font-medium text-[#ECECEA]">Settings</h1>
          {user?.college && (
            <p className="text-[13px] text-[#8C8C8A] mt-1 mb-6">
              {user.college.shortName || user.college.name}
            </p>
          )}
          {!user?.college && <div className="mb-6" />}
        </div>

        <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-xl p-6 mb-4">
          <h2 className="text-[14px] font-medium text-[#ECECEA] mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] text-[#8C8C8A] mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#1C1C1B] border border-[#3A3A38] rounded-md px-3 py-2 text-[14px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[#8C8C8A] mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-[#1C1C1B] border border-[#3A3A38] rounded-md px-3 py-2 text-[14px] text-[#8C8C8A] cursor-not-allowed"
              />
            </div>
            <button disabled={isSaving} onClick={handleSave} className="bg-[#ECECEA] text-[#1C1C1B] font-medium text-[13px] px-4 py-2 rounded-md hover:bg-white transition-colors mt-2 disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-xl p-6">
          <h2 className="text-[14px] font-medium text-[#ECECEA] mb-1">Danger Zone</h2>
          <p className="text-[12px] text-[#8C8C8A] mb-4">These actions are irreversible.</p>
          <button onClick={() => setShowDeleteModal(true)} className="text-red-400 border border-red-400/30 text-[13px] px-4 py-2 rounded-md hover:bg-red-400/10 transition-colors">
            Delete Account
          </button>
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
            <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl p-6 w-[340px] shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
              <p className="text-[16px] font-medium text-[#ECECEA] mb-1">Delete Account?</p>
              <p className="text-[13px] text-[#8C8C8A] mb-4 leading-relaxed">
                This action is permanent and cannot be undone. Please enter your password to confirm.
              </p>
              {deleteError && <p className="text-red-500 text-xs mb-3">{deleteError}</p>}
              <input
                type="password"
                placeholder="Enter password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="w-full bg-[#1C1C1B] border border-[#3A3A38] rounded-md px-3 py-2 text-[14px] text-[#ECECEA] focus:outline-none focus:border-red-500 mb-6"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 border border-[#3A3A38] rounded-xl py-2.5 text-[13px] text-[#8C8C8A] hover:bg-[#333331] transition-colors">Cancel</button>
                <button disabled={isDeleting || !deletePassword} onClick={handleDelete} className="flex-1 bg-red-500 rounded-xl py-2.5 text-[13px] font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50">Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
