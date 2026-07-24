"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Megaphone, X, Bell } from 'lucide-react';

export const ActiveBroadcastBanner = () => {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dismissed_broadcasts');
      if (stored) {
        setDismissedIds(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      // ignore
    }

    const fetchActive = async () => {
      try {
        const res = await api.get('/api/superadmin/broadcasts/active');
        const data = res.data?.data || res.data || [];
        if (Array.isArray(data)) {
          setBroadcasts(data);
        }
      } catch (error) {
        console.error('Failed to fetch active broadcasts', error);
      }
    };
    fetchActive();
  }, []);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      localStorage.setItem('dismissed_broadcasts', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const visibleBroadcasts = broadcasts.filter(b => !dismissedIds.has(b.id));

  return (
    <div className="fixed top-4 right-6 z-50 flex flex-col items-end">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full bg-[#2C2C2A] border border-[#3A3A38] text-[#8C8C8A] hover:text-[#ECECEA] transition-colors shadow-lg"
      >
        <Bell className="h-5 w-5" />
        {visibleBroadcasts.length > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-[#1C1C1B]">
            {visibleBroadcasts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 max-w-[calc(100vw-2rem)] flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
          {visibleBroadcasts.length === 0 ? (
            <div className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-xl p-6 shadow-2xl flex flex-col items-center justify-center text-center">
              <Bell className="h-8 w-8 text-[#5A5A58] mb-3 opacity-50" />
              <p className="text-[13px] text-[#8C8C8A]">No new broadcasts</p>
            </div>
          ) : (
            visibleBroadcasts.map((broadcast) => (
              <div key={broadcast.id} className="w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-xl p-4 shadow-2xl flex flex-col gap-2 relative">
                <button 
                  onClick={(e) => handleDismiss(broadcast.id, e)}
                  className="absolute top-3 right-3 text-[#5A5A58] hover:text-[#8C8C8A] transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-[#10b981]/10 p-2 rounded-full flex-shrink-0">
                    <Megaphone className="h-4 w-4 text-[#10b981]" />
                  </div>
                  <div className="pr-4">
                    <h4 className="text-sm font-medium text-[#ECECEA]">{broadcast.title}</h4>
                    <p className="text-xs text-[#8C8C8A] mt-1.5 leading-relaxed">{broadcast.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
