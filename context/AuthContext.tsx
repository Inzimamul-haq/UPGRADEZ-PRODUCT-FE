"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  role: User['role'] | null;
  questionsToday: number;
  setUser: (user: User | null) => void;
  setQuestionsToday: (count: number) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [questionsToday, setQuestionsToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const roleToRoute = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'super-admin';
      default:
        return role;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const isPublicRoute = pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/super-admin-register');
      try {
        const res = await api.get('/api/auth/me');

        const data = res.data;
        setUser(data.user);

        if (isPublicRoute) {
          router.push(`/${data.user.role}/dashboard`);
        } else if (
          // Faculty without department: always redirect to onboarding (no skip)
          (data.user?.role === 'faculty' && !data.user?.department?.id && !pathname?.startsWith('/onboarding')) ||
          // Student with incomplete profile: redirect unless skipped
          (data.user?.role === 'student' &&
            !data.user?.year &&
            !data.user?.department?.id &&
            !pathname?.startsWith('/onboarding') &&
            !localStorage.getItem('onboardingSkipped'))
        ) {
          router.push('/onboarding');
        } else {
          // Role based restriction
          const pathSegments = pathname?.split('/') || [];
          const topLevelRoute = pathSegments[1];
          const userPrefix = roleToRoute(data.user.role);
          
          let isAllowed = topLevelRoute === userPrefix;

          // Super-admin can access admin shared UI
          if (topLevelRoute === 'admin' && userPrefix === 'super-admin') {
            isAllowed = true;
          }

          if (topLevelRoute && ['student', 'faculty', 'admin', 'super-admin'].includes(topLevelRoute) && !isAllowed) {
            router.push(`/${userPrefix}/dashboard`);
          }
        }
      } catch (err) {
        if (!isPublicRoute) router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [pathname, router]);

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {}
    setUser(null);
    router.push('/login');
  };

  const role = user?.role ?? null;

  return (
    <AuthContext.Provider value={{ user, role, questionsToday, setUser, setQuestionsToday, logout, loading }}>
      {!loading && children}
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
