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
type Student = {
  id: string;
  name: string;
  email: string;
  year: number | null;
  section: string | null;
  role: string;
  rollNo: string | null;
  regulation: string | null;
  collegeId: string | null;
  department: { id: string; name: string; branch: string } | null;
};

type Pagination = { total: number; page: number; limit: number; totalPages: number };

const BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "MBA", "MCA"];
const YEARS = [1, 2, 3, 4];
const PROMOTE_ROLES = ["faculty", "admin"];


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
  const [batchYearFilter, setBatchYearFilter] = useState("");
  const [regulationFilter, setRegulationFilter] = useState("");
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
      if (batchYearFilter) params.set("batchYear", batchYearFilter);
      if (regulationFilter) params.set("regulation", regulationFilter);
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
  }, [search, collegeFilter, yearFilter, branchFilter, batchYearFilter, regulationFilter, page]);

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
        <select value={batchYearFilter} onChange={(e) => { setBatchYearFilter(e.target.value); setPage(1); }} className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]">
          <option value="">All Batches</option>
          <option value="2020">2020</option>
          <option value="2021">2021</option>
          <option value="2022">2022</option>
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
        <select value={regulationFilter} onChange={(e) => { setRegulationFilter(e.target.value); setPage(1); }} className="bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[13px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]">
          <option value="">All Regulations</option>
          <option value="R20">R20</option>
          <option value="R22">R22</option>
          <option value="R23">R23</option>
        </select>
      </div>

      <TableShell
        columns={[
          { label: 'Name', width: '200px' },
          { label: 'Email', width: '180px' },
          { label: 'College', width: '128px' },
          { label: 'Department', width: '96px' },
          { label: 'Roll No', width: '100px' },
          { label: 'Regulation', width: '80px' },
          { label: 'Year', width: '64px', align: 'right' },
          { label: 'Sec', width: '64px', align: 'right' },
          { label: 'Actions', width: '96px', align: 'right' },
        ]}
        isLoading={isLoading}
        isEmpty={students.length === 0}
        emptyIcon={Users}
        emptyHeading="No students found"
      >
        {students.map((s) => (
          <div key={s.id} className="flex items-center border-t border-[#2E2E2C] px-4 py-3 hover:bg-[#252523]">
            <div className="w-[200px] text-[13px] text-[#ECECEA] truncate pr-2">{s.name}</div>
            <div className="w-[180px] text-[13px] text-[#8C8C8A] truncate pr-2">{s.email}</div>
            <div className="w-32 text-[13px] text-[#8C8C8A] truncate pr-2">{collegeName(s.collegeId)}</div>
            <div className="w-24 text-[12px] text-[#8C8C8A] truncate">{s.department?.name ?? "—"}</div>
            <div className="w-[100px] text-[13px] text-[#8C8C8A] truncate pr-2">{s.rollNo ?? "—"}</div>
            <div className="w-[80px] text-[13px] text-[#8C8C8A] truncate">{s.regulation ?? "—"}</div>
            <div className="w-16 text-[13px] text-[#8C8C8A] text-right">{s.year ?? "—"}</div>
            <div className="w-16 text-[13px] text-[#8C8C8A] text-right">{s.section ?? "—"}</div>
            <div className="w-24 flex justify-end gap-1.5 ml-auto">
              <button onClick={() => setPromoteTarget(s)} className="rounded px-2 py-1 text-[11px] text-[#8C8C8A] hover:text-[#ECECEA] border border-[#3A3A38] hover:border-[#4A4A48] transition-colors">Promote</button>
              <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded text-[#8C8C8A] hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
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
      {promoteTarget && <PromoteModal student={promoteTarget} onClose={() => setPromoteTarget(null)} onSuccess={() => { setPromoteTarget(null); fetchStudents(); }} />}
    </div>
  );
}
