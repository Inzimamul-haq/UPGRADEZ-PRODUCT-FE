"use client";

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { SkeletonList, ChatRowSkeleton } from '@/components/ui/Skeletons';
import { LoadingNext } from '@/components/ui/LoadingNext';
import api from '@/lib/api';

const SCROLL_THRESHOLD_PX = 10;

/** Strip trailing date suffix and exam type suffix from chat titles. */
function stripSuffixes(title: string, examType: string): string {
  let cleaned = title.replace(/\s*\(\d{1,2}\/\d{1,2}\/\d{4}\)\s*$/, '').trim();
  if (examType) {
    const examTypeRegex = new RegExp(`\\s*[-–]\\s*${examType}\\s*$`, 'i');
    cleaned = cleaned.replace(examTypeRegex, '').trim();
  }
  return cleaned;
}

const ChatRow = memo(({
  session,
  isCurrentChat,
  isPressed,
  isMenuOpen,
  isRenaming,
  renameValue,
  isRenamingApi,
  onPress,
  onClick,
  onRenameSubmit,
  onRenameCancel,
  onRenameChange,
  onRenameStart,
  onDeleteRequest,
  onMenuToggle,
  menuRef,
}: any) => {
  const touchStartY = useRef<number | null>(null);
  const didScroll = useRef(false);
  const suppressClick = useRef(false);

  const resetTouchState = () => {
    touchStartY.current = null;
    didScroll.current = false;
    onPress(null);
  };

  return (
    <div
      onMouseDown={() => onPress(session.id)}
      onTouchStart={(e) => {
        touchStartY.current = e.touches[0].clientY;
        didScroll.current = false;
        onPress(session.id);
      }}
      onTouchMove={(e) => {
        if (touchStartY.current === null) return;
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
        if (deltaY > SCROLL_THRESHOLD_PX) {
          didScroll.current = true;
          onPress(null);
        }
      }}
      onTouchEnd={() => {
        if (!didScroll.current) {
          suppressClick.current = true;
          onClick(session);
        }
        resetTouchState();
      }}
      onTouchCancel={resetTouchState}
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        onClick(session);
      }}
      className={`group relative flex cursor-pointer select-none items-center justify-between rounded-md px-2 py-2 transition-colors duration-150 [-webkit-touch-callout:none] [-webkit-user-select:none] ${isCurrentChat ? 'bg-[#333331]' : 'hover:bg-[#333331]'}`}
    >
      <div className="min-w-0 flex-1">
        {isRenaming ? (
          <div className="flex items-center gap-1 w-full">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onRenameSubmit(session.id);
                }
                if (e.key === 'Escape') onRenameCancel();
              }}
              disabled={isRenamingApi}
              className="w-full bg-[#1C1C1B] text-[13px] text-white border border-amber-500/50 rounded px-1.5 py-0.5 outline-none"
            />
            <button
              onClick={(e) => { e.stopPropagation(); onRenameSubmit(session.id); }}
              className="flex-shrink-0 px-2 py-1 text-[10px] font-medium text-emerald-500 hover:text-emerald-400 transition-colors bg-[#2C2C2A] rounded border border-[#3A3A38]"
            >
              Save
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRenameCancel(); }}
              className="flex-shrink-0 px-2 py-1 text-[10px] font-medium text-red-400 hover:text-red-300 transition-colors bg-[#2C2C2A] rounded border border-[#3A3A38]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <p className={`truncate text-[13px] ${isCurrentChat ? 'font-medium text-white' : 'text-[#ECECEA]'}`}>
              {stripSuffixes(session.subject_name, session.exam_type)}
            </p>
            <p className="text-[11px] text-[#5A5A58]">
              {session.exam_type}
            </p>
          </>
        )}
      </div>
      {!isRenaming && (
        <div className="relative ml-1 flex flex-shrink-0 items-center justify-center">
          <button
            onClick={e => {
              e.stopPropagation();
              onMenuToggle(session.id);
            }}
            className={`flex items-center justify-center text-[#5A5A58] transition-all duration-200 ease-out hover:text-[#ECECEA]
            ${isPressed || isMenuOpen
                ? 'scale-100 opacity-100'
                : 'md:pointer-events-none md:scale-75 md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:scale-100 md:group-hover:opacity-100'
              }`}
          >
            <MoreVertical size={14} />
          </button>

          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-6 z-[100] w-32 rounded-md border border-[#3A3A38] bg-[#1C1C1B] p-1 shadow-lg shadow-black/50"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameStart(session);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12px] text-[#D1D1C7] hover:bg-[#333331] hover:text-white"
              >
                <Pencil size={12} />
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRequest(session);
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
});

export function SidebarRecentChats() {
  const { 
    sessions, 
    requestDelete, 
    refreshSessions, 
    sessionsLoading, 
    selectedMonth,
    loadMoreSessions,
    hasMoreSessions,
    isFetchingMore
  } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  const currentChatId = pathname?.split('/').filter(Boolean).pop() ?? null;

  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenamingApi, setIsRenamingApi] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMoreSessions || sessionsLoading) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingMore) {
        loadMoreSessions();
      }
    }, { root: scrollRef.current, rootMargin: '200px' });

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMoreSessions, isFetchingMore, loadMoreSessions, sessionsLoading]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRowPress = useCallback((id: string | number | null) => {
    if (renamingId || menuOpenId) return;
    setActiveId(id);
  }, [renamingId, menuOpenId]);

  const handleRowClick = useCallback((session: typeof sessions[number]) => {
    router.push(`/chat/${session.id}`);
  }, [router]);

  const submitRename = useCallback(async (id: string) => {
    if (!renameValue.trim() || isRenamingApi) {
      setRenamingId(null);
      return;
    }
    try {
      setIsRenamingApi(true);
      await api.patch(`/api/chats/${id}`, { title: renameValue });
      refreshSessions();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRenamingApi(false);
      setRenamingId(null);
    }
  }, [renameValue, isRenamingApi, refreshSessions]);

  const onRenameStart = useCallback((session: typeof sessions[number]) => {
    setRenamingId(session.id);
    setRenameValue(session.subject_name);
    setMenuOpenId(null);
  }, []);

  const onRenameCancel = useCallback(() => {
    setRenamingId(null);
  }, []);

  const onMenuToggle = useCallback((id: string) => {
    setMenuOpenId(prev => (prev === id ? null : id));
  }, []);

  const onDeleteRequest = useCallback((session: typeof sessions[number]) => {
    requestDelete(session);
    setMenuOpenId(null);
  }, [requestDelete]);

  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden px-2">
      {sessions.length > 0 && !sessionsLoading && (
        <p className="mb-2 flex-shrink-0 px-2 text-[10px] uppercase tracking-widest text-[#5A5A58]">
          Recents
        </p>
      )}
      <div ref={scrollRef} className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [touch-action:pan-y]">
        <div className="flex flex-col gap-0.5 pb-1">
          {sessionsLoading ? (
            <SkeletonList count={6} Row={ChatRowSkeleton} />
          ) : (
            <>
              {sessions.map(session => (
                <ChatRow
                  key={session.id}
                  session={session}
                  isCurrentChat={currentChatId === session.id.toString()}
                  isPressed={activeId === session.id}
                  isMenuOpen={menuOpenId === session.id}
                  isRenaming={renamingId === session.id}
                  renameValue={renameValue}
                  isRenamingApi={isRenamingApi}
                  onPress={handleRowPress}
                  onClick={handleRowClick}
                  onRenameSubmit={submitRename}
                  onRenameCancel={onRenameCancel}
                  onRenameChange={setRenameValue}
                  onRenameStart={onRenameStart}
                  onDeleteRequest={onDeleteRequest}
                  onMenuToggle={onMenuToggle}
                  menuRef={menuOpenId === session.id ? menuRef : null}
                />
              ))}
              {hasMoreSessions && (
                <div ref={sentinelRef} className="min-h-[48px]">
                  {isFetchingMore && <LoadingNext showEndOfList={false} hasMore={true} />}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
