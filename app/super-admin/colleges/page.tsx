"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { Building2, Pencil, Trash2 } from "lucide-react";
import { AddCollegeModal } from "@/components/super-admin/AddCollegeModal";
import { useRouter } from "next/navigation";

type College = {
  id: string;
  name: string;
  accessCode: string;
  isActive: boolean;
  hasGeminiApiKey?: boolean;
  tokenLimit?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  _count: { profiles: number };
};

function EditCollegeModal({ college, onClose, onSuccess }: { college: College; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(college.name);
  const [shortName, setShortName] = useState((college as any).shortName || "");
  const [accessCode, setAccessCode] = useState(college.accessCode);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [tokenLimit, setTokenLimit] = useState(college.tokenLimit || "");
  const [isActive, setIsActive] = useState(college.isActive);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      if (name.trim() !== college.name) formData.append("name", name.trim());
      if (shortName.trim() !== (college as any).shortName) formData.append("shortName", shortName.trim());
      if (accessCode.trim() !== college.accessCode) formData.append("accessCode", accessCode.trim());
      if (geminiApiKey.trim() !== "") formData.append("geminiApiKey", geminiApiKey.trim());
      if (tokenLimit.toString().trim() !== (college.tokenLimit || "")) formData.append("tokenLimit", tokenLimit.toString().trim());
      formData.append("isActive", isActive.toString());
      if (logoFile) formData.append("logo", logoFile);
      if (bannerFile) formData.append("banner", bannerFile);

      await api.put(`/api/colleges/${college.id}`, formData);
      toast.success("College updated");
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error ?? "Failed to update";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="w-full max-w-md rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-xl">
        <h2 className="mb-4 text-[16px] font-medium text-[#ECECEA]">Edit College</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">College Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">Short Name</label>
            <input value={shortName} onChange={(e) => setShortName(e.target.value)} className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">Access Code</label>
            <input value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] font-mono text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none" />
            <p className="mt-1 text-[11px] text-[#5A5A58]">Students use this code to sign up.</p>
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">Gemini API Key (Optional)</label>
            <input value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} type="password" placeholder="Leave blank to use default" className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-[#8C8C8A]">Token Limit</label>
            <input type="number" value={tokenLimit} onChange={(e) => setTokenLimit(e.target.value)} placeholder="e.g. 1000000" className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none" />
          </div>
          <div className="flex items-center justify-between rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2.5">
            <span className="text-[13px] text-[#ECECEA]">Active Status</span>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? "bg-green-500" : "bg-[#3A3A38]"}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">College Logo</label>
              <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5 text-[12px] text-[#ECECEA] file:mr-3 file:rounded file:border-0 file:bg-[#3A3A38] file:px-2 file:py-1 file:text-[11px] file:text-[#ECECEA] hover:file:bg-[#4A4A48] focus:border-[#4A4A48] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[12px] text-[#8C8C8A]">College Banner</label>
              <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5 text-[12px] text-[#ECECEA] file:mr-3 file:rounded file:border-0 file:bg-[#3A3A38] file:px-2 file:py-1 file:text-[11px] file:text-[#ECECEA] hover:file:bg-[#4A4A48] focus:border-[#4A4A48] focus:outline-none" />
            </div>
          </div>
        </div>
        {error && <p className="mt-3 text-[12px] text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="rounded-md border border-[#3A3A38] px-4 py-2 text-[13px] text-[#B0B0AE] hover:bg-[#2C2C2A] disabled:opacity-40">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-2 text-[13px] text-[#ECECEA] hover:bg-[#333331] disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ name, onClose, onConfirm, loading }: { name: string; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="w-full max-w-sm rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-xl">
        <h2 className="mb-2 text-[16px] font-medium text-[#ECECEA]">Delete College</h2>
        <p className="text-[13px] text-[#8C8C8A]">Are you sure you want to delete <span className="text-[#ECECEA] font-medium">{name}</span>? This action cannot be undone and will remove all associated data.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="rounded-md border border-[#3A3A38] px-4 py-2 text-[13px] text-[#B0B0AE] hover:bg-[#2C2C2A] disabled:opacity-40">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="rounded-md bg-red-500/20 border border-red-500/40 px-4 py-2 text-[13px] text-red-400 hover:bg-red-500/30 disabled:opacity-50">{loading ? "Deleting..." : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminCollegesPage() {
  const router = useRouter();
  const toast = useToast();
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCollege, setEditCollege] = useState<College | null>(null);
  const [deleteCollege, setDeleteCollege] = useState<College | null>(null);
  const [deleteSecret, setDeleteSecret] = useState("");
  const [secretPromptCollege, setSecretPromptCollege] = useState<College | null>(null);
  const [deleteSecretInput, setDeleteSecretInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchColleges = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<{ data: College[] }>("/api/colleges");
      setColleges(data.data ?? []);
    } catch {
      toast.error("Failed to load colleges");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchColleges(); }, []);

  const filtered = colleges.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.accessCode.toLowerCase().includes(q);
  });

  const handleDelete = async () => {
    if (!deleteCollege || !deleteSecret) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/colleges/${deleteCollege.id}`, { data: { secret: deleteSecret } });
      toast.success("College deleted");
      setDeleteCollege(null);
      setDeleteSecret("");
      fetchColleges();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Colleges</h1>
        <button onClick={() => setShowAddModal(true)} className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[14px] text-[#ECECEA] transition-colors hover:bg-[#333331]">
          Add college
        </button>
      </div>

      <div className="mb-4">
        <input
          placeholder="Search by name or access code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#3A3A38] bg-[#1F1F1E]">
        <div className="flex items-center px-4 py-2.5 text-[11px] uppercase tracking-wider text-[#5A5A58]">
          <div className="flex-1">Name</div>
          <div className="w-28">Access Code</div>
          <div className="w-16 text-center">Members</div>
          <div className="w-20 text-center">Gemini API</div>
          <div className="w-20 text-center">Logo</div>
          <div className="w-20 text-center">Banner</div>
          <div className="w-20 text-center">Status</div>
          <div className="w-32 text-right">Action</div>
        </div>

        {isLoading ? (
          <p className="px-4 py-8 text-[13px] text-[#5A5A58]">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState icon={Building2} heading="No colleges found" action={<button onClick={() => setShowAddModal(true)} className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#ECECEA] hover:bg-[#333331]">Add first college</button>} />
          </div>
        ) : (
          filtered.map((college) => {

            return (
              <div key={college.id} className="flex items-center border-t border-[#3A3A38] px-4 py-3 hover:bg-[#252523]">
                <div className="flex-1 text-[14px] text-[#ECECEA] truncate pr-4">{college.name}</div>
                <div className="w-28">
                  <span className="rounded bg-[#2C2C2A] px-1.5 py-0.5 text-[12px] font-mono text-[#B0B0AE]">{college.accessCode}</span>
                </div>
                <div className="w-16 text-center text-[13px] text-[#8C8C8A]">{college._count.profiles}</div>
                <div className="w-20 text-center text-[13px] text-[#8C8C8A]">
                  <span className={college.hasGeminiApiKey ? "text-green-400" : "text-[#5A5A58]"}>{college.hasGeminiApiKey ? "Yes" : "No"}</span>
                </div>
                <div className="w-20 text-center text-[13px] text-[#8C8C8A]">
                  <span className={college.logoUrl ? "text-green-400" : "text-[#5A5A58]"}>{college.logoUrl ? "Yes" : "No"}</span>
                </div>
                <div className="w-20 text-center text-[13px] text-[#8C8C8A]">
                  <span className={college.bannerUrl ? "text-green-400" : "text-[#5A5A58]"}>{college.bannerUrl ? "Yes" : "No"}</span>
                </div>
                <div className="w-20 text-center">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${college.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {college.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="w-32 flex items-center justify-end gap-2">
                  <button onClick={() => router.push(`/super-admin/colleges/${college.id}`)} className="p-1.5 rounded-md text-[#8C8C8A] hover:text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors" title="View Analytics">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                    </svg>
                  </button>
                  <button onClick={() => setEditCollege(college)} className="p-1.5 rounded-md text-[#8C8C8A] hover:text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => {
                    setSecretPromptCollege(college);
                    setDeleteSecretInput('');
                  }} className="p-1.5 rounded-md text-[#8C8C8A] hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAddModal && <AddCollegeModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchColleges(); }} />}
      {editCollege && <EditCollegeModal college={editCollege} onClose={() => setEditCollege(null)} onSuccess={() => { setEditCollege(null); fetchColleges(); }} />}
      {deleteCollege && <ConfirmDeleteModal name={deleteCollege.name} onClose={() => setDeleteCollege(null)} onConfirm={handleDelete} loading={deleteLoading} />}
      {secretPromptCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-xl">
            <h2 className="text-[14px] font-medium text-[#ECECEA] mb-4">Enter Super Admin Secret</h2>
            <input
              type="password"
              placeholder="Secret"
              value={deleteSecretInput}
              onChange={(e) => setDeleteSecretInput(e.target.value)}
              className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-2 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] mb-6"
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  if (!deleteSecretInput) return;
                  try {
                    await api.post('/api/colleges/verify-secret', { secret: deleteSecretInput });
                    setDeleteSecret(deleteSecretInput);
                    setDeleteCollege(secretPromptCollege);
                    setSecretPromptCollege(null);
                    setDeleteSecretInput('');
                  } catch {
                    toast.error("Invalid SUPER_ADMIN_SECRET");
                  }
                }
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSecretPromptCollege(null)}
                className="text-[13px] text-[#8C8C8A] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!deleteSecretInput) return;
                  try {
                    await api.post('/api/colleges/verify-secret', { secret: deleteSecretInput });
                    setDeleteSecret(deleteSecretInput);
                    setDeleteCollege(secretPromptCollege);
                    setSecretPromptCollege(null);
                    setDeleteSecretInput('');
                  } catch {
                    toast.error("Invalid SUPER_ADMIN_SECRET");
                  }
                }}
                className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-1.5 text-[13px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
