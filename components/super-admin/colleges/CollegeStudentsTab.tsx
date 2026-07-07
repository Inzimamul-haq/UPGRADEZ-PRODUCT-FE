"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  year: number | null;
  section: string | null;
  department: { name: string; branch: string } | null;
  createdAt: string;
};

export function CollegeStudentsTab({ collegeId }: { collegeId: string }) {
  const toast = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get<{ data: Profile[] }>(`/api/colleges/${collegeId}/profiles`);
        setProfiles(data.data ?? []);
      } catch {
        toast.error("Failed to load profiles");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfiles();
  }, [collegeId]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[16px] font-medium text-[#ECECEA]">Students & Faculty</h2>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#3A3A38] bg-[#1F1F1E]">
        <div className="flex items-center px-4 py-2.5 text-[11px] uppercase tracking-wider text-[#5A5A58]">
          <div className="flex-1">User</div>
          <div className="w-24">Role</div>
          <div className="w-48">Department</div>
          <div className="w-32">Cohort</div>
          <div className="w-32 text-right">Joined</div>
        </div>

        {isLoading ? (
          <p className="px-4 py-8 text-[13px] text-[#5A5A58]">Loading profiles...</p>
        ) : profiles.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              icon={Users}
              heading="No users yet"
              description="Users will appear here when they sign up with the access code."
            />
          </div>
        ) : (
          profiles.map((profile) => (
            <div key={profile.id} className="flex items-center border-t border-[#3A3A38] px-4 py-3">
              <div className="flex-1">
                <div className="text-[14px] text-[#ECECEA]">{profile.name}</div>
                <div className="text-[12px] text-[#8C8C8A]">{profile.email}</div>
              </div>
              <div className="w-24">
                <span className={`rounded px-2 py-0.5 text-[11px] ${
                  profile.role === 'student' ? 'bg-blue-500/10 text-blue-400' : 
                  profile.role === 'faculty' ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {profile.role}
                </span>
              </div>
              <div className="w-48 text-[13px] text-[#ECECEA]">
                {profile.department ? `${profile.department.branch} - ${profile.department.name}` : '-'}
              </div>
              <div className="w-32 text-[13px] text-[#8C8C8A]">
                {profile.year ? `Yr ${profile.year}` : ''}
                {profile.section ? ` · Sec ${profile.section}` : ''}
              </div>
              <div className="w-32 text-right text-[13px] text-[#8C8C8A]">
                {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
