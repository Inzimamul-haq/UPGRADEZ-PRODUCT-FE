"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Building2, Pencil, Trash2 } from "lucide-react";
import { departmentSchema } from "@/Schema/validations";
import { BRANCH_OPTIONS } from "@/lib/constants";

type Department = {
  id: string;
  name: string;
  branch: string;
};

export default function AdminDepartmentsPage() {
  const toast = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const params = branchFilter ? { branch: branchFilter } : undefined;
      const { data } = await api.get<{ departments: Department[] }>(
        "/api/departments",
        { params }
      );
      setDepartments(data.departments ?? []);
    } catch {
      toast.error("Failed to load departments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [branchFilter]);

  const filtered = departments.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.branch.toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditingDepartment(null);
    setName("");
    setBranch("");
    setFormError("");
    setShowFormModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDepartment(dept);
    setName(dept.name);
    setBranch(dept.branch);
    setFormError("");
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    setFormError("");
    const parsed = departmentSchema.safeParse({ name, branch });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDepartment) {
        const { data } = await api.put(
          `/api/departments/${editingDepartment.id}`,
          {
            name: parsed.data.name.trim(),
            branch: parsed.data.branch.trim(),
          }
        );
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === editingDepartment.id ? data.department : d
          )
        );
        toast.success("Department updated");
      } else {
        const { data } = await api.post("/api/departments", {
          name: parsed.data.name.trim(),
          branch: parsed.data.branch.trim(),
        });
        setDepartments((prev) =>
          [...prev, data.department].sort((a, b) =>
            a.branch.localeCompare(b.branch) || a.name.localeCompare(b.name)
          )
        );
        toast.success("Department added");
      }
      setShowFormModal(false);
      fetchDepartments();
    } catch (err: any) {
      const msg =
        err.response?.data?.error ??
        err.message ??
        "Failed to save department";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/departments/${deleteTarget.id}`);
      setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.branch} · ${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ?? err.message ?? "Failed to delete department"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Departments</h1>
        <button
          onClick={openAdd}
          className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[14px] text-[#ECECEA] transition-colors hover:bg-[#333331]"
        >
          Add department
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Search departments"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56 rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
        />
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
        >
          <option value="">All Branches</option>
          {BRANCH_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#3A3A38] bg-[#1F1F1E]">
        <div className="flex items-center px-4 py-2.5 text-[11px] uppercase tracking-wider text-[#5A5A58]">
          <div className="w-28">Branch</div>
          <div className="flex-1">Department</div>
          <div className="w-24 text-right">Actions</div>
        </div>

        {isLoading ? (
          <p className="px-4 py-8 text-[13px] text-[#5A5A58]">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              icon={Building2}
              heading="No departments yet"
              action={
                <button
                  onClick={openAdd}
                  className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[13px] text-[#ECECEA] hover:bg-[#333331]"
                >
                  Add first department
                </button>
              }
            />
          </div>
        ) : (
          filtered.map((dept) => (
            <div
              key={dept.id}
              className="flex items-center border-t border-[#3A3A38] px-4 py-3"
            >
              <span className="w-28 text-[13px] text-[#8C8C8A]">{dept.branch}</span>
              <span className="flex-1 text-[14px] text-[#ECECEA]">{dept.name}</span>
              <div className="flex w-24 items-center justify-end gap-3">
                <Pencil
                  size={14}
                  className="cursor-pointer text-[#5A5A58] hover:text-[#ECECEA]"
                  onClick={() => openEdit(dept)}
                />
                <Trash2
                  size={14}
                  className="cursor-pointer text-[#5A5A58] hover:text-red-400"
                  onClick={() => setDeleteTarget(dept)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {showFormModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setShowFormModal(false);
          }}
        >
          <div className="w-full max-w-sm rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6 shadow-xl">
            <h2 className="mb-4 text-[14px] font-medium text-[#ECECEA]">
              {editingDepartment ? "Edit Department" : "Add Department"}
            </h2>

            <label className="mb-1 block text-[12px] text-[#8C8C8A]">
              Branch (degree / program)
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="mb-3 w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none"
            >
              <option value="" disabled>
                Select branch
              </option>
              {BRANCH_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-[12px] text-[#8C8C8A]">
              Department name (specialization)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Science, IT, ECE"
              className="mb-3 w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none"
            />

            {formError && (
              <p className="mb-3 text-[12px] text-red-400">{formError}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFormModal(false)}
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
                {isSubmitting ? "Saving..." : editingDepartment ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.branch} · ${deleteTarget?.name}"?`}
        description="Subject links to this department will be removed. Profiles assigned to this department must be reassigned first."
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
