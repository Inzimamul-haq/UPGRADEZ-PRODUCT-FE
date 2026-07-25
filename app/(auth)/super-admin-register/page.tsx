"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { secretSchema, superAdminRegisterSchema } from '@/Schema/validations';

export default function SuperAdminRegisterPage() {
  const router = useRouter();
  
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [secret, setSecret] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifySecret = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const parsed = secretSchema.safeParse({ secret });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/api/auth/verify-super-admin-secret', { secret });
      setTempToken(res.data.tempToken);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;
    
    setError('');
    setLoading(true);

    const parsed = superAdminRegisterSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/auth/register-super-admin', 
        { name, email, password },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!tempToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1C1C1B]">
        <div className="w-full max-w-md bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[var(--theme-color)] mb-2">Super Admin Access</h1>
            <p className="text-sm text-[#8C8C8A]">Enter the deployment secret to register</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-500 rounded-xl text-sm">{error}</div>}
          
          <form onSubmit={handleVerifySecret} className="space-y-4">
            <div>
              <label className="block text-sm text-[#ECECEA] mb-1.5" htmlFor="secret">Secret Key</label>
              <input
                id="secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] font-mono placeholder:text-[#5A5A58] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                placeholder="Enter deployment secret"
                required
                disabled={loading}
              />
            </div>
            <button disabled={loading} type="submit" className="w-full bg-[#ECECEA] text-[#1C1C1B] rounded-xl py-3 px-4 font-medium hover:bg-white transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1C1C1B]">
      <div className="w-full max-w-md bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-[var(--theme-color)] mb-2">Create Super Admin</h1>
          <p className="text-sm text-[#8C8C8A]">Register a new super admin account</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-500 rounded-xl text-sm">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-4">
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
