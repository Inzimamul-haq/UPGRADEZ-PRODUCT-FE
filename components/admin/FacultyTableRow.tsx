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

  return (
    <div className="flex items-center px-4 py-3 border-t border-[#2E2E2C] hover:bg-[#2C2C2A] min-w-[800px] relative">
      <div className="w-[25%] text-[13px] text-[#ECECEA] truncate pr-2">{faculty.name}</div>
      <div className="w-[30%] text-[13px] text-[#8C8C8A] truncate pr-2">{faculty.email}</div>
      <div className="w-[20%] text-[13px] text-[#8C8C8A]">{faculty.department}</div>
      <div className="w-[10%] text-[13px] text-[#8C8C8A]">{faculty.joined}</div>
      <div className="w-[15%] flex justify-end items-center gap-3">
        {showConfirmAction && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-[#1F1F1E] border border-[#3A3A38] rounded-lg p-6 max-w-sm w-full">
              <h2 className="text-[14px] font-medium text-[#ECECEA] mb-2">
                {showConfirmAction === 'revoke' ? 'Revoke Access' : 'Demote to Student'}
              </h2>
              <p className="text-[12px] text-[#8C8C8A] mb-6">
                {showConfirmAction === 'revoke' 
                  ? `Are you sure you want to revoke access for ${faculty.name}?` 
                  : `Are you sure you want to demote ${faculty.name} to a student role?`}
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowConfirmAction(null)}
                  className="text-[13px] text-[#5A5A58] hover:text-[#8C8C8A] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (showConfirmAction === 'revoke') onRevoke(faculty.id);
                    if (showConfirmAction === 'demote') onDemote(faculty.id);
                    setShowConfirmAction(null);
                  }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-md px-4 py-1.5 text-[13px] hover:bg-red-500/20 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button 
            onClick={() => setShowConfirmAction('demote')}
            className="text-[11px] text-[#ECECEA] bg-[#1F1F1E] border border-[#3A3A38] rounded px-2 py-1 hover:bg-[#2C2C2A] transition-colors"
          >
            Demote
          </button>
          <button 
            onClick={() => setShowConfirmAction('revoke')}
            className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1 hover:bg-red-500/20 transition-colors"
          >
            Revoke
          </button>
        </div>
      </div>
    </div>
  );
}
