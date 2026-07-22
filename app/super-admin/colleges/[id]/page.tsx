"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SharedAdminDashboard } from '@/components/dashboard/SharedAdminDashboard';
import api from '@/lib/api';

export default function SuperAdminCollegeAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const collegeId = params.id as string;
  const [collegeName, setCollegeName] = useState<string>("Loading College...");

  useEffect(() => {
    const fetchCollege = async () => {
      try {
        const res = await api.get(`/api/colleges/${collegeId}`);
        if (res.data.data) {
          setCollegeName(res.data.data.name);
        }
      } catch (err) {
        console.error('Failed to fetch college details', err);
        setCollegeName("Unknown College");
      }
    };
    if (collegeId) {
      fetchCollege();
    }
  }, [collegeId]);

  return (
    <div className="w-full flex flex-col h-screen overflow-y-auto bg-[#1A1A19]">
      <div className="px-6 py-4 flex items-center border-b border-[#2E2E2C]">
        <button 
          onClick={() => router.push('/super-admin/colleges')}
          className="text-[#8C8C8A] hover:text-[#ECECEA] text-[13px] flex items-center gap-2 transition-colors mr-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Colleges
        </button>
      </div>
      <SharedAdminDashboard collegeId={collegeId} collegeName={collegeName} />
    </div>
  );
}
