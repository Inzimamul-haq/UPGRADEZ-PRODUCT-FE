"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { relativeTime } from '@/lib/utils';

export function SidebarRecentChats() {
  const { sessions, requestDelete } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  // Route-structure agnostic: grabs the last non-empty path segment,
  // regardless of whether the folder's dynamic param is [id], [chatId], etc.
  // Works consistently across every role's route folder.
  const currentChatId = pathname?.split('/').filter(Boolean).pop() ?? null;

  const [activeId, setActiveId] = useState<string | number | null>(null);

  const handleRowPress = (session: typeof sessions[number]) => {
    setActiveId(session.id);
  };

  const handleRowClick = (session: typeof sessions[number]) => {
    router.push(`/chat/${session.id}`);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-2 mt-3 sidebar-scroll overscroll-contain [-webkit-overflow-scrolling:touch] touch-pan-y">
      {sessions.length > 0 && (
        <p className="text-[10px] text-[#5A5A58] uppercase tracking-widest px-2 mb-2">
          Recents
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {sessions.slice(0, 10).map(session => {
          const isPressed = activeId === session.id;
          const isCurrentChat = currentChatId === session.id.toString();

          return (
            <div
              key={session.id}
              onMouseDown={() => handleRowPress(session)}
              onTouchStart={() => handleRowPress(session)}
              onClick={() => handleRowClick(session)}
              className={`group flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-colors duration-150 select-none [-webkit-touch-callout:none] [-webkit-user-select:none] ${isCurrentChat ? 'bg-[#333331]' : 'hover:bg-[#333331]'
                }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] truncate ${isCurrentChat ? 'text-white font-medium' : 'text-[#ECECEA]'}`}>
                  {session.subject_name}
                </p>
                <p className="text-[11px] text-[#5A5A58]">
                  {session.exam_type} · {relativeTime(session.created_at)}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); requestDelete(session); }}
                className={`flex items-center justify-center text-[#5A5A58] hover:text-red-400 flex-shrink-0 ml-1 transition-all duration-200 ease-out
                  ${isPressed
                    ? 'opacity-100 scale-100 pointer-events-auto'
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