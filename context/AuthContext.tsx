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
  const [isCollegeInactive, setIsCollegeInactive] = useState(false);

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

        // Check if college is inactive
        if (data.user?.college?.isActive === false && data.user.role !== 'super_admin') {
          setIsCollegeInactive(true);
          setLoading(false);
          return;
        }

        if (isPublicRoute) {
          const userPrefix = roleToRoute(data.user.role);
          router.push(`/${userPrefix}/dashboard`);
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
    // Best-effort: unregister this device's FCM token before clearing session
    try {
      const { getToken } = await import('firebase/messaging');
      const { messaging } = await import('@/lib/firebase');
      if (messaging && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (token) {
          await api.delete('/api/notifications/fcm-token', { data: { token } });
        }
      }
    } catch (_) { /* best-effort — never block logout */ }

    try {
      await api.post('/api/auth/logout');
    } catch (e) {}
    setUser(null);
    router.push('/login');
  };

  const role = user?.role ?? null;

  if (isCollegeInactive) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1C1C1B] px-4 text-center text-[#ECECEA]">
        <div className="max-w-md rounded-xl border border-[#3A3A38] bg-[#2C2C2A] p-8 shadow-2xl">
          <h1 className="mb-4 text-2xl font-bold text-red-500">Account Suspended</h1>
          <p className="mb-6 text-[#8C8C8A]">
            Your college account is currently suspended or inactive.
          </p>
          <div className="rounded-lg bg-[#1F1F1E] p-4 text-sm text-[#ECECEA]">
            {role === 'admin' ? (
              <p>Please contact the StudyMate owner at <strong>contact@studymate.com</strong> for assistance.</p>
            ) : (
              <p>Please contact your College Administrator for assistance.</p>
            )}
          </div>
          <button
            onClick={logout}
            className="mt-6 w-full rounded-lg bg-[#3A3A38] py-2.5 text-sm font-medium transition-colors hover:bg-[#4A4A48]"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

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
