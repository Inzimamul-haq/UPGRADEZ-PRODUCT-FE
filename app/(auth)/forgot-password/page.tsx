"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { extractErrorMessage } from '@/lib/utils';
import TurnstileWidget, { TurnstileWidgetHandle } from '@/components/TurnstileWidget';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const turnstileRef = React.useRef<TurnstileWidgetHandle>(null);

  const [collegeData, setCollegeData] = useState<{ collegeId: string; collegeName: string; bannerUrl?: string | null; logoUrl?: string | null } | null>(null);

  useEffect(() => {
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
          const stored = localStorage.getItem('studymate_last_college');
          if (stored) {
            setCollegeData(JSON.parse(stored));
          }
        }
      } catch (err) {
        const stored = localStorage.getItem('studymate_last_college');
        if (stored) {
          setCollegeData(JSON.parse(stored));
        }
      }
    };
    fetchContext();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeData?.collegeId) {
      setError('College context not found. Please go to your college login page.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', {
        email,
        collegeId: collegeData.collegeId,
        captchaToken,
      });
      setSuccess('If the email exists, an OTP has been sent.');
      setResendCountdown(60);
      setStep(2);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to request OTP'));
      turnstileRef.current?.reset();
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/verify-otp', {
        email,
        collegeId: collegeData!.collegeId,
        otp
      });
      setResetToken(res.data.resetToken);
      setSuccess('OTP verified successfully.');
      setStep(3);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to verify OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 14) {
      setError('Password must be between 6 and 14 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', {
        token: resetToken,
        newPassword,
        collegeId: collegeData!.collegeId
      });
      setSuccess('Password reset successfully. You can now login.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to reset password'));
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
            <h1 className="text-3xl font-bold text-[#ECECEA] mb-2">Password Reset</h1>
            <p className="text-sm text-[#8C8C8A]">Reset your password for {collegeData.collegeName}.</p>
          </div>
        </div>
      )}

      <div className={`w-full ${collegeData ? 'md:w-1/2 p-8' : 'p-8'} flex flex-col justify-center`}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#ECECEA] mb-2">Forgot Password</h1>
          <p className="text-sm text-[#8C8C8A]">
            {step === 1 && 'Enter your email to receive an OTP'}
            {step === 2 && 'Enter the OTP sent to your email'}
            {step === 3 && 'Enter your new password'}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-500 rounded-xl text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-500/20 border border-green-500 text-green-500 rounded-xl text-sm">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
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
            
            <div className="flex justify-center my-4">
              <TurnstileWidget
                ref={turnstileRef}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken('')}
              />
            </div>

            <button disabled={loading || !captchaToken || resendCountdown > 0} type="submit" className="w-full bg-[#ECECEA] text-[#1C1C1B] rounded-xl py-3 px-4 font-medium hover:bg-white transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Sending...' : resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm text-[#ECECEA] mb-1.5" htmlFor="otp">Enter 6-digit OTP</label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[var(--theme-color)] transition-colors text-center tracking-widest text-lg"
                placeholder="000000"
                required
                disabled={loading}
              />
            </div>
            <button disabled={loading || otp.length !== 6} type="submit" className="w-full bg-[#ECECEA] text-[#1C1C1B] rounded-xl py-3 px-4 font-medium hover:bg-white transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-[#8C8C8A] text-sm mt-2 hover:text-white transition-colors">
              {resendCountdown > 0 ? `Back to Email (Resend in ${resendCountdown}s)` : 'Back to Email to Resend'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm text-[#ECECEA] mb-1.5" htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm text-[#ECECEA] mb-1.5" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            <button disabled={loading} type="submit" className="w-full bg-[#ECECEA] text-[#1C1C1B] rounded-xl py-3 px-4 font-medium hover:bg-white transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[#8C8C8A] mt-8">
          Remembered your password?{' '}
          <Link href="/login" className="text-[var(--theme-color)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
