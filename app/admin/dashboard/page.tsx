"use client";

import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { TokenUsageBar } from '@/components/dashboard/TokenUsageBar';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface AdminStats {
  studentsRegistered: { count: number };
  facultyAndAdmin: { count: number };
  subjects: { count: number };
  tokenUsage: { used: number; limit: number; month: string };
}

// Mock recent data until respective APIs are built
const recentStudentsMock = [
  { id: '1', name: 'John Doe', branch: 'CSE', year: '3rd Year', joined: '2 hours ago' },
  { id: '2', name: 'Jane Smith', branch: 'ECE', year: '2nd Year', joined: '5 hours ago' },
  { id: '3', name: 'Alice Johnson', branch: 'IT', year: '1st Year', joined: '1 day ago' },
  { id: '4', name: 'Bob Brown', branch: 'MECH', year: '4th Year', joined: '1 day ago' },
  { id: '5', name: 'Charlie Davis', branch: 'CSE', year: '2nd Year', joined: '2 days ago' },
];

const recentPapersMock = [
  { id: '1', subject: 'Data Structures', examType: 'CAT 1', assignedTo: 'CSE - 2nd Year' },
  { id: '2', subject: 'Machine Learning', examType: 'Model', assignedTo: 'CSE - 3rd Year' },
  { id: '3', subject: 'Circuit Theory', examType: 'CAT 2', assignedTo: 'ECE - 2nd Year' },
  { id: '4', subject: 'Engineering Physics', examType: 'CAT 1', assignedTo: 'All - 1st Year' },
  { id: '5', subject: 'Computer Networks', examType: 'University', assignedTo: 'IT - 3rd Year' },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get('/api/admin/dashboard/stats');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  const formatK = (num: number) => `${Math.floor(num / 1000)}k`;

  return (
    <div className="px-6 py-6 w-full">
      <div>
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Dashboard</h1>
        <p className="text-[12px] text-[#8C8C8A] mt-0.5">{user?.college?.name || "College Name"}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {loading ? (
          <>
            <div className="animate-pulse bg-[#2C2C2A] h-24 rounded-xl"></div>
            <div className="animate-pulse bg-[#2C2C2A] h-24 rounded-xl"></div>
            <div className="animate-pulse bg-[#2C2C2A] h-24 rounded-xl"></div>
            <div className="animate-pulse bg-[#2C2C2A] h-24 rounded-xl"></div>
          </>
        ) : data ? (
          <>
            <StatCard value={data.studentsRegistered.count.toString()} label="students" subtext="registered" />
            <StatCard value={data.facultyAndAdmin.count.toString()} label="faculty" subtext="active" />
            <StatCard value={data.subjects.count.toString()} label="subjects" subtext="uploaded" />
            <StatCard
              value={formatK(data.tokenUsage.used)}
              label={`of ${formatK(data.tokenUsage.limit)} limit`}
              subtext="this month"
              valueColor={data.tokenUsage.used / data.tokenUsage.limit > 0.9 ? 'text-red-400' : undefined}
            />
          </>
        ) : (
          <div className="col-span-full text-[#8C8C8A] text-[13px] py-4">Failed to load stats.</div>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="animate-pulse bg-[#2C2C2A] h-12 rounded-lg"></div>
        ) : data ? (
          <TokenUsageBar used={data.tokenUsage.used} limit={data.tokenUsage.limit} showLabel />
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 pointer-events-none">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-medium text-[#ECECEA]">Recent Students</h2>
            <span className="text-[11px] text-[#8C8C8A] bg-[#2C2C2A] px-2 py-0.5 rounded-full">Coming Soon</span>
          </div>
          <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-lg overflow-hidden">
            {recentStudentsMock.map((s: any) => (
              <div key={s.id} className="flex justify-between items-center px-4 py-3 border-b border-[#2E2E2C] last:border-0 hover:bg-[#333331] transition-colors">
                <div>
                  <p className="text-[13px] text-[#ECECEA]">{s.name}</p>
                  <p className="text-[11px] text-[#8C8C8A]">{s.branch} · {s.year}</p>
                </div>
                <span className="text-[11px] text-[#5A5A58]">{s.joined}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-medium text-[#ECECEA]">Recent Papers</h2>
            <span className="text-[11px] text-[#8C8C8A] bg-[#2C2C2A] px-2 py-0.5 rounded-full">Coming Soon</span>
          </div>
          <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-lg overflow-hidden">
            {recentPapersMock.map((p: any) => (
              <div key={p.id} className="px-4 py-3 border-b border-[#2E2E2C] last:border-0 hover:bg-[#333331] transition-colors">
                <div className="flex justify-between items-start mb-0.5">
                  <p className="text-[13px] text-[#ECECEA]">{p.subject}</p>
                  <span className="text-[11px] text-[#8C8C8A] border border-[#3A3A38] rounded px-1.5 py-0.5">{p.examType}</span>
                </div>
                <p className="text-[11px] text-[#8C8C8A]">Assigned to: {p.assignedTo}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
