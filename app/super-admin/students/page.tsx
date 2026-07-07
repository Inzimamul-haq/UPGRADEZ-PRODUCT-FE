"use client";

import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";

type College = { id: string; name: string };
type Student = {
  id: string;
  name: string;
  email: string;
  year: number | null;
  section: string | null;
  role: string;
  collegeId: string | null;
  department: { id: string; name: string; branch: string } | null;
};

type Pagination = { total: number; page: number; limit: number; totalPages: number };

const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "MBA", "MCA"];
const YEARS = [1, 2, 3, 4];
const PROMOTE_ROLES = ["faculty", "admin"];

function ConfirmDeleteModal({ name, onClose, onConfirm, loading }: { name: string; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="w-full max-w-sm rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-xl">
        <h2 className="mb-2 text-[15px] font-medium text-[#ECECEA]">Delete Student</h2>
        <p className="text-[13px] text-[#8C8C8A]">Delete <span className="text-[#ECECEA]">{name}</span>? This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="rounded-md border border-[#3A3A38] px-4 py-2 text-[13px] text-[#B0B0AE] hover:bg-[#2C2C2A] disabled:opacity-40">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="rounded-md bg-red-500/20 border border-red-500/40 px-4 py-2 text-[13px] text-red-400 hover:bg-red-500/30 disabled:opacity-50">{loading ? "Deleting..." : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}

function PromoteModal({ student, onClose, onSuccess }: { student: Student; onClose: () => void; onSuccess: () => void }) {
  const toast = useToast();
  const [role, setRole] = useState("faculty");
  const [loading, setLoading] = useState(false);

  const handlePromote = async () => {
    setLoading(true);
    try {
      await api.patch(`/api/profiles/${student.id}/promote`, { role });
      toast.success(`${student.name} promoted to ${role}`);
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
        <h2 className="mb-4 text-[15px] font-medium text-[#ECECEA]">Promote {student.name}</h2>
        <div>
          <label className="mb-1 block text-[12px] text-[#8C8C8A]">New Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none">
            {PROMOTE_ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
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

export default function SuperAdminStudentsPage() {
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, totalPages: 0 });
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<Student | null>(null);

  useEffect(() => {
    api.get<{ data: College[] }>("/api/colleges").then((r) => setColleges(r.data.data ?? [])).catch(() => {});
  }, []);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (collegeFilter) params.set("collegeId", collegeFilter);
      if (yearFilter) params.set("year", yearFilter);
      if (branchFilter) params.set("branch", branchFilter);
      params.set("page", String(page));
      params.set("limit", "15");
      const { data } = await api.get(`/api/profiles/students?${params}`);
      setStudents(data.students ?? []);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setIsLoading(false);
    }
  }, [search, collegeFilter, yearFilter, branchFilter, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/profiles/students/${deleteTarget.id}`);
      toast.success("Student deleted");
      setDeleteTarget(null);
      fetchStudents();
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
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Students <span className="text-[#5A5A58] text-[13px] font-normal ml-1">({pagination.total} total)</span></h1>
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
        <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }} className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]">
          <option value="">All Years</option>
          {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }} className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]">
          <option value="">All Branches</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[#3A3A38] bg-[#1F1F1E]">
        <div className="flex items-center px-4 py-2.5 text-[11px] uppercase tracking-wider text-[#5A5A58]">
          <div className="flex-1">Name</div>
          <div className="w-40">Email</div>
          <div className="w-40">College</div>
          <div className="w-28">Department</div>
          <div className="w-16 text-center">Year</div>
          <div className="w-16 text-center">Sec</div>
          <div className="w-24 text-right">Actions</div>
        </div>

        {isLoading ? (
          <p className="px-4 py-8 text-[13px] text-[#5A5A58]">Loading...</p>
        ) : students.length === 0 ? (
          <div className="py-8"><EmptyState icon={Users} heading="No students found" /></div>
        ) : (
          students.map((s) => (
            <div key={s.id} className="flex items-center border-t border-[#2E2E2C] px-4 py-3 hover:bg-[#252523]">
              <div className="flex-1 text-[13px] text-[#ECECEA] truncate pr-2">{s.name}</div>
              <div className="w-40 text-[13px] text-[#8C8C8A] truncate pr-2">{s.email}</div>
              <div className="w-40 text-[13px] text-[#8C8C8A] truncate pr-2">{collegeName(s.collegeId)}</div>
              <div className="w-28 text-[12px] text-[#8C8C8A] truncate">{s.department?.name ?? "—"}</div>
              <div className="w-16 text-center text-[13px] text-[#8C8C8A]">{s.year ?? "—"}</div>
              <div className="w-16 text-center text-[13px] text-[#8C8C8A]">{s.section ?? "—"}</div>
              <div className="w-24 flex justify-end gap-1.5">
                <button onClick={() => setPromoteTarget(s)} className="rounded px-2 py-1 text-[11px] text-[#8C8C8A] hover:text-[#ECECEA] border border-[#3A3A38] hover:border-[#4A4A48] transition-colors">Promote</button>
                <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded text-[#8C8C8A] hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-[13px] text-[#8C8C8A]">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-md border border-[#3A3A38] hover:bg-[#2C2C2A] disabled:opacity-30"><ChevronLeft size={14} /></button>
            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="p-1.5 rounded-md border border-[#3A3A38] hover:bg-[#2C2C2A] disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {deleteTarget && <ConfirmDeleteModal name={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteLoading} />}
      {promoteTarget && <PromoteModal student={promoteTarget} onClose={() => setPromoteTarget(null)} onSuccess={() => { setPromoteTarget(null); fetchStudents(); }} />}
    </div>
  );
}
