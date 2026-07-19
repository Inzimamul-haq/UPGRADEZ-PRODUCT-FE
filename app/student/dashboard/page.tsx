"use client";

import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { Notification } from '@/lib/types';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
  degreeCompletion: {
    percent: number;
    currentYear: number;
    totalYears: number;
  };
  subjectsEnrolled: number;
  aiConversations: number;
  newPapers: number;
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/student/dashboard/stats');
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const notifications: Notification[] = [
    { id: '1', type: 'new_paper', message: 'New Model Paper added for Data Structures', read_at: null, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', type: 'syllabus_update', message: 'Syllabus updated for Operating Systems', read_at: null, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', type: 'study_recap', message: 'You practiced 15 questions in Computer Networks yesterday. Keep it up!', read_at: null, created_at: new Date(Date.now() - 172800000).toISOString() },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 w-full pt-14 md:pt-6">
      <div>
        <h1 className="text-[18px] font-medium text-[#ECECEA]">Good morning{user ? `, ${user.name.split(' ')[0]}` : ''}</h1>
        <p className="text-[12px] text-[#8C8C8A] mt-0.5">{today}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading ? (
          <>
            <div className="animate-pulse bg-[#2C2C2A] h-24 rounded-xl"></div>
            <div className="animate-pulse bg-[#2C2C2A] h-24 rounded-xl"></div>
            <div className="animate-pulse bg-[#2C2C2A] h-24 rounded-xl"></div>
            <div className="animate-pulse bg-[#2C2C2A] h-24 rounded-xl"></div>
          </>
        ) : stats ? (
          <>
            <StatCard 
              value={`${Math.round(stats.degreeCompletion.percent)}%`} 
              label="Degree completion" 
              subtext={`Year ${stats.degreeCompletion.currentYear} of ${stats.degreeCompletion.totalYears}`}
            />
            <StatCard 
              value={stats.subjectsEnrolled.toString()} 
              label="Subjects enrolled" 
            />
            <StatCard 
              value={stats.aiConversations.toString()} 
              label="AI conversations" 
            />
            <StatCard 
              value={stats.newPapers.toString()} 
              label="New papers" 
              valueColor={stats.newPapers > 0 ? "text-amber-400" : undefined}
              subtext="This week"
            />
          </>
        ) : (
          <div className="col-span-full text-[#8C8C8A] text-[13px] py-4">Failed to load stats.</div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-[#ECECEA]">Recent Activity</h2>
          <span className="text-[11px] text-[#8C8C8A] bg-[#2C2C2A] px-2 py-0.5 rounded-full">Coming Soon</span>
        </div>
        <div className="bg-[#242422] border border-[#2E2E2C] rounded-xl overflow-hidden opacity-50 pointer-events-none">
          <p className="text-[10px] uppercase tracking-widest text-[#5A5A58] px-4 pt-3 pb-1">Recent</p>
          <ActivityFeed notifications={notifications} />
        </div>
      </div>
    </div>
  );
}
