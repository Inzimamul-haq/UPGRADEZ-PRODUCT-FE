"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableShell } from "@/components/ui/TableShell";
import { TablePagination } from "@/components/ui/TablePagination";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { Users, Search, Trash2 } from "lucide-react";

type College = { id: string; name: string };
type Faculty = {
  id: string;
  name: string;
  email: string;
  role: string;
  collegeId: string | null;
  createdAt: string;
  department: { id: string; name: string; branch: string } | null;
};
type Pagination = { total: number; page: number; limit: number; totalPages: number };

const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "MBA", "MCA"];


function PromoteModal({ faculty, onClose, onSuccess }: { faculty: Faculty; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast();
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  // Super admin can promote faculty to admin or super_admin
  const roles = ["admin", "super_admin"];

  const handlePromote = async () => {
    setLoading(true);
    try {
      await api.patch(`/api/profiles/${faculty.id}/promote`, { role });
      toast.success(`${faculty.name} promoted to ${role}`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Failed to promote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="w-full max-w-sm rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-xl">
        <h2 className="mb-4 text-[15px] font-medium text-[#ECECEA]">Promote {faculty.name}</h2>
        <p className="mb-3 text-[12px] text-[#8C8C8A]">Current role: <span className="text-[#ECECEA]">{faculty.role}</span></p>
        <div>
          <label className="mb-1 block text-[12px] text-[#8C8C8A]">New Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none">
            {roles.map((r) => <option key={r} value={r}>{r.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="rounded-md border border-[#3A3A38] px-4 py-2 text-[13px] text-[#B0B0AE] hover:bg-[#2C2C2A] disabled:opacity-40">Cancel</button>
          <button onClick={handlePromote} disabled={loading} className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-2 text-[13px] text-[#ECECEA] hover:bg-[#333331] disabled:opacity-50">{loading ? "Promoting..." : "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminFacultyPage() {
  const toast = useToast();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 0 });
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<Faculty | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<Faculty | null>(null);

  useEffect(() => {
    api.get<{ data: College[] }>("/api/colleges").then((r) => setColleges(r.data.data ?? [])).catch(() => {});
  }, []);

  const fetchFaculty = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (collegeFilter) params.set("collegeId", collegeFilter);
      if (branchFilter) params.set("branch", branchFilter);
      params.set("page", String(page));
      params.set("limit", "15");
      const { data } = await api.get(`/api/profiles/faculty?${params}`);
      setFaculty(data.faculty ?? []);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load faculty");
    } finally {
      setIsLoading(false);
    }
  }, [search, collegeFilter, branchFilter, page]);

  useEffect(() => { fetchFaculty(); }, [fetchFaculty]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/profiles/faculty/${deleteTarget.id}`);
      toast.success("Faculty deleted");
      setDeleteTarget(null);
      fetchFaculty();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  const collegeName = (id: string | null) => colleges.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="px-6 py-6 w-full">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Faculty <span className="text-[#5A5A58] text-[13px] font-normal ml-1">({pagination.total} total)</span></h1>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5A5A58]" />
          <input placeholder="Search name or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-8 w-52 bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[#4A4A48]" />
        </div>
        <select value={collegeFilter} onChange={(e) => { setCollegeFilter(e.target.value); setPage(1); }} className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]">
          <option value="">All Colleges</option>
          {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }} className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]">
          <option value="">All Departments</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <TableShell
        columns={[
          { label: 'Name', width: '200px' },
          { label: 'Email', width: '200px' },
          { label: 'College', width: '160px' },
          { label: 'Department', width: '128px' },
          { label: 'Joined', width: '96px' },
          { label: 'Actions', width: '96px', align: 'right' },
        ]}
        isLoading={isLoading}
        isEmpty={faculty.length === 0}
        emptyIcon={Users}
        emptyHeading="No faculty found"
      >
        {faculty.map((f) => (
          <div key={f.id} className="flex items-center border-t border-[#2E2E2C] px-4 py-3 hover:bg-[#252523]">
            <div className="w-[200px] text-[13px] text-[#ECECEA] truncate pr-2">{f.name}</div>
            <div className="w-[200px] text-[13px] text-[#8C8C8A] truncate pr-2">{f.email}</div>
            <div className="w-[160px] text-[13px] text-[#8C8C8A] truncate pr-2">{collegeName(f.collegeId)}</div>
            <div className="w-[128px] text-[12px] text-[#8C8C8A] truncate pr-2">{f.department?.name ?? "—"}</div>
            <div className="w-[96px] text-[12px] text-[#8C8C8A] truncate">{new Date(f.createdAt).toLocaleDateString()}</div>
            <div className="w-[96px] flex justify-end gap-1.5 ml-auto">
              <button onClick={() => setPromoteTarget(f)} className="rounded px-2 py-1 text-[11px] text-[#8C8C8A] hover:text-[#ECECEA] border border-[#3A3A38] hover:border-[#4A4A48] transition-colors">Promote</button>
              <button onClick={() => setDeleteTarget(f)} className="p-1.5 rounded text-[#8C8C8A] hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </TableShell>

      <TablePagination
        page={page}
        total={pagination.total}
        rowsPerPage={String(pagination.limit)}
        onPageChange={setPage}
        onRowsPerPageChange={() => {}}
      />

      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteLoading} />}
      {promoteTarget && <PromoteModal faculty={promoteTarget} onClose={() => setPromoteTarget(null)} onSuccess={() => { setPromoteTarget(null); fetchFaculty(); }} />}
    </div>
  );
}
