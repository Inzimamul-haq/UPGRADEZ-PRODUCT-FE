'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken, deleteToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import api from '@/lib/api';
import { toast } from 'sonner';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;
const SW_PATH = '/firebase-messaging-sw.js';
const STORAGE_KEY = 'push_registered'; // fast client-side hint; Notification.permission is ground truth

export type PushStatus = 'granted' | 'denied' | 'default' | 'unsupported';

interface UsePushNotificationsReturn {
  status: PushStatus;
  isEnabled: boolean;
  isLoading: boolean;
  toggle: () => Promise<void>;
}

/**
 * Manages the full FCM token lifecycle:
 *   - derives initial state from browser permission + localStorage hint
 *   - toggle ON  → request permission → get token → POST /api/notifications/fcm-token
 *   - toggle OFF → get token → DELETE /api/notifications/fcm-token → deleteToken()
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [status, setStatus] = useState<PushStatus>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /** Register the service worker and retrieve the FCM registration token. */
  const getOrCreateToken = useCallback(async (): Promise<string | null> => {
    if (!messaging) return null;
    try {
      const swRegistration = await navigator.serviceWorker.register(SW_PATH);
      await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });
      return token || null;
    } catch (err) {
      console.error('[usePushNotifications] getToken error:', err);
      return null;
    }
  }, []);

  // Derive initial state from browser permission on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setStatus('unsupported');
      return;
    }

    const perm = Notification.permission as PushStatus;
    setStatus(perm);

    const checkBackendStatus = async () => {
      if (perm !== 'granted') {
        setIsEnabled(false);
        return;
      }
      try {
        const token = await getOrCreateToken();
        if (token) {
          const res = await api.get(`/api/notifications/fcm-token/status?token=${token}`);
          setIsEnabled(res.data.registered);
        } else {
          setIsEnabled(false);
        }
      } catch (e) {
        setIsEnabled(false);
      }
    };

    checkBackendStatus();

    // If the tab is in the foreground, listen for incoming messages and surface them
    if (messaging) {
      const unsub = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || 'StudyMate';
        const body = payload.notification?.body || '';
        // Show an in-app toast instead of a native OS notification
        if (Notification.permission === 'granted') {
          toast(title, {
            description: body,
          });
        }
      });
      return unsub;
    }
  }, [getOrCreateToken]);

  const toggle = useCallback(async () => {
    if (!('Notification' in window) || !messaging) return;

    setIsLoading(true);
    try {
      if (isEnabled) {
        // --- DISABLE ---
        const token = await getOrCreateToken();
        if (token) {
          await api.delete('/api/notifications/fcm-token', { data: { token } });
          await deleteToken(messaging);
        }
        setIsEnabled(false);
      } else {
        // --- ENABLE ---
        const permission = await Notification.requestPermission();
        setStatus(permission as PushStatus);

        if (permission !== 'granted') return;

        const token = await getOrCreateToken();
        if (!token) return;

        await api.post('/api/notifications/fcm-token', { token });
        setIsEnabled(true);
      }
    } catch (err) {
      console.error('[usePushNotifications] toggle error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, getOrCreateToken]);

  return { status, isEnabled, isLoading, toggle };
}
