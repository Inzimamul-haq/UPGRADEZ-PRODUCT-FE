"use client";

import React from 'react';
import { Home, FileText, BookOpen, HelpCircle, Info } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ActiveBroadcastBanner } from '@/components/broadcast/ActiveBroadcastBanner';

const facultyNavItems = [
  { href: '/faculty/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/faculty/papers', icon: FileText, label: 'My Papers' },
  { href: '/faculty/questions', icon: HelpCircle, label: 'Questions' },
  { href: '/faculty/syllabus', icon: BookOpen, label: 'Syllabus' },
  { href: '/faculty/rules', icon: Info, label: 'Rules' },
];

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="faculty" navItems={facultyNavItems}>
      <ActiveBroadcastBanner />
      {children}
    </AppShell>
  );
}
