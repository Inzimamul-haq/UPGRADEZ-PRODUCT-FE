"use client";

import React from 'react';
import { Home, Building2, Palette, Users, Activity, Megaphone, ClipboardList } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

const superAdminNavItems = [
  { href: '/super-admin/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/super-admin/colleges', icon: Building2, label: 'Colleges' },
  { href: '/super-admin/users', icon: Users, label: 'Users' },
  { href: '/super-admin/health', icon: Activity, label: 'System Health' },
  { href: '/super-admin/broadcast', icon: Megaphone, label: 'Broadcast' },
  // { href: '/super-admin/export', icon: Download, label: 'Data Export' },
  { href: '/super-admin/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
  { href: '/super-admin/themes', icon: Palette, label: 'Themes' },

];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="super_admin" navItems={superAdminNavItems}>
      {children}
    </AppShell>
  );
}
