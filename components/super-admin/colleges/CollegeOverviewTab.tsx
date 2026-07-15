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
  const [shortName, setShortName] = useState(college.shortName || "");
  const [accessCode, setAccessCode] = useState(college.accessCode);
  const [geminiApiKey, setGeminiApiKey] = useState(college.geminiApiKey || "");
  const [isActive, setIsActive] = useState(college.isActive);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("shortName", shortName.trim());
      formData.append("accessCode", accessCode.trim());
      if (geminiApiKey.trim()) {
        formData.append("geminiApiKey", geminiApiKey.trim());
      }
      formData.append("isActive", String(isActive));
      if (logo) formData.append("logo", logo);
      if (banner) formData.append("banner", banner);

      await api.put(`/api/colleges/${college.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">College Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">Short Name</label>
            <input
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
            />
          </div>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">Logo Image</label>
            <div className="flex items-center gap-3">
              {college.logoUrl && !logo && (
                <img src={college.logoUrl} alt="Logo preview" className="h-10 w-10 rounded object-contain bg-white/5 border border-[#3A3A38]" />
              )}
              {logo && (
                <img src={URL.createObjectURL(logo)} alt="New logo preview" className="h-10 w-10 rounded object-contain bg-white/5 border border-[#3A3A38]" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogo(e.target.files?.[0] || null)}
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[12px] file:bg-[#3A3A38] file:text-[#ECECEA] hover:file:bg-[#4A4A48]"
              />
            </div>
            {college.logoUrl && !logo && (
              <p className="mt-1 text-[11px] text-[#8C8C8A]">Current logo will be kept if unchanged.</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">Banner Image</label>
            <div className="flex items-center gap-3">
              {college.bannerUrl && !banner && (
                <img src={college.bannerUrl} alt="Banner preview" className="h-10 w-10 rounded object-contain bg-white/5 border border-[#3A3A38]" />
              )}
              {banner && (
                <img src={URL.createObjectURL(banner)} alt="New banner preview" className="h-10 w-10 rounded object-contain bg-white/5 border border-[#3A3A38]" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBanner(e.target.files?.[0] || null)}
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[12px] file:bg-[#3A3A38] file:text-[#ECECEA] hover:file:bg-[#4A4A48]"
              />
            </div>
            {college.bannerUrl && !banner && (
              <p className="mt-1 text-[11px] text-[#8C8C8A]">Current banner will be kept if unchanged.</p>
            )}
          </div>
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
