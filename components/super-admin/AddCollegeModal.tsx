"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

interface AddCollegeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCollegeModal({ onClose, onSuccess }: AddCollegeModalProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!accessCode || accessCode === generateSlug(name)) {
      setAccessCode(generateSlug(newName));
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!shortName.trim()) {
      setError("Short name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("shortName", shortName.trim());
      if (accessCode.trim()) formData.append("accessCode", accessCode.trim());
      if (geminiApiKey.trim()) formData.append("geminiApiKey", geminiApiKey.trim());
      if (logoFile) formData.append("logo", logoFile);
      if (bannerFile) formData.append("banner", bannerFile);

      await api.post("/api/colleges", formData);
      toast.success("College created successfully");
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? "Failed to create college";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-xl">
        <h2 className="mb-4 text-[16px] font-medium text-[#ECECEA]">
          Add College
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">
              College Name *
            </label>
            <input
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. C. Abdul Hakeem College"
              className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">
              Short Name *
            </label>
            <input
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="e.g. CAHCET"
              className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">
              Access Code
            </label>
            <input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="e.g. cahcet-8f3k2"
              className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] font-mono placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-[#5A5A58]">Students will use this code during signup.</p>
          </div>

          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">
              Gemini API Key (Optional)
            </label>
            <input
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              type="password"
              placeholder="Leave blank to use default key"
              className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">
                College Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5 text-[12px] text-[#ECECEA] file:mr-3 file:rounded file:border-0 file:bg-[#3A3A38] file:px-2 file:py-1 file:text-[11px] file:text-[#ECECEA] hover:file:bg-[#4A4A48] focus:border-[#4A4A48] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">
                College Banner
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5 text-[12px] text-[#ECECEA] file:mr-3 file:rounded file:border-0 file:bg-[#3A3A38] file:px-2 file:py-1 file:text-[11px] file:text-[#ECECEA] hover:file:bg-[#4A4A48] focus:border-[#4A4A48] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-[12px] text-red-400">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-[#3A3A38] px-4 py-2 text-[13px] text-[#B0B0AE] hover:bg-[#2C2C2A] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-2 text-[13px] text-[#ECECEA] hover:bg-[#333331] disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create College"}
          </button>
        </div>
      </div>
    </div>
  );
}
