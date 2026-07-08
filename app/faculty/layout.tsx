"use client";

import React from 'react';
import { Home, FileText, BookOpen, HelpCircle, } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

const facultyNavItems = [
  { href: '/faculty/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/faculty/papers', icon: FileText, label: 'My Papers' },
    { href: '/faculty/questions', icon: HelpCircle, label: 'Questions' },
  { href: '/faculty/syllabus', icon: BookOpen, label: 'Syllabus' },
];

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="faculty" navItems={facultyNavItems}>
      {children}
    </AppShell>
  );
}
