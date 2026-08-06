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

export const SharedAdminDashboard = ({ collegeId, collegeName }: { collegeId?: string; collegeName?: string }) => {
  const { user } = useAuth();
  const [data, setData] = useState<AdminStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const statsEndpoint = collegeId 
          ? `/api/super-admin/colleges/${collegeId}/dashboard/stats`
          : '/api/admin/dashboard/stats';
        
        try {
          const statsRes = await api.get(statsEndpoint);
          setData(statsRes.data.data);
        } catch (err) {
          console.error('Failed to fetch admin dashboard stats:', err);
        }

        try {
          // If collegeId is present, we might want to fetch notifications scoped to that college.
          // For now, we just gracefully handle it if it fails (e.g. 401 for super_admin without collegeId).
          const notifEndpoint = collegeId ? `/api/notifications?collegeId=${collegeId}` : '/api/notifications';
          const notifRes = await api.get(notifEndpoint);
          setNotifications(notifRes.data.data);
        } catch (err) {
          console.error('Failed to fetch notifications:', err);
          setNotifications([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [collegeId]);

  const formatK = (num: number) => `${Math.floor(num / 1000)}k`;
  const displayName = collegeName || user?.college?.name || "College Name";

  return (
    <div className="px-6 py-6 w-full">
      <div>
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Dashboard</h1>
        <p className="text-[12px] text-[#8C8C8A] mt-0.5">{displayName}</p>
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
           <TokenUsageChart collegeId={collegeId} />
        </div>
        <div className="col-span-1">
           <QuotaStatusDonut collegeId={collegeId} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="col-span-1">
           <RequestTrendChart collegeId={collegeId} />
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
};
