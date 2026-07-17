"use client";

import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { TokenUsageBar } from '@/components/dashboard/TokenUsageBar';
import { useAuth } from '@/context/AuthContext';

// Mock data fetching
async function getAdminStats() {
  return {
    studentCount: 1250,
    facultyCount: 84,
    subjectCount: 42,
    tokenUsage: 4500000,
    tokenLimit: 5000000,
    recentStudents: [
      { id: '1', name: 'John Doe', branch: 'CSE', year: '3rd Year', joined: '2 hours ago' },
      { id: '2', name: 'Jane Smith', branch: 'ECE', year: '2nd Year', joined: '5 hours ago' },
      { id: '3', name: 'Alice Johnson', branch: 'IT', year: '1st Year', joined: '1 day ago' },
      { id: '4', name: 'Bob Brown', branch: 'MECH', year: '4th Year', joined: '1 day ago' },
      { id: '5', name: 'Charlie Davis', branch: 'CSE', year: '2nd Year', joined: '2 days ago' },
    ],
    recentPapers: [
      { id: '1', subject: 'Data Structures', examType: 'CAT 1', assignedTo: 'CSE - 2nd Year' },
      { id: '2', subject: 'Machine Learning', examType: 'Model', assignedTo: 'CSE - 3rd Year' },
      { id: '3', subject: 'Circuit Theory', examType: 'CAT 2', assignedTo: 'ECE - 2nd Year' },
      { id: '4', subject: 'Engineering Physics', examType: 'CAT 1', assignedTo: 'All - 1st Year' },
      { id: '5', subject: 'Computer Networks', examType: 'University', assignedTo: 'IT - 3rd Year' },
    ]
  };
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getAdminStats().then(setData);
  }, []);

  const formatK = (num: number) => `${Math.floor(num / 1000)}k`;

  if (!data) return null;

  return (
    <div className="px-6 py-6 w-full">
      <div>
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Dashboard</h1>
        <p className="text-[12px] text-[#8C8C8A] mt-0.5">{user?.college?.name || "College Name"}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <StatCard value={data.studentCount} label="students" subtext="registered" />
        <StatCard value={data.facultyCount} label="faculty" subtext="active" />
        <StatCard value={data.subjectCount} label="subjects" subtext="uploaded" />
        <StatCard
          value={formatK(data.tokenUsage)}
          label={`of ${formatK(data.tokenLimit)} limit`}
          subtext="this month"
          valueColor={data.tokenUsage / data.tokenLimit > 0.9 ? 'text-red-400' : undefined}
        />
      </div>

      <div className="mt-4">
        <TokenUsageBar used={data.tokenUsage} limit={data.tokenLimit} showLabel />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-[14px] font-medium text-[#ECECEA] mb-3">Recent Students</h2>
          <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-lg overflow-hidden">
            {data.recentStudents.map((s: any) => (
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
          <h2 className="text-[14px] font-medium text-[#ECECEA] mb-3">Recent Papers</h2>
          <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-lg overflow-hidden">
            {data.recentPapers.map((p: any) => (
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
