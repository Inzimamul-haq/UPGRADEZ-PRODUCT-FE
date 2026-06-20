"use client";

import React from 'react';
import { Home, Users, GraduationCap, BookOpen } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

const adminNavItems = [
  { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/admin/students', icon: Users, label: 'Students' },
  { href: '/admin/faculty', icon: GraduationCap, label: 'Faculty' },
  { href: '/admin/syllabus', icon: BookOpen, label: 'Syllabus' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="admin" navItems={adminNavItems}>
      {children}
    </AppShell>
  );
}
