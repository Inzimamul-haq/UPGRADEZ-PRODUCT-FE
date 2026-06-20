import React from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { SubjectCard } from '@/components/dashboard/SubjectCard';
import { Subject, Notification } from '@/lib/types';

export default async function StudentDashboardPage() {
  const name = "Alex Johnson";
  const activeSubjectsCount = 4;
  
  const notifications: Notification[] = [
    { id: '1', type: 'new_paper', message: 'New Model Paper added for Data Structures', read_at: null, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', type: 'syllabus_update', message: 'Syllabus updated for Operating Systems', read_at: null, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', type: 'study_recap', message: 'You practiced 15 questions in Computer Networks yesterday. Keep it up!', read_at: null, created_at: new Date(Date.now() - 172800000).toISOString() },
  ];


  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 w-full">
      <div>
        <h1 className="text-[18px] font-medium text-[#ECECEA]">Good morning, {name}</h1>
        <p className="text-[12px] text-[#8C8C8A] mt-0.5">{today}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard value="4" label="Subjects enrolled" />
        <StatCard value="24" label="AI conversations" />
        <StatCard value="12.5" label="Hours this week" />
        <StatCard value="7" label="Revisions completed" />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-[#ECECEA]">Recent Activity</h2>
          <span className="text-[11px] text-[#8C8C8A] bg-[#2C2C2A] px-2 py-0.5 rounded-full">Live</span>
        </div>
        <div className="bg-[#242422] border border-[#2E2E2C] rounded-xl overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-[#5A5A58] px-4 pt-3 pb-1">Recent</p>
          <ActivityFeed notifications={notifications} />
        </div>
      </div>
    </div>
  );
}
