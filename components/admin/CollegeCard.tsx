import React, { useState } from 'react';
import { InlineConfirm } from '@/components/ui/InlineConfirm';

interface College {
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'expired';
  studentsCount: number;
  tokenUsed: number;
  tokenLimit: number;
  expiresAt: string;
  startDate: string;
}

interface CollegeCardProps {
  college: College;
  isExpandedVariant?: boolean;
  onUpdateLimit?: (id: string, limit: number) => void;
  onUpdateExpiry?: (id: string, date: string) => void;
  onSuspend?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onManage?: (id: string) => void;
}

export function CollegeCard({ 
  college, 
  isExpandedVariant = false,
  onUpdateLimit,
  onUpdateExpiry,
  onSuspend,
  onReactivate,
  onManage
}: CollegeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newLimit, setNewLimit] = useState(college.tokenLimit.toString());
  const [newExpiry, setNewExpiry] = useState(college.expiresAt);

  const formatK = (num: number) => `${Math.floor(num / 1000)}k`;
  
  const statusBadge = {
    active: "border-[#3A3A38] text-[#ECECEA]",
    suspended: "border-red-400 text-red-400",
    expired: "border-[#5A5A58] text-[#5A5A58]"
  }[college.status];

  const pct = Math.min((college.tokenUsed / college.tokenLimit) * 100, 100);
  const isExpiringSoon = new Date(college.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-lg overflow-hidden flex flex-col min-w-[900px]">
      <div className={`flex items-center px-4 py-3 ${isExpandedVariant ? 'cursor-pointer hover:bg-[#333331]' : ''}`}
           onClick={() => isExpandedVariant && setIsExpanded(!isExpanded)}>
        <div className="w-[20%] text-[13px] text-[#ECECEA] font-medium pr-2 truncate">
          {college.name}
        </div>
        <div className="w-[15%]">
          <span className={`text-[11px] border rounded px-2 py-0.5 capitalize ${statusBadge}`}>
            {college.status}
          </span>
        </div>
        <div className="w-[10%] text-[13px] text-[#8C8C8A]">
          {college.studentsCount}
        </div>
        <div className="w-[25%] pr-4">
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-[#8C8C8A]">{formatK(college.tokenUsed)} / {formatK(college.tokenLimit)}</span>
          </div>
          <div className="h-1.5 bg-[#1F1F1E] rounded-full w-full">
            <div
              className="h-full rounded-full transition-all duration-300 bg-[#ECECEA]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className={`w-[20%] text-[13px] ${isExpiringSoon && college.status === 'active' ? 'text-red-400' : 'text-[#8C8C8A]'}`}>
          {college.expiresAt}
        </div>
        <div className="w-[10%] text-right">
          {!isExpandedVariant && onManage && (
            <button onClick={() => onManage(college.id)} className="text-[12px] text-[#8C8C8A] hover:text-[#ECECEA]">
              Manage &rarr;
            </button>
          )}
        </div>
      </div>

      {isExpandedVariant && isExpanded && (
        <div className="bg-[#1F1F1E] border-t border-[#2E2E2C] p-4 text-[13px] text-[#8C8C8A] space-y-4">
          <div>
            <span className="text-[#ECECEA] mr-2">Period:</span> {college.startDate} &rarr; {college.expiresAt}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[#ECECEA]">Token limit:</span>
            <input 
              type="number" 
              value={newLimit} 
              onChange={(e) => setNewLimit(e.target.value)} 
              className="w-24 bg-[#2C2C2A] border border-[#4A4A48] rounded px-2 py-1 text-[#ECECEA] focus:outline-none"
            />
            <button 
              onClick={() => onUpdateLimit && onUpdateLimit(college.id, parseInt(newLimit))}
              className="bg-[#2C2C2A] border border-[#4A4A48] px-3 py-1 rounded text-[#ECECEA] hover:bg-[#333331]"
            >
              Save
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#ECECEA]">Extend to:</span>
            <input 
              type="date" 
              value={newExpiry} 
              onChange={(e) => setNewExpiry(e.target.value)} 
              className="bg-[#2C2C2A] border border-[#4A4A48] rounded px-2 py-1 text-[#ECECEA] focus:outline-none"
            />
            <button 
              onClick={() => onUpdateExpiry && onUpdateExpiry(college.id, newExpiry)}
              className="bg-[#2C2C2A] border border-[#4A4A48] px-3 py-1 rounded text-[#ECECEA] hover:bg-[#333331]"
            >
              Update
            </button>
          </div>

          <div className="pt-2 border-t border-[#2E2E2C]">
            {college.status === 'active' && onSuspend && (
              <InlineConfirm 
                message="Suspend college?" 
                confirmLabel="Suspend" 
                onConfirm={() => onSuspend(college.id)} 
                onCancel={() => {}} 
              />
            )}
            {college.status === 'suspended' && onReactivate && (
              <button 
                onClick={() => onReactivate(college.id)}
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                Reactivate College
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
