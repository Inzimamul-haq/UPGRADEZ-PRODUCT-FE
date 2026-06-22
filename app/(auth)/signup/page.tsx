"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/auth/register`, {
        name, email, password, role: 'student'
      });

      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-[var(--theme-color)] mb-2">Create Account</h1>
        <p className="text-sm text-[#8C8C8A]">Join StudyMate to start learning</p>
      </div>

      <button className="w-full flex items-center justify-center gap-3 bg-white text-[#1C1C1B] rounded-xl py-3 px-4 font-medium hover:bg-gray-100 transition-colors mb-6">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign up with Google
      </button>

      <div className="relative flex items-center py-4 mb-2">
        <div className="flex-grow border-t border-[#3A3A38]"></div>
        <span className="flex-shrink-0 mx-4 text-[#5A5A58] text-xs">OR</span>
        <div className="flex-grow border-t border-[#3A3A38]"></div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-500 rounded-xl text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#ECECEA] mb-1.5" htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
            placeholder="John Doe"
            required
            disabled={loading}
          />
        </div>
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
          <label className="block text-sm text-[#ECECEA] mb-1.5" htmlFor="password">Password</label>
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
        <button disabled={loading} type="submit" className="w-full bg-[#ECECEA] text-[#1C1C1B] rounded-xl py-3 px-4 font-medium hover:bg-white transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center text-sm text-[#8C8C8A] mt-8">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--theme-color)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
