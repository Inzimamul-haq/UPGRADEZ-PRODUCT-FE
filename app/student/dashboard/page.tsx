"use client";

import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { Notification, StudentDashboardStats as DashboardStats } from '@/lib/types';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import OnboardingPage from '@/app/onboarding/page';
import { isStudentProfileReadyForSubjects } from '@/lib/profile';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, notifRes] = await Promise.all([
          api.get('/api/student/dashboard/stats'),
          api.get('/api/notifications')
        ]);
        setStats(statsRes.data.data);
        setNotifications(notifRes.data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (user && !isStudentProfileReadyForSubjects(user as any)) {
    return <OnboardingPage />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full pt-14 md:pt-6">
      {/* Header Section */}
      <div className="space-y-0.5">
        <h1 className="text-[16px] sm:text-[18px] font-medium text-[#ECECEA] truncate">
          Good morning{user ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-[11px] sm:text-[12px] text-[#8C8C8A]">
          {today}
        </p>
      </div>

      {/* Stats Grid - Responsive */}
   <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
  {loading ? (
    <>
      <div className="animate-pulse bg-[#2C2C2A] h-[88px] sm:h-24 rounded-xl"></div>
      <div className="animate-pulse bg-[#2C2C2A] h-[88px] sm:h-24 rounded-xl"></div>
      <div className="animate-pulse bg-[#2C2C2A] h-[88px] sm:h-24 rounded-xl"></div>
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

      {/* <StatCard
        value={stats.aiConversations.toString()}
        label="AI conversations"
      /> */}

      <StatCard
        value={stats.newPapers.toString()}
        label="New papers"
        valueColor={stats.newPapers > 0 ? "text-amber-400" : undefined}
        subtext="This week"
      />
    </>
  ) : (
    <div className="col-span-full text-[#8C8C8A] text-[13px] py-4 text-center">
      Failed to load stats.
    </div>
  )}
</div>

      {/* Activity Feed */}
      <div className="mt-6 sm:mt-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-[14px] sm:text-[15px] font-semibold text-[#ECECEA]">
            Recent Activity
          </h2>
        </div>
        <div className="bg-[#242422] border border-[#2E2E2C] rounded-xl overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-[#5A5A58] px-3 sm:px-4 pt-2.5 sm:pt-3 pb-1">
            Recent
          </p>
          <ActivityFeed notifications={notifications} />
        </div>
      </div>
    </div>
  );
}