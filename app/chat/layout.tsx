"use client";

import React from 'react';
import { Home, BookOpen, FileText } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/AuthContext';

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
    { href: '/admin/questions', icon: BookOpen, label: 'Questions' },
  ],
  super_admin: [
    { href: '/super-admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/super-admin/questions', icon: BookOpen, label: 'Questions' },
  ],
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const navItems = NAV_BY_ROLE[role ?? 'student'] ?? NAV_BY_ROLE.student;

  return (
    <AppShell role={role ?? 'student'} navItems={navItems}>
      {children}
    </AppShell>
  );
}
