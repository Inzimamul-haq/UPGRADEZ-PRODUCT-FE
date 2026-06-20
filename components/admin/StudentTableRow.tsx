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
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  return (
    <div className="flex items-center px-4 py-3 border-t border-[#2E2E2C] hover:bg-[#2C2C2A] min-w-[800px] relative">
      <div className="w-[20%] text-[13px] text-[#ECECEA] truncate pr-2">{student.name}</div>
      <div className="w-[25%] text-[13px] text-[#8C8C8A] truncate pr-2">{student.email}</div>
      <div className="w-[10%] text-[13px] text-[#8C8C8A]">{student.year}</div>
      <div className="w-[10%] text-[13px] text-[#8C8C8A]">{student.branch}</div>
      <div className="w-[10%] text-[13px] text-[#8C8C8A]">{student.section || '-'}</div>
      <div className="w-[10%] text-[13px] text-[#8C8C8A]">{student.joined}</div>
      <div className="w-[15%] flex justify-end items-center gap-3">
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-[#1F1F1E] border border-[#3A3A38] rounded-lg p-6 max-w-sm w-full">
              <h2 className="text-[14px] font-medium text-[#ECECEA] mb-2">Delete Student</h2>
              <p className="text-[12px] text-[#8C8C8A] mb-6">Are you sure you want to delete {student.name}? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowConfirmDelete(false)}
                  className="text-[13px] text-[#5A5A58] hover:text-[#8C8C8A] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => onDelete(student.id)}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-md px-4 py-1.5 text-[13px] hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        
        <Shield 
          size={14} 
          className="text-[#5A5A58] hover:text-[#ECECEA] cursor-pointer" 
          onClick={() => setShowPromoteModal(true)}
        />
        
        {showPromoteModal && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-[#1F1F1E] border border-[#3A3A38] rounded-lg p-6 max-w-sm w-full">
              <h2 className="text-[14px] font-medium text-[#ECECEA] mb-2">Promote User</h2>
              <p className="text-[12px] text-[#8C8C8A] mb-6">Select a new role for {student.name}.</p>
              <div className="flex flex-col gap-2 mb-6">
                <button 
                  onClick={() => { onPromote(student.id, 'faculty'); setShowPromoteModal(false); }}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-4 py-2 text-[13px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
                >
                  Promote to Faculty
                </button>
                <button 
                  onClick={() => { onPromote(student.id, 'admin'); setShowPromoteModal(false); }}
                  className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-md px-4 py-2 text-[13px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
                >
                  Promote to Admin
                </button>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowPromoteModal(false)}
                  className="text-[13px] text-[#5A5A58] hover:text-[#8C8C8A] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <Trash2 
          size={14} 
          className="text-[#5A5A58] hover:text-red-400 cursor-pointer" 
          onClick={() => setShowConfirmDelete(true)} 
        />
      </div>
    </div>
  );
}
