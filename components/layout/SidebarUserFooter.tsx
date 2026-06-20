"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SidebarUserFooter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Mock user for now since context might be null in UI checks
  const user = { name: 'Alex Johnson', role: 'student' };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-[#2C2C2A] border border-[#3A3A38] rounded-lg shadow-xl overflow-hidden py-1 z-50">
          <button 
            onClick={() => {
              setIsOpen(false);
              router.push('/settings');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#ECECEA] hover:bg-[#333331] transition-colors"
          >
            <Settings size={14} className="text-[#8C8C8A]" />
            Settings
          </button>
          <button 
            onClick={() => {
              setIsOpen(false);
              router.push('/login');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-400 hover:bg-[#333331] transition-colors border-t border-[#3A3A38]"
          >
            <LogOut size={14} className="text-red-400" />
            Logout
          </button>
        </div>
      )}

      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 hover:bg-[#333331] p-2 -mx-2 rounded-lg cursor-pointer transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3A3A38] to-[#5A5A58] flex items-center justify-center text-[13px] font-medium text-[#ECECEA] shadow-inner">
          {user.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[#ECECEA] truncate">{user.name}</p>
          <p className="text-[11px] text-[#8C8C8A] capitalize">Free Plan</p>
        </div>
        <ChevronsUpDown size={14} className="text-[#5A5A58] flex-shrink-0" />
      </div>
    </div>
  );
}
