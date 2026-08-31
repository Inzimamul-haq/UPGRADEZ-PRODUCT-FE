"use client";

import React from 'react';
import { Home, Users, GraduationCap, BookOpen, FileText, HelpCircle, Building2, Info } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ActiveBroadcastBanner } from '@/components/broadcast/ActiveBroadcastBanner';

const adminNavItems = [
  { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/admin/students', icon: Users, label: 'Students' },
  { href: '/admin/faculty', icon: GraduationCap, label: 'Faculty' },
  { href: '/admin/departments', icon: Building2, label: 'Departments' },
  { href: '/admin/syllabus', icon: BookOpen, label: 'Syllabus' },
  { href: '/admin/papers', icon: FileText, label: 'Papers' },
  { href: '/admin/questions', icon: HelpCircle, label: 'Questions' },
  { href: '/admin/rules', icon: Info, label: 'Rules' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="admin" navItems={adminNavItems}>
      <ActiveBroadcastBanner />
      {children}
    </AppShell>
  );
}
