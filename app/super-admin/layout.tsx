"use client";

import React from 'react';
import { Home, Users, GraduationCap, BookOpen, CreditCard } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

const superAdminNavItems = [
  { href: '/super-admin/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/super-admin/students', icon: Users, label: 'Students' },
  { href: '/super-admin/faculty', icon: GraduationCap, label: 'Faculty' },
  { href: '/super-admin/syllabus', icon: BookOpen, label: 'Syllabus' },
  { href: '/super-admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="super_admin" navItems={superAdminNavItems}>
      {children}
    </AppShell>
  );
}
