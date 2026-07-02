"use client";

import { useState } from "react";

interface Faculty {
  id: string;
  name: string;
  email: string;
  branch: string;
  department: string;
  joined: string;
}

interface FacultyTableRowProps {
  faculty: Faculty;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FacultyTableRow({
  faculty,
  onEdit,
  onDelete,
}: FacultyTableRowProps) {
  const [confirmAction, setConfirmAction] = useState<
    "delete" | null
  >(null);

  const handleConfirm = () => {
    if (confirmAction === "delete") {
      onDelete(faculty.id);
    }

    setConfirmAction(null);
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

        <div className="w-[10%] text-[13px] text-[#8C8C8A] truncate pr-2">
          {faculty.branch}
        </div>

        <div className="w-[14%] text-[13px] text-[#8C8C8A] truncate pr-2">
          {faculty.department}
        </div>

        <div className="w-[10%] text-[13px] text-[#8C8C8A]">
          {faculty.joined}
        </div>

        <div className="w-[20%] flex justify-end gap-2">
          <button
            onClick={() => onEdit(faculty.id)}
            className="px-3 py-1 rounded border border-[#3A3A38] bg-[#1F1F1E] text-[11px] text-[#ECECEA] hover:bg-[#2C2C2A]"
          >
            Edit
          </button>

          <button
            onClick={() => setConfirmAction("delete")}
            className="px-3 py-1 rounded border border-red-500/20 bg-red-500/10 text-[11px] text-red-400 hover:bg-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-6">
            <p className="mt-2 text-[13px] text-[#8C8C8A]">
              {`Are you sure you want to delete "${faculty.name}"? This action cannot be undone.`}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="text-[13px] text-[#8C8C8A] hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirm}
                className={`rounded-md px-4 py-2 text-[13px] ${
                  confirmAction === "delete"
                    ? "border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    : "border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
