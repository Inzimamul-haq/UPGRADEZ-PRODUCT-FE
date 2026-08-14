"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { relativeTime } from '@/lib/utils';

export function SidebarRecentChats() {
  const { sessions, requestDelete } = useSidebar();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | number | null>(null);

  const handleRowPress = (session: typeof sessions[number]) => {
    // Reveal the X immediately (animates in on tap/press)
    setActiveId(session.id);
  };

  const handleRowClick = (session: typeof sessions[number]) => {
    router.push(`/chat/${session.id}`);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-2 mt-3 sidebar-scroll">
      {sessions.length > 0 && (
        <p className="text-[10px] text-[#5A5A58] uppercase tracking-widest px-2 mb-2">
          Recents
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {sessions.slice(0, 10).map(session => {
          const isActive = activeId === session.id;
          return (
            <div
              key={session.id}
              onMouseDown={() => handleRowPress(session)}
              onTouchStart={() => handleRowPress(session)}
              onClick={() => handleRowClick(session)}
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
                className={`flex items-center justify-center text-[#5A5A58] hover:text-red-400 flex-shrink-0 ml-1 transition-all duration-200 ease-out
                  ${isActive
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-75 pointer-events-none md:group-hover:opacity-100 md:group-hover:scale-100 md:group-hover:pointer-events-auto'
                  }`}
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}