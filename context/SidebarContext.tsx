"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatSession } from '@/lib/types';

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
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

const DUMMY_SESSIONS: ChatSession[] = [];

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>(DUMMY_SESSIONS);
  const router = useRouter();
  const pathname = usePathname();

  const fetchSessions = () => {
    api.get('/api/chats').then(res => {
      if (res.data.success) {
        setSessions(res.data.data.map((c: any) => ({
          id: c.id,
          subject_name: c.subject?.name || c.title,
          exam_type: c.examType,
          created_at: c.createdAt
        })));
      }
    }).catch(console.error);
  };

  React.useEffect(() => {
    fetchSessions();
  }, []);

  const removeSession = async (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    // If the user is currently viewing the deleted chat, redirect to new chat
    if (pathname === `/chat/${id}`) {
      router.push('/chat/new');
    }
    try {
      await api.delete(`/api/chats/${id}`);
    } catch(err) {
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
      refreshSessions: fetchSessions,
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
