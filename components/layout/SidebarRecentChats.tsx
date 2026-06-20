"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { relativeTime } from '@/lib/utils';

export function SidebarRecentChats() {
  const { sessions, requestDelete } = useSidebar();
  const router = useRouter();

  return (
    <div className="flex-1 overflow-y-auto px-2 mt-3 scrollbar-hide">
      {sessions.length > 0 && (
        <p className="text-[10px] text-[#5A5A58] uppercase tracking-widest px-2 mb-2">
          Recents
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {sessions.slice(0, 10).map(session => (
          <div
            key={session.id}
            onClick={() => router.push(`/chat/${session.id}`)}
            className="group flex items-center justify-between px-2 py-2 rounded-md hover:bg-[#333331] cursor-pointer transition-colors duration-150"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#ECECEA] truncate">{session.subject_name}</p>
              <p className="text-[11px] text-[#5A5A58]">
                {session.exam_type} · {relativeTime(session.created_at)}
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); requestDelete(session); }}
              className="hidden group-hover:flex items-center justify-center text-[#5A5A58] hover:text-red-400 flex-shrink-0 ml-1 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
