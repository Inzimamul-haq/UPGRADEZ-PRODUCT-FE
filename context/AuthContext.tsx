"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  role: User['role'] | null;
  questionsToday: number;
  setUser: (user: User | null) => void;
  setQuestionsToday: (count: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [questionsToday, setQuestionsToday] = useState(0);

  const role = user?.role ?? null;

  return (
    <AuthContext.Provider value={{ user, role, questionsToday, setUser, setQuestionsToday }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
