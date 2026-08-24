"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X, MoreVertical, Pencil, Trash2, Check } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { relativeTime } from '@/lib/utils';
import api from '@/lib/api';

const SCROLL_THRESHOLD_PX = 10;

export function SidebarRecentChats() {
  const { sessions, requestDelete, refreshSessions } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  // Route-structure agnostic: grabs the last non-empty path segment,
  // regardless of whether the folder's dynamic param is [id], [chatId], etc.
  // Works consistently across every role's route folder.
  const currentChatId = pathname?.split('/').filter(Boolean).pop() ?? null;

  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenamingApi, setIsRenamingApi] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const didScroll = useRef(false);
  const suppressClick = useRef(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRowPress = (session: typeof sessions[number]) => {
    if (renamingId || menuOpenId) return;
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

  const submitRename = async (id: string) => {
    if (!renameValue.trim() || isRenamingApi) {
      setRenamingId(null);
      return;
    }
    try {
      setIsRenamingApi(true);
      await api.patch(`/api/chats/${id}`, { title: renameValue });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRenamingApi(false);
      setRenamingId(null);
    }
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
                className={`group relative flex cursor-pointer select-none items-center justify-between rounded-md px-2 py-2 transition-colors duration-150 [-webkit-touch-callout:none] [-webkit-user-select:none] ${isCurrentChat ? 'bg-[#333331]' : 'hover:bg-[#333331]'
                  }`}
              >
                <div className="min-w-0 flex-1">
                  {renamingId === session.id ? (
                    <div className="flex items-center gap-1 w-full">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            submitRename(session.id);
                            refreshSessions();
                          }
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        disabled={isRenamingApi}
                        className="w-full bg-[#1C1C1B] text-[13px] text-white border border-amber-500/50 rounded px-1.5 py-0.5 outline-none"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); submitRename(session.id); refreshSessions(); }}
                        className="flex-shrink-0 px-2 py-1 text-[10px] font-medium text-emerald-500 hover:text-emerald-400 transition-colors bg-[#2C2C2A] rounded border border-[#3A3A38]"
                      >
                        Save
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRenamingId(null); }}
                        className="flex-shrink-0 px-2 py-1 text-[10px] font-medium text-red-400 hover:text-red-300 transition-colors bg-[#2C2C2A] rounded border border-[#3A3A38]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={`truncate text-[13px] ${isCurrentChat ? 'font-medium text-white' : 'text-[#ECECEA]'}`}>
                        {session.subject_name}
                      </p>
                      <p className="text-[11px] text-[#5A5A58]">
                        {session.exam_type}
                      </p>
                    </>
                  )}
                </div>
                {!renamingId && (
                  <div className="relative ml-1 flex flex-shrink-0 items-center justify-center">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === session.id ? null : session.id);
                      }}
                      className={`flex items-center justify-center text-[#5A5A58] transition-all duration-200 ease-out hover:text-[#ECECEA]
                      ${isPressed || menuOpenId === session.id
                          ? 'pointer-events-auto scale-100 opacity-100'
                          : 'pointer-events-none scale-75 opacity-0 md:group-hover:pointer-events-auto md:group-hover:scale-100 md:group-hover:opacity-100'
                        }`}
                    >
                      <MoreVertical size={14} />
                    </button>

                    {menuOpenId === session.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-6 z-[100] w-32 rounded-md border border-[#3A3A38] bg-[#1C1C1B] p-1 shadow-lg shadow-black/50"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingId(session.id);
                            setRenameValue(session.subject_name);
                            setMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12px] text-[#D1D1C7] hover:bg-[#333331] hover:text-white"
                        >
                          <Pencil size={12} />
                          Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDelete(session);
                            setMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12px] text-red-400 hover:bg-red-400/10 hover:text-red-300"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
