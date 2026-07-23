"use client";

import React from 'react';
import { Home, BookOpen, MessageSquare } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ActiveBroadcastBanner } from '@/components/broadcast/ActiveBroadcastBanner';

const studentNavItems = [
  { href: '/student/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/student/questions', icon: BookOpen, label: 'Questions' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="student" navItems={studentNavItems}>
      <ActiveBroadcastBanner />
      {children}
    </AppShell>
  );
}
