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
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const DUMMY_SESSIONS: ChatSession[] = [
  { id: 'chat1', subject_id: '1', subject_name: 'Data Structures', exam_type: 'CAT 1', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'chat2', subject_id: '2', subject_name: 'Operating Systems', exam_type: 'Model', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'chat3', subject_id: '3', subject_name: 'Computer Networks', exam_type: 'University', created_at: new Date(Date.now() - 172800000).toISOString() },
];

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>(DUMMY_SESSIONS);

  const removeSession = (id: string) => setSessions(prev => prev.filter(s => s.id !== id));

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
