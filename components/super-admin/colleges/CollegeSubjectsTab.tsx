"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookOpen } from "lucide-react";

type Department = {
  id: string;
  name: string;
  branch: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
  year: number | null;
  regulation: string | null;
  isActive: boolean;
  subjectDepartments: {
    department: Department;
  }[];
};

export function CollegeSubjectsTab({ collegeId }: { collegeId: string }) {
  const toast = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [regulation, setRegulation] = useState("");
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [subjRes, deptRes] = await Promise.all([
        api.get<{ data: Subject[] }>(`/api/colleges/${collegeId}/subjects`),
        api.get<{ data: Department[] }>(`/api/colleges/${collegeId}/departments`)
      ]);
      setSubjects(subjRes.data.data ?? []);
      setDepartments(deptRes.data.data ?? []);
    } catch {
      toast.error("Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collegeId]);

  const toggleDeptSelection = (deptId: string) => {
    setSelectedDeptIds(prev =>
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim() || selectedDeptIds.length === 0) {
      toast.error("Name, code, and at least one department are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/api/colleges/${collegeId}/subjects`, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        year: year ? Number(year) : undefined,
        regulation: regulation.trim() || undefined,
        departmentIds: selectedDeptIds
      });
      toast.success("Subject added");
      setName("");
      setCode("");
      setYear("");
      setRegulation("");
      setSelectedDeptIds([]);
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Failed to add subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[16px] font-medium text-[#ECECEA]">Subjects</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[14px] text-[#ECECEA] transition-colors hover:bg-[#333331]"
        >
          Add Subject
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">Subject Code *</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS101"
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">Subject Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Data Structures"
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">Year (Optional)</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 1"
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">Regulation (Optional)</label>
              <input
                value={regulation}
                onChange={(e) => setRegulation(e.target.value)}
                placeholder="e.g. 2021"
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-[12px] text-[#8C8C8A]">Assign to Departments *</label>
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => toggleDeptSelection(dept.id)}
                  className={`rounded-full px-3 py-1 text-[12px] transition-colors ${
                    selectedDeptIds.includes(dept.id)
                      ? "bg-[#ECECEA] text-[#1C1C1B]"
                      : "border border-[#3A3A38] bg-[#2C2C2A] text-[#B0B0AE] hover:text-[#ECECEA]"
                  }`}
                >
                  {dept.branch} - {dept.name}
                </button>
              ))}
              {departments.length === 0 && (
                <span className="text-[12px] text-red-400">Please create departments first.</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
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
              Save Subject
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-[#3A3A38] bg-[#1F1F1E]">
        <div className="flex items-center px-4 py-2.5 text-[11px] uppercase tracking-wider text-[#5A5A58]">
          <div className="w-24">Code</div>
          <div className="flex-1">Subject Name</div>
          <div className="w-48 text-left">Departments</div>
          <div className="w-24 text-center">Year</div>
        </div>

        {isLoading ? (
          <p className="px-4 py-8 text-[13px] text-[#5A5A58]">Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              icon={BookOpen}
              heading="No subjects yet"
              action={
                <button
                  onClick={() => setShowAddForm(true)}
                  className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#ECECEA] hover:bg-[#333331]"
                >
                  Add first subject
                </button>
              }
            />
          </div>
        ) : (
          subjects.map((sub) => (
            <div key={sub.id} className="flex items-center border-t border-[#3A3A38] px-4 py-3">
              <span className="w-24 text-[13px] font-mono text-[#ECECEA]">{sub.code}</span>
              <span className="flex-1 text-[14px] text-[#ECECEA]">{sub.name}</span>
              <div className="w-48 flex flex-wrap gap-1">
                {sub.subjectDepartments.map((sd) => (
                  <span key={sd.department.id} className="rounded bg-[#2C2C2A] px-1.5 py-0.5 text-[11px] text-[#B0B0AE]" title={sd.department.name}>
                    {sd.department.branch}
                  </span>
                ))}
              </div>
              <span className="w-24 text-center text-[13px] text-[#8C8C8A]">
                {sub.year ? `Year ${sub.year}` : '-'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
