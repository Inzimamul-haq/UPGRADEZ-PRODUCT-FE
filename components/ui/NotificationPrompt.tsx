"use client";

import { useState, useEffect, useCallback } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import api from '@/lib/api';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;
const SW_PATH = '/firebase-messaging-sw.js';
const SESSION_KEY = 'notif_prompt_dismissed';
const NEW_LOGIN_WINDOW_MS = 5 * 60 * 1000; // show prompt within 5 min of new login

/**
 * Shows a one-time notification permission prompt after a fresh login.
 * - Only appears when Notification.permission === 'default'
 * - Uses sessionStorage so it dismisses for the current tab session
 * - Reads 'newLoginAt' from localStorage to detect a fresh login
 */
export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Only run in browser with Notification support
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Already granted or denied — nothing to ask
    if (Notification.permission !== 'default') return;

    // Already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Only show within 5 minutes of a fresh login
    const newLoginAt = localStorage.getItem('newLoginAt');
    if (!newLoginAt) return;

    const age = Date.now() - parseInt(newLoginAt, 10);
    if (age > NEW_LOGIN_WINDOW_MS) return;

    // Show with a short delay so the page feels settled first
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  }, []);

  const handleAllow = useCallback(async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        dismiss();
        return;
      }
      // Register FCM token
      if (messaging) {
        const swReg = await navigator.serviceWorker.register(SW_PATH);
        await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });
        if (token) {
          await api.post('/api/notifications/fcm-token', { token });
        }
      }
    } catch (err) {
      console.error('[NotificationPrompt] error:', err);
    } finally {
      setLoading(false);
      dismiss();
    }
  }, [dismiss]);

  if (!mounted || !visible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm"
      style={{ transform: 'translateX(-50%)', animation: 'notifSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}
    >
      <style>{`
        @keyframes notifSlideUp {
          from { opacity: 0; transform: translate(-50%, 24px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div
        style={{
          background: 'linear-gradient(135deg, #242422 0%, #2C2C2A 100%)',
          border: '1px solid #3A3A38',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          {/* Bell icon with glow */}
          <div
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3A3A38, #2C2C2A)',
              border: '1px solid #4A4A48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(236,236,234,0.08)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ECECEA" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#ECECEA', lineHeight: '1.3' }}>
              Stay in the loop
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8C8C8A', lineHeight: '1.45' }}>
              Get notified about new papers, replies, and updates — no spam.
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={dismiss}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              color: '#5A5A58',
              lineHeight: 1,
              marginTop: '-2px',
            }}
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#2E2E2C', margin: '16px 0' }} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={dismiss}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid #3A3A38',
              background: 'transparent',
              color: '#8C8C8A',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#333331')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            Maybe Later
          </button>

          <button
            onClick={handleAllow}
            disabled={loading}
            style={{
              flex: 1.5,
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: loading ? '#3A3A38' : '#ECECEA',
              color: '#1C1C1B',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#FFFFFF'; }}
            onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#ECECEA'; }}
          >
            {loading ? 'Enabling…' : 'Allow Notifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
