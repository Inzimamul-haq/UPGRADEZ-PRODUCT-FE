"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { loginSchema } from '@/Schema/validations';
import { extractErrorMessage } from '@/lib/utils';
import TurnstileWidget, { TurnstileWidgetHandle } from '@/components/TurnstileWidget';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const turnstileRef = React.useRef<TurnstileWidgetHandle>(null);

  const [collegeData, setCollegeData] = useState<{ collegeId: string; collegeName: string; bannerUrl?: string | null; logoUrl?: string | null } | null>(null);

  useEffect(() => {
    if (captchaToken) {
      setCaptchaToken('');
      turnstileRef.current?.reset();
    }
  }, [email, password]);

  useEffect(() => {
    if (searchParams?.get('error') === 'missing_access_code') {
      setError('Please provide an access code to sign up. Once you have an access code, sign up first.');
    } else if (searchParams?.get('error') === 'oauth_failed') {
      setError('Google authentication failed. Please try again or use your email.');
    }

    const fetchContext = async () => {
      try {
        const res = await api.get('/api/colleges/context');
        if (res.data?.success && res.data.data) {
          const c = res.data.data;
          setCollegeData({
            collegeId: c.id,
            collegeName: c.name,
            logoUrl: c.logoUrl,
            bannerUrl: c.bannerUrl
          });
        } else {
          // Fallback to local storage if not on a tenant domain
          const stored = localStorage.getItem('studymate_last_college');
          if (stored) {
            setCollegeData(JSON.parse(stored));
          }
        }
      } catch (err) {
        // Fallback to local storage
        const stored = localStorage.getItem('studymate_last_college');
        if (stored) {
          setCollegeData(JSON.parse(stored));
        }
      }
    };
    fetchContext();
  }, [searchParams]);

  const handleGoogleAuth = () => {
    localStorage.setItem('googleAuthPending', 'true');
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/auth/login', {
        email, password, captchaToken
      });

      // Mark this as a fresh login for NotificationPrompt detection
      localStorage.setItem('newLoginAt', String(Date.now()));
      localStorage.removeItem('justLoggedOutAt');

      // Let AuthContext handle redirect based on role
      router.push('/');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Login failed'));
      turnstileRef.current?.reset();
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex w-full ${collegeData ? 'max-w-4xl' : 'max-w-md'} bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl overflow-hidden shadow-2xl min-h-[500px] transition-all duration-300`}>
      {collegeData && (
        <div className="hidden md:flex flex-col w-1/2 relative bg-[#1F1F1E]">
          {collegeData.bannerUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-60" 
              style={{ backgroundImage: `url(${collegeData.bannerUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1B] via-transparent to-transparent opacity-90" />
          <div className="relative z-10 flex flex-col justify-end p-10 h-full">
            {collegeData.logoUrl && (
              <img src={collegeData.logoUrl} alt="College Logo" className="w-16 h-16 object-contain mb-4 bg-white/10 rounded-lg p-2" />
            )}
            <h1 className="text-3xl font-bold text-[#ECECEA] mb-2">Welcome Back!</h1>
            <p className="text-sm text-[#8C8C8A]">Sign in to access your {collegeData.collegeName} dashboard.</p>
          </div>
        </div>
      )}

      <div className={`w-full ${collegeData ? 'md:w-1/2 p-8' : 'p-8'} flex flex-col justify-center`}>
        {collegeData ? (
          <>
            <div className="text-center mb-8 md:hidden">
              {collegeData.logoUrl && (
                <img src={collegeData.logoUrl} alt="College Logo" className="w-12 h-12 object-contain mx-auto mb-4 bg-white/10 rounded-lg p-2" />
              )}
              <h1 className="text-xl font-semibold text-[var(--theme-color)] mb-2">Welcome Back</h1>
              <p className="text-sm text-[#8C8C8A]">Sign in to {collegeData.collegeName}</p>
            </div>
            <div className="hidden md:block text-center mb-8">
              <h2 className="text-2xl font-semibold text-[#ECECEA] mb-1">Sign In</h2>
              <p className="text-sm text-[#8C8C8A]">Access your account</p>
            </div>
          </>
        ) : (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[var(--theme-color)] mb-2">Welcome Back</h1>
            <p className="text-sm text-[#8C8C8A]">Sign in to continue to StudyMate</p>
          </div>
        )}

        <div className="flex justify-center mb-5">
          <TurnstileWidget
            ref={turnstileRef}
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken('')}
          />
        </div>

        <button
          onClick={handleGoogleAuth}
          disabled={!captchaToken}
          className="w-full flex items-center justify-center gap-3 bg-white text-[#1C1C1B] rounded-xl py-3 px-4 font-medium hover:bg-gray-100 transition-colors mb-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
        {!captchaToken && (
          <p className="text-[10px] text-[#5A5A58] text-center mb-5">
            Complete the security check above to enable Google sign-in
          </p>
        )}
        {captchaToken && <div className="mb-5" />}

        <div className="relative flex items-center py-4 mb-2">
          <div className="flex-grow border-t border-[#3A3A38]"></div>
          <span className="flex-shrink-0 mx-4 text-[#5A5A58] text-xs">OR</span>
          <div className="flex-grow border-t border-[#3A3A38]"></div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-500 rounded-xl text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#ECECEA] mb-1.5" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm text-[#ECECEA]" htmlFor="password">Password</label>
              <Link href="/forgot-password" className="text-xs text-[#8C8C8A] hover:text-[var(--theme-color)] transition-colors">Forgot password?</Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button disabled={loading || !captchaToken} type="submit" className="w-full bg-[#ECECEA] text-[#1C1C1B] rounded-xl py-3 px-4 font-medium hover:bg-white transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-[#8C8C8A] mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[var(--theme-color)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', backgroundColor: '#1C1C1B' }} />}>
      <LoginPageInner />
    </Suspense>
  );
}
