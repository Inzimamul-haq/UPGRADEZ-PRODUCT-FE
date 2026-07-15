"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { CollegeOverviewTab } from "@/components/super-admin/colleges/CollegeOverviewTab";
import { CollegeDepartmentsTab } from "@/components/super-admin/colleges/CollegeDepartmentsTab";
import { CollegeSubjectsTab } from "@/components/super-admin/colleges/CollegeSubjectsTab";
import { CollegeStudentsTab } from "@/components/super-admin/colleges/CollegeStudentsTab";
import { CollegeUsageTab } from "@/components/super-admin/colleges/CollegeUsageTab";

export type CollegeDetail = {
  id: string;
  name: string;
  shortName: string;
  accessCode: string;
  geminiApiKey: string | null;
  isActive: boolean;
  logoUrl: string | null;
  bannerUrl: string | null;
};

type TabType = "overview" | "departments" | "subjects" | "students" | "usage";

export default function CollegeDetailPage() {
  const { id } = useParams() as { id: string };
  const toast = useToast();
  const router = useRouter();

  const [college, setCollege] = useState<CollegeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const fetchCollege = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<{ data: CollegeDetail }>(`/api/colleges/${id}`);
      setCollege(data.data);
    } catch {
      toast.error("Failed to load college details");
      router.push("/super-admin/colleges");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollege();
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-[14px] text-[#8C8C8A]">Loading college details...</div>;
  }

  if (!college) return null;

  const tabs: { id: TabType; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "departments", label: "Departments" },
    { id: "subjects", label: "Subjects" },
    { id: "students", label: "Students" },
    { id: "usage", label: "Usage" }
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      <div className="mb-6">
        <Link 
          href="/super-admin/colleges"
          className="mb-4 inline-flex items-center gap-1 text-[13px] text-[#8C8C8A] transition-colors hover:text-[#ECECEA]"
        >
          <ChevronLeft size={16} />
          Back to colleges
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-medium text-[#ECECEA]">{college.name}</h1>
          <span className={`px-2 py-1 rounded text-[12px] ${college.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {college.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="mb-6 flex space-x-1 border-b border-[#3A3A38]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-[#ECECEA] text-[#ECECEA]"
                : "border-transparent text-[#8C8C8A] hover:text-[#ECECEA]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "overview" && <CollegeOverviewTab college={college} onUpdate={fetchCollege} />}
        {activeTab === "departments" && <CollegeDepartmentsTab collegeId={college.id} />}
        {activeTab === "subjects" && <CollegeSubjectsTab collegeId={college.id} />}
        {activeTab === "students" && <CollegeStudentsTab collegeId={college.id} />}
        {activeTab === "usage" && <CollegeUsageTab collegeId={college.id} />}
      </div>
    </div>
  );
}
