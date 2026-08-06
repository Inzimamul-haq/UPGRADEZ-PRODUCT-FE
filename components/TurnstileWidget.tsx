"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export interface TurnstileWidgetHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  ({ onVerify, onExpire }, ref) => {
    const widgetRef = useRef<HTMLDivElement>(null);
    const turnstileId = useRef<string | null>(null);
    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);

    // Keep refs updated without triggering re-renders
    useEffect(() => {
      onVerifyRef.current = onVerify;
      onExpireRef.current = onExpire;
    }, [onVerify, onExpire]);

    useEffect(() => {
      let isMounted = true;

      const loadTurnstile = () => {
        if (!window.turnstile) return;
        
        // Prevent double rendering in StrictMode
        if (widgetRef.current && !turnstileId.current && isMounted) {
          try {
            turnstileId.current = window.turnstile.render(widgetRef.current, {
              sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
              callback: (token: string) => onVerifyRef.current(token),
              'expired-callback': () => onExpireRef.current(),
              'error-callback': () => onExpireRef.current(),
              appearance: 'always',
              theme: 'dark'
            });
          } catch (e) {
            console.error('Turnstile render error', e);
          }
        }
      };

      if (!document.getElementById('turnstile-script')) {
        const script = document.createElement('script');
        script.id = 'turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = loadTurnstile;
        document.head.appendChild(script);
      } else {
        if (window.turnstile) {
          loadTurnstile();
        } else {
          const interval = setInterval(() => {
            if (window.turnstile) {
              clearInterval(interval);
              loadTurnstile();
            }
          }, 100);
        }
      }

      return () => {
        isMounted = false;
        if (window.turnstile && turnstileId.current) {
          try {
            window.turnstile.remove(turnstileId.current);
          } catch (e) {
            // Ignore if already removed
          }
          turnstileId.current = null;
        }
      };
    }, []); // Empty dependency array ensures it only mounts once

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (window.turnstile && turnstileId.current) {
          window.turnstile.reset(turnstileId.current);
          onExpireRef.current();
        }
      },
    }));

    return (
      <div 
        ref={widgetRef} 
        style={{ minHeight: '65px' }} // Reserve space to prevent layout shift
      />
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;
