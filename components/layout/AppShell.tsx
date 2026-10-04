"use client";

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { PanelLeft } from 'lucide-react';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useRouter } from 'next/navigation';
import { Search, X, ChevronDown } from 'lucide-react';
import { AppShellProps } from '@/lib/types';
import api from '@/lib/api';
import React from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { LoadingNext } from '@/components/ui/LoadingNext';



function SearchModal() {
  const { isSearchOpen, closeSearch, availableMonths, selectedMonth, setSelectedMonth } = useSidebar();
  const [query, setQuery] = useState('');
  const router = useRouter();

  if (!isSearchOpen) return null;

  /** Format "YYYY-MM" → "Jul 2026" */
  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const debouncedQuery = useDebouncedValue(query, 250);

  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchSearch = React.useCallback(async (q: string, month: string | null, cursor?: string | null) => {
    const isLoadMore = !!cursor;
    if (isLoadMore) setIsFetchingMore(true);
    else setIsSearching(true);
    
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (month) params.append('month', month);
    if (cursor) params.append('cursor', cursor);
    params.append('limit', '20');
    
    try {
      const res = await api.get(`/api/chats/search?${params.toString()}`);
      if (res.data.success) {
        const items = res.data.data.items.map((c: any) => {
          const rawTitle = c.title || c.subject?.name || 'Untitled';
          const cleanTitle = rawTitle.replace(/\s*\(\d{1,2}\/\d{1,2}\/\d{4}\)\s*$/, '').trim();
          return {
            id: c.id,
            subject_name: cleanTitle,
            exam_type: c.examType,
            created_at: c.createdAt,
          };
        });
        
        if (isLoadMore) {
          setResults(prev => [...prev, ...items]);
        } else {
          setResults(items);
        }
        setNextCursor(res.data.data.nextCursor);
        setHasMore(res.data.data.hasMore);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
      setIsFetchingMore(false);
    }
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      fetchSearch(debouncedQuery, selectedMonth, null);
    }
  }, [debouncedQuery, selectedMonth, isSearchOpen, fetchSearch]);

  const resultsRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || isSearching || !isSearchOpen) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingMore && nextCursor) {
        fetchSearch(debouncedQuery, selectedMonth, nextCursor);
      }
    }, { root: resultsRef.current, rootMargin: '200px' });

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, fetchSearch, debouncedQuery, selectedMonth, nextCursor, isSearching, isSearchOpen]);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm" onClick={closeSearch}>
      <div className="w-full max-w-lg bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl shadow-2xl overflow-hidden mx-4" onClick={e => e.stopPropagation()}>
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#3A3A38]">
          <Search size={16} className="text-[#5A5A58] flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && closeSearch()}
            placeholder="Search chats..."
            className="flex-1 bg-transparent text-[14px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none"
          />
          <button onClick={closeSearch} className="text-[#5A5A58] hover:text-[#8C8C8A] transition-colors"><X size={16} /></button>
        </div>

        {/* Month filter select */}
        {availableMonths.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3A3A38]">
            <span className="text-[11px] text-[#5A5A58] uppercase tracking-wider font-medium">Filter by Month</span>
            <div className="relative">
              <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(e.target.value || null)}
                className="appearance-none bg-[#1C1C1B] hover:bg-[#2C2C2A] transition-colors border border-[#3A3A38] text-[#ECECEA] text-[13px] rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-[#5A5A58] cursor-pointer shadow-sm"
              >
                <option value="">All Months</option>
                {availableMonths.map(ym => (
                  <option key={ym} value={ym}>{formatMonthLabel(ym)}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C8C8A] pointer-events-none" />
            </div>
          </div>
        )}

        {/* Results */}
        <div ref={resultsRef} className="max-h-[42vh] overflow-y-auto py-1">
          {isSearching ? (
            <p className="text-[13px] text-[#5A5A58] text-center py-8">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-[13px] text-[#5A5A58] text-center py-8">
              {selectedMonth ? 'No chats in this month' : 'No chats found'}
            </p>
          ) : (
            <>
              {results.map(session => {
                const sessionMonth = session.created_at
                  ? new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : null;
                return (
                  <button
                    key={session.id}
                    onClick={() => { closeSearch(); router.push(`/chat/${session.id}`); }}
                    className="w-full text-left px-4 py-3 hover:bg-[#333331] transition-colors min-h-[40px]"
                  >
                    <p className="text-[14px] text-[#ECECEA]">{session.subject_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[12px] text-[#8C8C8A]">{session.exam_type}</p>
                      {sessionMonth && (
                        <span className="text-[10px] text-[#5A5A58]">· {sessionMonth}</span>
                      )}
                    </div>
                  </button>
                );
              })}
              {hasMore && (
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

function DeleteModal() {
  const { pendingDelete, confirmDelete, cancelDelete } = useSidebar();
  if (!pendingDelete) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={cancelDelete}>
      <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl p-6 w-[340px] shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
        <p className="text-[16px] font-medium text-[#ECECEA] mb-1">Delete chat?</p>
        <p className="text-[13px] text-[#8C8C8A] mb-6 leading-relaxed">
          &ldquo;{pendingDelete.subject_name} will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button onClick={cancelDelete} className="flex-1 border border-[#3A3A38] rounded-xl py-2.5 text-[13px] text-[#8C8C8A] hover:bg-[#333331] transition-colors">Cancel</button>
          <button onClick={confirmDelete} className="flex-1 bg-red-500 rounded-xl py-2.5 text-[13px] font-medium text-white hover:bg-red-600 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  )
}

function AppShellInner({ children, role, navItems }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Keep-alive ping: prevent backend from going cold between user sessions.
  // Fires every 14 minutes while the user has the app open.
  useEffect(() => {
    const FOURTEEN_MIN = 14 * 60 * 1000;
    const interval = setInterval(() => {
      api.get('/health').catch(() => { }); // silent best-effort
    }, FOURTEEN_MIN);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  return (
    <div className="flex h-[100dvh] bg-[#1C1C1B] overflow-hidden">
      {/* Sidebar — fixed overlay, never shifts main content */}
      <Sidebar
        role={role}
        navItems={navItems}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main content — smoothly expands to full width when sidebar is closed */}
      <main
        id="app-main"
        className={`flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain relative w-full transition-all duration-300 ease-in-out pt-[var(--safe-top)] bg-[#1C1C1B] pb-[calc(4rem+var(--safe-bottom))] md:pb-0 ${isSidebarOpen ? 'md:ml-[240px]' : 'md:ml-0'}`}      >        {/* Open toggle — only visible when sidebar is closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-[calc(1rem+var(--safe-top))] left-4 z-50 text-[#8C8C8A] hover:text-[#ECECEA] transition-colors"
          >
            <PanelLeft size={20} />
          </button>
        )}
        {children}
      </main>

      <SearchModal />
      <DeleteModal />
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellInner {...props} />
    </SidebarProvider>
  );
}
