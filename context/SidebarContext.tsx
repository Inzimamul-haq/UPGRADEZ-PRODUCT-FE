"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ChatSession } from '@/lib/types';
import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarContextValue {
  openSearch: () => void;
  closeSearch: () => void;
  isSearchOpen: boolean;
  pendingDelete: ChatSession | null;
  requestDelete: (session: ChatSession) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  sessions: ChatSession[];
  removeSession: (id: string) => void;
  refreshSessions: () => void;
  /** Available months (YYYY-MM) derived from chat history */
  availableMonths: string[];
  /** Currently active month filter (YYYY-MM), null = no filter */
  selectedMonth: string | null;
  setSelectedMonth: (month: string | null) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonthState] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  /** Fetch sessions, optionally filtered by YYYY-MM month string */
  const fetchSessions = useCallback((month?: string | null) => {
    const params = month ? `?month=${month}` : '';
    api.get(`/api/chats${params}`).then(res => {
      if (res.data.success) {
        setSessions(res.data.data.map((c: any) => {
          const rawTitle = c.title || c.subject?.name || 'Untitled';
          const cleanTitle = rawTitle.replace(/\s*\(\d{1,2}\/\d{1,2}\/\d{4}\)\s*$/, '').trim();
          return {
            id: c.id,
            subject_name: cleanTitle,
            exam_type: c.examType,
            created_at: c.createdAt,
          };
        }));
      }
    }).catch(console.error);
  }, []);

  /** Fetch distinct months from BE once on mount */
  const fetchMonths = useCallback(() => {
    api.get('/api/chats/months').then(res => {
      if (res.data.success) setAvailableMonths(res.data.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchSessions(null);
    fetchMonths();
  }, []);

  const setSelectedMonth = useCallback((month: string | null) => {
    setSelectedMonthState(month);
    fetchSessions(month);
  }, [fetchSessions]);

  const removeSession = async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (pathname === `/chat/${id}`) router.push('/chat/new');
    try {
      await api.delete(`/api/chats/${id}`);
      fetchMonths(); // refresh months in case last chat of a month was deleted
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = () => {
    if (pendingDelete) removeSession(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <SidebarContext.Provider value={{
      isSearchOpen,
      openSearch: () => setIsSearchOpen(true),
      closeSearch: () => setIsSearchOpen(false),
      pendingDelete,
      requestDelete: (s) => setPendingDelete(s),
      confirmDelete,
      cancelDelete: () => setPendingDelete(null),
      sessions,
      removeSession,
      refreshSessions: () => { fetchSessions(selectedMonth); fetchMonths(); },
      availableMonths,
      selectedMonth,
      setSelectedMonth,
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside SidebarProvider');
  return ctx;
}
