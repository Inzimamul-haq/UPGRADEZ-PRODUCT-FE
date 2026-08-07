"use client";

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { PanelLeft } from 'lucide-react';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { AppShellProps } from '@/lib/types';



function SearchModal() {
  const { isSearchOpen, closeSearch, sessions, availableMonths, selectedMonth, setSelectedMonth } = useSidebar();
  const [query, setQuery] = useState('');
  const router = useRouter();

  if (!isSearchOpen) return null;

  /** Format "YYYY-MM" → "Jul 2026" */
  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const filtered = sessions.filter(s =>
    s.subject_name.toLowerCase().includes(query.toLowerCase()) ||
    s.exam_type.toLowerCase().includes(query.toLowerCase())
  );

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

        {/* Month filter chips */}
        {availableMonths.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#3A3A38] overflow-x-auto scrollbar-hide">
            <span className="text-[10px] text-[#5A5A58] uppercase tracking-wider flex-shrink-0 mr-1">Month</span>
            {availableMonths.map(ym => {
              const isActive = selectedMonth === ym;
              return (
                <button
                  key={ym}
                  onClick={() => setSelectedMonth(isActive ? null : ym)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 ${
                    isActive
                      ? 'bg-[#ECECEA] text-[#1C1C1B] border-[#ECECEA]'
                      : 'text-[#8C8C8A] border-[#3A3A38] hover:border-[#5A5A58] hover:text-[#ECECEA]'
                  }`}
                >
                  {formatMonthLabel(ym)}
                </button>
              );
            })}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[42vh] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="text-[13px] text-[#5A5A58] text-center py-8">
              {selectedMonth ? 'No chats in this month' : 'No chats found'}
            </p>
          )}
          {filtered.map(session => {
            const sessionMonth = session.created_at
              ? new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : null;
            return (
              <button
                key={session.id}
                onClick={() => { closeSearch(); router.push(`/chat/${session.id}`); }}
                className="w-full text-left px-4 py-3 hover:bg-[#333331] transition-colors"
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
          &ldquo;{pendingDelete.subject_name} — {pendingDelete.exam_type}&rdquo; will be permanently deleted.
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
      <main className={`flex-1 flex flex-col overflow-y-auto h-full relative w-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-[240px]' : 'md:ml-0'}`}>
        {/* Open toggle — only visible when sidebar is closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-50 text-[#8C8C8A] hover:text-[#ECECEA] transition-colors"
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
