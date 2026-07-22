"use client";

import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { TokenUsageChart } from '@/components/dashboard/analytics/TokenUsageChart';
import { RequestTrendChart } from '@/components/dashboard/analytics/RequestTrendChart';
import { QuotaStatusDonut } from '@/components/dashboard/analytics/QuotaStatusDonut';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { Notification } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface AdminStats {
  studentsRegistered: { count: number };
  facultyAndAdmin: { count: number };
  subjects: { count: number };
  tokenUsage: { used: number; limit: number; month: string };
}



export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, notifRes] = await Promise.all([
          api.get('/api/admin/dashboard/stats'),
          api.get('/api/notifications')
        ]);
        setData(statsRes.data.data);
        setNotifications(notifRes.data.data);
      } catch (err) {
        console.error('Failed to fetch admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="col-span-1 lg:col-span-2">
           <TokenUsageChart />
        </div>
        <div className="col-span-1">
           <QuotaStatusDonut />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="col-span-1">
           <RequestTrendChart />
        </div>
        <div className="col-span-1 flex flex-col h-[300px]">
          <div className="bg-[#242422] border border-[#2E2E2C] rounded-xl flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 mb-2">
              <h2 className="text-[14px] font-medium text-[#ECECEA]">Recent Activity</h2>
            </div>
            <div className="overflow-y-auto flex-1">
              <p className="text-[10px] uppercase tracking-widest text-[#5A5A58] px-5 pt-1 pb-1">Recent</p>
              <ActivityFeed notifications={notifications} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
