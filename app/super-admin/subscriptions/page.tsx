"use client";

import React, { useState } from 'react';
import { CollegeCard } from '@/components/admin/CollegeCard';

const initialColleges: any[] = [
  { id: '1', name: 'Anna University', status: 'active', studentsCount: 1250, tokenUsed: 4500000, tokenLimit: 5000000, expiresAt: '2024-12-31', startDate: '2023-01-01' },
  { id: '2', name: 'SRM Institute', status: 'suspended', studentsCount: 3000, tokenUsed: 2000000, tokenLimit: 2000000, expiresAt: '2023-11-15', startDate: '2022-11-15' },
  { id: '3', name: 'VIT Chennai', status: 'active', studentsCount: 2100, tokenUsed: 4800000, tokenLimit: 5000000, expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], startDate: '2023-05-01' },
];

export default function SuperAdminSubscriptionsPage() {
  const [colleges, setColleges] = useState(initialColleges);

  const handleUpdateLimit = (id: string, limit: number) => {
    setColleges(colleges.map(c => c.id === id ? { ...c, tokenLimit: limit } : c));
  };

  const handleUpdateExpiry = (id: string, date: string) => {
    if (!date) return;
    setColleges(colleges.map(c => c.id === id ? { ...c, expiresAt: date } : c));
  };

  const handleSuspend = (id: string) => {
    setColleges(colleges.map(c => c.id === id ? { ...c, status: 'suspended' } : c));
  };

  const handleReactivate = (id: string) => {
    setColleges(colleges.map(c => c.id === id ? { ...c, status: 'active' } : c));
  };

  return (
    <div className="px-6 py-6 w-full max-w-6xl mx-auto">
      <h1 className="text-[16px] font-medium text-[#ECECEA] mb-6">Subscriptions</h1>

      <div className="overflow-x-auto">
        <div className="min-w-[900px] mb-2 flex px-4 text-[11px] text-[#5A5A58] uppercase tracking-wider">
          <div className="w-[20%]">College</div>
          <div className="w-[15%]">Status</div>
          <div className="w-[10%]">Students</div>
          <div className="w-[25%]">Token Usage</div>
          <div className="w-[20%]">Expires</div>
          <div className="w-[10%] text-right">Action</div>
        </div>
        <div className="flex flex-col gap-3">
          {colleges.map(c => (
            <CollegeCard 
              key={c.id} 
              college={c} 
              isExpandedVariant={true}
              onUpdateLimit={handleUpdateLimit}
              onUpdateExpiry={handleUpdateExpiry}
              onSuspend={handleSuspend}
              onReactivate={handleReactivate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
