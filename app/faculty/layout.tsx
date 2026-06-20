"use client";

import React from 'react';
import { Home, FileText } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

const facultyNavItems = [
  { href: '/faculty/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/faculty/papers', icon: FileText, label: 'Papers' },
];

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="faculty" navItems={facultyNavItems}>
      {children}
    </AppShell>
  );
}
