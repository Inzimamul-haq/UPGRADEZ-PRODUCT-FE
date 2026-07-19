"use client";

import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { FileText, BookOpen, Users, Zap } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
  subjectsAssigned: { count: number; byRegulation: { regulation: string; count: number }[] };
  papersGenerated: { count: number };
  aiConversations: { count: number };
  papersThisMonth: { count: number };
}

const recentActivity = [
  { icon: FileText, text: 'You generated CAT 1 Paper for Data Structures', sub: 'Today · 2 hours ago' },
  { icon: Users, text: '43 students accessed your Operating Systems paper', sub: 'Today · 5 hours ago' },
  { icon: BookOpen, text: 'Syllabus for Computer Networks was updated', sub: 'Yesterday' },
  { icon: Zap, text: 'AI generated 12 new questions for Database Management', sub: '2 days ago' },
  { icon: FileText, text: 'Model Paper for OS published and live', sub: '3 days ago' },
];

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/faculty/dashboard/stats');
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
              value={stats.subjectsAssigned.count.toString()} 
              label="Subjects assigned" 
            />
            <StatCard 
              value={stats.papersGenerated.count.toString()} 
              label="Papers generated" 
            />
            <StatCard 
              value={stats.aiConversations.count.toString()} 
              label="AI conversations" 
            />
            <StatCard 
              value={stats.papersThisMonth.count.toString()} 
              label="Papers this month" 
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
          <div className="divide-y divide-[#2E2E2C]">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4 hover:bg-[#2C2C2A] transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#333331] flex items-center justify-center flex-shrink-0">
                  <item.icon size={15} className="text-[#ECECEA]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] text-[#ECECEA] leading-snug">{item.text}</p>
                  <p className="text-[11.5px] text-[#8C8C8A] mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
