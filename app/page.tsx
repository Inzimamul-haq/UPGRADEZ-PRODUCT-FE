"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const roleToPath = (role: string) => {
  if (role === 'super_admin') return '/super-admin/dashboard';
  return `/${role}/dashboard`;
};

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user) {
      router.replace(roleToPath(user.role));
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Dark placeholder — matches app bg so there's zero flash while auth resolves
  return <div style={{ minHeight: '100dvh', backgroundColor: '#1C1C1B' }} />;
}
