import React, { useState } from 'react';
import { Trash2, Shield } from 'lucide-react';
import { InlineConfirm } from '@/components/ui/InlineConfirm';

interface Student {
  id: string;
  name: string;
  email: string;
  year: string;
  branch: string;
  section?: string;
  joined: string;
}

interface StudentTableRowProps {
  student: Student;
  onDelete: (id: string) => void;
  onPromote: (id: string, role: string) => void;
}

export function StudentTableRow({ student, onDelete, onPromote }: StudentTableRowProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showPromoteDropdown, setShowPromoteDropdown] = useState(false);

  return (
    <div className="flex items-center px-4 py-3 border-t border-[#2E2E2C] hover:bg-[#2C2C2A] min-w-[800px] relative">
      <div className="w-[20%] text-[13px] text-[#ECECEA] truncate pr-2">{student.name}</div>
      <div className="w-[25%] text-[13px] text-[#8C8C8A] truncate pr-2">{student.email}</div>
      <div className="w-[10%] text-[13px] text-[#8C8C8A]">{student.year}</div>
      <div className="w-[10%] text-[13px] text-[#8C8C8A]">{student.branch}</div>
      <div className="w-[10%] text-[13px] text-[#8C8C8A]">{student.section || '-'}</div>
      <div className="w-[10%] text-[13px] text-[#8C8C8A]">{student.joined}</div>
      <div className="w-[15%] flex justify-end items-center gap-3">
        {showConfirmDelete ? (
          <InlineConfirm
            message="Delete?"
            confirmLabel="Delete"
            onConfirm={() => onDelete(student.id)}
            onCancel={() => setShowConfirmDelete(false)}
          />
        ) : (
          <>
            <div className="relative">
              <Shield 
                size={14} 
                className="text-[#5A5A58] hover:text-[#ECECEA] cursor-pointer" 
                onClick={() => setShowPromoteDropdown(!showPromoteDropdown)}
              />
              {showPromoteDropdown && (
                <div className="absolute right-0 top-6 mt-1 w-32 bg-[#1F1F1E] border border-[#3A3A38] rounded-md shadow-lg z-10 overflow-hidden">
                  <button 
                    onClick={() => { onPromote(student.id, 'faculty'); setShowPromoteDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-[12px] text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors"
                  >
                    Promote to Faculty
                  </button>
                  <button 
                    onClick={() => { onPromote(student.id, 'admin'); setShowPromoteDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-[12px] text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors"
                  >
                    Promote to Admin
                  </button>
                </div>
              )}
            </div>
            <Trash2 
              size={14} 
              className="text-[#5A5A58] hover:text-red-400 cursor-pointer" 
              onClick={() => setShowConfirmDelete(true)} 
            />
          </>
        )}
      </div>
    </div>
  );
}
