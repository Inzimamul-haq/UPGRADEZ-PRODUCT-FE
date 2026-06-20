"use client";

import React from 'react';
import { Home, BookOpen, MessageSquare } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

const chatNavItems = [
  { href: '/student/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/student/questions', icon: BookOpen, label: 'Questions' },
];

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  // Using student nav for chat layout since this is the student section requested
  return (
    <AppShell role="student" navItems={chatNavItems}>
      {children}
    </AppShell>
  );
}
