"use client";

import React from 'react';
import { Home, BookOpen, FileText, Users, GraduationCap, HelpCircle, CreditCard, Building2, Info } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';
import { NotificationPrompt } from '@/components/ui/NotificationPrompt';
import { UnauthorizedError } from '@/components/ui/UnauthorizedError';

const NAV_BY_ROLE: Record<string, { href: string; icon: any; label: string }[]> = {
  student: [
    { href: '/student/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/student/questions', icon: BookOpen, label: 'Questions' },
  ],
  faculty: [
    { href: '/faculty/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/faculty/papers', icon: FileText, label: 'My Papers' },
    { href: '/faculty/questions', icon: HelpCircle, label: 'Questions' },
    { href: '/faculty/syllabus', icon: BookOpen, label: 'Syllabus' },
    { href: '/faculty/rules', icon: Info, label: 'Rules' },
  ],
  admin: [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/students', icon: Users, label: 'Students' },
    { href: '/admin/faculty', icon: GraduationCap, label: 'Faculty' },
    { href: '/admin/departments', icon: Building2, label: 'Departments' },
    { href: '/admin/syllabus', icon: BookOpen, label: 'Syllabus' },
    { href: '/admin/papers', icon: FileText, label: 'Papers' },
    { href: '/admin/questions', icon: HelpCircle, label: 'Questions' },
    { href: '/admin/rules', icon: Info, label: 'Rules' },
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
  'super-admin': [
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

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const navItems = NAV_BY_ROLE[role ?? 'student'] ?? NAV_BY_ROLE.student;

  if (loading) {
    return (
      <AppShell role={role ?? 'student'} navItems={navItems}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden items-center justify-center">
          <div className="text-[#8C8C8A]">Loading...</div>
        </div>
      </AppShell>
    );
  }

  if (role === 'student') {
    return (
      <AppShell role={role} navItems={navItems}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <UnauthorizedError />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role={role ?? 'student'} navItems={navItems}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
      <NotificationPrompt />
    </AppShell>
  );
}
