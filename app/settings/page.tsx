"use client";

import React from 'react';
import { Home, BookOpen } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

const studentNavItems = [
  { href: '/student/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/student/questions', icon: BookOpen, label: 'Questions' },
];

export default function SettingsPage() {
  return (
    <AppShell role="student" navItems={studentNavItems}>
      <div className="max-w-3xl mx-auto px-6 py-8 w-full">
        <h1 className="text-[20px] font-medium text-[#ECECEA] mb-6">Settings</h1>

        <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-xl p-6 mb-4">
          <h2 className="text-[14px] font-medium text-[#ECECEA] mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] text-[#8C8C8A] mb-1.5">Name</label>
              <input
                type="text"
                defaultValue="Alex Johnson"
                className="w-full bg-[#1C1C1B] border border-[#3A3A38] rounded-md px-3 py-2 text-[14px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[#8C8C8A] mb-1.5">Email</label>
              <input
                type="email"
                defaultValue="alex@example.com"
                className="w-full bg-[#1C1C1B] border border-[#3A3A38] rounded-md px-3 py-2 text-[14px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
              />
            </div>
            <button className="bg-[#ECECEA] text-[#1C1C1B] font-medium text-[13px] px-4 py-2 rounded-md hover:bg-white transition-colors mt-2">
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-xl p-6">
          <h2 className="text-[14px] font-medium text-[#ECECEA] mb-1">Danger Zone</h2>
          <p className="text-[12px] text-[#8C8C8A] mb-4">These actions are irreversible.</p>
          <button className="text-red-400 border border-red-400/30 text-[13px] px-4 py-2 rounded-md hover:bg-red-400/10 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </AppShell>
  );
}
