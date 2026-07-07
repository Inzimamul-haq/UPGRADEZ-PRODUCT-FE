"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { CollegeDetail } from "@/app/super-admin/colleges/[id]/page";

export function CollegeOverviewTab({
  college,
  onUpdate
}: {
  college: CollegeDetail;
  onUpdate: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(college.name);
  const [accessCode, setAccessCode] = useState(college.accessCode);
  const [geminiApiKey, setGeminiApiKey] = useState(college.geminiApiKey || "");
  const [isActive, setIsActive] = useState(college.isActive);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.put(`/api/colleges/${college.id}`, {
        name: name.trim(),
        accessCode: accessCode.trim(),
        geminiApiKey: geminiApiKey.trim() || undefined,
        isActive
      });
      toast.success("College details updated");
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? "Failed to update college");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6">
      <h2 className="mb-4 text-[16px] font-medium text-[#ECECEA]">Edit College Details</h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[12px] text-[#8C8C8A]">College Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] text-[#8C8C8A]">Access Code</label>
          <input
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] font-mono focus:border-[#4A4A48] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] text-[#8C8C8A]">Gemini API Key (Optional)</label>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="Leave blank to use global default"
            className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 py-2">
          <label className="text-[13px] text-[#ECECEA]">Status</label>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isActive ? "bg-green-500" : "bg-[#3A3A38]"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-[12px] text-[#8C8C8A]">{isActive ? "Active" : "Inactive"}</span>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-2 text-[13px] text-[#ECECEA] hover:bg-[#333331] disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
