"use client";

import React, { useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { relativeTime } from '@/lib/utils';

const SCROLL_THRESHOLD_PX = 10;

export function SidebarRecentChats() {
  const { sessions, requestDelete } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  // Route-structure agnostic: grabs the last non-empty path segment,
  // regardless of whether the folder's dynamic param is [id], [chatId], etc.
  // Works consistently across every role's route folder.
  const currentChatId = pathname?.split('/').filter(Boolean).pop() ?? null;

  const [activeId, setActiveId] = useState<string | number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const didScroll = useRef(false);
  const suppressClick = useRef(false);

  const handleRowPress = (session: typeof sessions[number]) => {
    setActiveId(session.id);
  };

  const handleRowClick = (session: typeof sessions[number]) => {
    router.push(`/chat/${session.id}`);
  };

  const resetTouchState = () => {
    touchStartY.current = null;
    didScroll.current = false;
    setActiveId(null);
  };

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden px-2">
      {sessions.length > 0 && (
        <p className="mb-2 flex-shrink-0 px-2 text-[10px] uppercase tracking-widest text-[#5A5A58]">
          Recents
        </p>
      )}
      <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [touch-action:pan-y]">
        <div className="flex flex-col gap-0.5 pb-1">
          {sessions.map(session => {
            const isPressed = activeId === session.id;
            const isCurrentChat = currentChatId === session.id.toString();

            return (
              <div
                key={session.id}
                onMouseDown={() => handleRowPress(session)}
                onTouchStart={(e) => {
                  touchStartY.current = e.touches[0].clientY;
                  didScroll.current = false;
                  handleRowPress(session);
                }}
                onTouchMove={(e) => {
                  if (touchStartY.current === null) return;
                  const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
                  if (deltaY > SCROLL_THRESHOLD_PX) {
                    didScroll.current = true;
                    setActiveId(null);
                  }
                }}
                onTouchEnd={() => {
                  if (!didScroll.current) {
                    suppressClick.current = true;
                    handleRowClick(session);
                  }
                  resetTouchState();
                }}
                onTouchCancel={resetTouchState}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  handleRowClick(session);
                }}
                className={`group flex cursor-pointer select-none items-center justify-between rounded-md px-2 py-2 transition-colors duration-150 [-webkit-touch-callout:none] [-webkit-user-select:none] ${isCurrentChat ? 'bg-[#333331]' : 'hover:bg-[#333331]'
                  }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[13px] ${isCurrentChat ? 'font-medium text-white' : 'text-[#ECECEA]'}`}>
                    {session.subject_name}
                  </p>
                  <p className="text-[11px] text-[#5A5A58]">
                    {session.exam_type} · {relativeTime(session.created_at)}
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); requestDelete(session); }}
                  className={`ml-1 flex flex-shrink-0 items-center justify-center text-[#5A5A58] transition-all duration-200 ease-out hover:text-red-400
                  ${isPressed
                      ? 'pointer-events-auto scale-100 opacity-100'
                      : 'pointer-events-none scale-75 opacity-0 md:group-hover:pointer-events-auto md:group-hover:scale-100 md:group-hover:opacity-100'
                    }`}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
