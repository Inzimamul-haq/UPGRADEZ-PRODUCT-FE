import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { InlineConfirm } from '@/components/ui/InlineConfirm';

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  joined: string;
}

interface FacultyTableRowProps {
  faculty: Faculty;
  onRevoke: (id: string) => void;
  onDemote: (id: string) => void;
}

export function FacultyTableRow({ faculty, onRevoke, onDemote }: FacultyTableRowProps) {
  const [showConfirmAction, setShowConfirmAction] = useState<'revoke' | 'demote' | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="flex items-center px-4 py-3 border-t border-[#2E2E2C] hover:bg-[#2C2C2A] min-w-[800px] relative">
      <div className="w-[25%] text-[13px] text-[#ECECEA] truncate pr-2">{faculty.name}</div>
      <div className="w-[30%] text-[13px] text-[#8C8C8A] truncate pr-2">{faculty.email}</div>
      <div className="w-[20%] text-[13px] text-[#8C8C8A]">{faculty.department}</div>
      <div className="w-[10%] text-[13px] text-[#8C8C8A]">{faculty.joined}</div>
      <div className="w-[15%] flex justify-end items-center gap-3">
        {showConfirmAction === 'revoke' && (
          <InlineConfirm
            message="Revoke access?"
            confirmLabel="Revoke"
            onConfirm={() => onRevoke(faculty.id)}
            onCancel={() => setShowConfirmAction(null)}
          />
        )}
        {showConfirmAction === 'demote' && (
          <InlineConfirm
            message="Demote to Student?"
            confirmLabel="Demote"
            onConfirm={() => onDemote(faculty.id)}
            onCancel={() => setShowConfirmAction(null)}
          />
        )}
        {!showConfirmAction && (
          <div className="relative">
            <MoreVertical 
              size={16} 
              className="text-[#5A5A58] hover:text-[#ECECEA] cursor-pointer" 
              onClick={() => setShowDropdown(!showDropdown)}
            />
            {showDropdown && (
              <div className="absolute right-0 top-6 mt-1 w-36 bg-[#1F1F1E] border border-[#3A3A38] rounded-md shadow-lg z-10 overflow-hidden">
                <button 
                  onClick={() => { setShowConfirmAction('demote'); setShowDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-[12px] text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors"
                >
                  Demote to Student
                </button>
                <button 
                  onClick={() => { setShowConfirmAction('revoke'); setShowDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-[12px] text-red-400 hover:bg-[#2C2C2A] transition-colors"
                >
                  Revoke Access
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
