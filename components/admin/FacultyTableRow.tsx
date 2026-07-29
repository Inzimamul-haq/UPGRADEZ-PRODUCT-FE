"use client";

import { FacultyTableRowProps } from "@/lib/types";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

export function FacultyTableRow({
  faculty,
  onEdit,
  onDelete,
}: FacultyTableRowProps
) {
  const [confirmAction, setConfirmAction] = useState<
    "delete" | null
  >(null);

  const handleConfirm = () => {
    if (confirmAction === "delete") {
      onDelete(faculty.id);
    }
    setConfirmAction(null);
  };

  const roleLabel = (role: string) => {
    if (role === 'admin') return 'Admin';
    if (role === 'super_admin') return 'Super Admin';
    return 'Faculty';
  };

  return (
    <>
      <div className="flex items-center px-4 py-3 border-t border-[#2E2E2C] hover:bg-[#2C2C2A] min-w-[900px]">
        <div className="w-[20%] text-[13px] text-[#ECECEA] truncate pr-2">
          {faculty.name}
        </div>

        <div className="w-[26%] text-[13px] text-[#8C8C8A] truncate pr-2">
          {faculty.email}
        </div>

        <div className="w-[24%] text-[13px] text-[#8C8C8A] truncate pr-2">
          {faculty.department}
        </div>

        <div className="w-[10%] text-[13px] text-[#8C8C8A]">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#2C2C2A] border border-[#3A3A38] text-[#ECECEA]">
            {roleLabel(faculty.role)}
          </span>
        </div>

        <div className="w-[20%] flex justify-end gap-2">
          <button
            onClick={() => onEdit(faculty.id)}
            title="Edit"
            className="p-1.5 rounded border border-[#3A3A38] bg-[#1F1F1E] text-[#8C8C8A] hover:bg-[#2C2C2A] hover:text-[#ECECEA] transition-colors"
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={() => setConfirmAction("delete")}
            title="Delete"
            className="p-1.5 rounded border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {confirmAction && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Delete Faculty"
          description={`Delete ${faculty.name}? This cannot be undone.`}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
