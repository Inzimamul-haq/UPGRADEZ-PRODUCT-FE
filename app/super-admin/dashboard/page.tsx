"use client";

import React, { useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { CollegeCard } from '@/components/admin/CollegeCard';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const initialColleges: any[] = [
  { id: '1', name: 'Anna University', status: 'active', studentsCount: 1250, tokenUsed: 4500000, tokenLimit: 5000000, expiresAt: '2024-12-31', startDate: '2023-01-01' },
  { id: '2', name: 'SRM Institute', status: 'suspended', studentsCount: 3000, tokenUsed: 2000000, tokenLimit: 2000000, expiresAt: '2023-11-15', startDate: '2022-11-15' },
  { id: '3', name: 'VIT Chennai', status: 'active', studentsCount: 2100, tokenUsed: 4800000, tokenLimit: 5000000, expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], startDate: '2023-05-01' },
];

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [colleges] = useState(initialColleges);

  const activeCount = colleges.filter(c => c.status === 'active').length;
  const suspendedCount = colleges.filter(c => c.status === 'suspended').length;
  const totalTokens = colleges.reduce((sum, c) => sum + c.tokenUsed, 0);
  const planPrice = 10000; // Mock price per active college

  const formatK = (num: number) => `${Math.floor(num / 1000)}k`;

  // Sort order: suspended first -> expiring soon -> active alphabetical
  const sortedColleges = [...colleges].sort((a, b) => {
    if (a.status === 'suspended' && b.status !== 'suspended') return -1;
    if (b.status === 'suspended' && a.status !== 'suspended') return 1;
    
    const aExpiringSoon = new Date(a.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;
    const bExpiringSoon = new Date(b.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;
    
    if (aExpiringSoon && !bExpiringSoon) return -1;
    if (bExpiringSoon && !aExpiringSoon) return 1;

    return a.name.localeCompare(b.name);
  });

  return (
    <div className="px-6 py-6 w-full max-w-6xl mx-auto">
      <div>
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Overview</h1>
        <p className="text-[12px] text-[#8C8C8A] mt-0.5">Super Admin</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <StatCard value={activeCount} label="active colleges" subtext={`of ${colleges.length} total`} />
        <StatCard value={suspendedCount} label="suspended" valueColor={suspendedCount > 0 ? 'text-red-400' : undefined} />
        <StatCard value={formatK(totalTokens)} label="tokens used this month" />
        <StatCard value={`₹${activeCount * planPrice}`} label="monthly revenue" subtext="recurring" />
      </div>

      <div className="mt-6 bg-[#2C2C2A] border border-[#3A3A38] rounded-lg p-4">
        <h2 className="text-[12px] text-[#8C8C8A] mb-3 uppercase tracking-wider font-medium">Needs Attention</h2>
        <div className="flex flex-col">
          <div className="flex items-center justify-between py-2 border-b border-[#2E2E2C]">
            <div className="flex items-center gap-2.5 text-[13px] text-[#ECECEA]">
              <AlertTriangle size={14} className="text-yellow-500" />
              <span>Anna University token usage at 90%</span>
            </div>
            <button onClick={() => router.push('/super-admin/subscriptions')} className="text-[12px] text-[#8C8C8A] hover:text-[#ECECEA]">Manage &rarr;</button>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#2E2E2C]">
            <div className="flex items-center gap-2.5 text-[13px] text-[#ECECEA]">
              <Clock size={14} className="text-red-400" />
              <span>VIT Chennai subscription expires in 5 days</span>
            </div>
            <button onClick={() => router.push('/super-admin/subscriptions')} className="text-[12px] text-[#8C8C8A] hover:text-[#ECECEA]">Manage &rarr;</button>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#2E2E2C] last:border-0">
            <div className="flex items-center gap-2.5 text-[13px] text-[#ECECEA]">
              <XCircle size={14} className="text-red-400" />
              <span>SRM Institute is currently suspended</span>
            </div>
            <button onClick={() => router.push('/super-admin/subscriptions')} className="text-[12px] text-[#8C8C8A] hover:text-[#ECECEA]">Manage &rarr;</button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-[14px] font-medium text-[#ECECEA] mb-4">Colleges</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[900px] mb-2 flex px-4 text-[11px] text-[#5A5A58] uppercase tracking-wider">
            <div className="w-[20%]">College</div>
            <div className="w-[15%]">Status</div>
            <div className="w-[10%]">Students</div>
            <div className="w-[25%]">Token Usage</div>
            <div className="w-[20%]">Expires</div>
            <div className="w-[10%] text-right">Action</div>
          </div>
          <div className="flex flex-col gap-2">
            {sortedColleges.map(c => (
              <CollegeCard key={c.id} college={c} onManage={() => router.push('/super-admin/subscriptions')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
