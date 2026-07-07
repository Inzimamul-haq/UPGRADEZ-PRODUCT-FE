"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { Building2 } from "lucide-react";

type Department = {
  id: string;
  name: string;
  branch: string;
};

export function CollegeDepartmentsTab({ collegeId }: { collegeId: string }) {
  const toast = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<{ data: Department[] }>(`/api/colleges/${collegeId}/departments`);
      setDepartments(data.data ?? []);
    } catch {
      toast.error("Failed to load departments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [collegeId]);

  const handleSubmit = async () => {
    if (!name.trim() || !branch.trim()) {
      toast.error("Name and branch are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/api/colleges/${collegeId}/departments`, {
        name: name.trim(),
        branch: branch.trim()
      });
      toast.success("Department added");
      setName("");
      setBranch("");
      setShowAddForm(false);
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Failed to add department");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[16px] font-medium text-[#ECECEA]">Departments</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[14px] text-[#ECECEA] transition-colors hover:bg-[#333331]"
        >
          Add Department
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Branch (e.g. B.Tech)"
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
              />
            </div>
            <div className="flex-[2]">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Department Name (e.g. Computer Science)"
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-md border border-[#3A3A38] px-3 py-2 text-[13px] text-[#B0B0AE] hover:bg-[#2C2C2A]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] hover:bg-[#333331] disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-[#3A3A38] bg-[#1F1F1E]">
        <div className="flex items-center px-4 py-2.5 text-[11px] uppercase tracking-wider text-[#5A5A58]">
          <div className="w-48">Branch</div>
          <div className="flex-1">Department Name</div>
        </div>

        {isLoading ? (
          <p className="px-4 py-8 text-[13px] text-[#5A5A58]">Loading departments...</p>
        ) : departments.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              icon={Building2}
              heading="No departments yet"
              action={
                <button
                  onClick={() => setShowAddForm(true)}
                  className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#ECECEA] hover:bg-[#333331]"
                >
                  Add first department
                </button>
              }
            />
          </div>
        ) : (
          departments.map((dept) => (
            <div key={dept.id} className="flex items-center border-t border-[#3A3A38] px-4 py-3">
              <span className="w-48 text-[13px] text-[#8C8C8A]">{dept.branch}</span>
              <span className="flex-1 text-[14px] text-[#ECECEA]">{dept.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
