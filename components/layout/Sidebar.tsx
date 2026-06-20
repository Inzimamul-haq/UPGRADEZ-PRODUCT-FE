"use client";

import React from 'react';
import { NavItem } from './AppShell';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarRecentChats } from './SidebarRecentChats';
import { SidebarUserFooter } from './SidebarUserFooter';
import { useSidebar } from '@/context/SidebarContext';
import { Plus, Search, PanelLeft } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  role: string;
  navItems: NavItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ role, navItems, isOpen, setIsOpen }: SidebarProps) {
  const { openSearch } = useSidebar();

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`
      fixed left-0 top-0 h-full w-[240px] bg-[#1F1F1E] border-r border-[#2E2E2C] flex flex-col z-50
      transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Header: Logo + Search + Close toggle */}
      <div className="flex items-center justify-between px-3 py-3">
        <h1 className="text-[16px] font-medium text-[#ECECEA] tracking-wide pl-1">StudyMate</h1>
        <div className="flex items-center gap-1.5">
          <button onClick={openSearch} className="p-1.5 text-[#8C8C8A] hover:text-[#ECECEA] rounded-md hover:bg-[#2C2C2A] transition-colors">
            <Search size={16} />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-[#8C8C8A] hover:text-[#ECECEA] rounded-md hover:bg-[#2C2C2A] transition-colors">
            <PanelLeft size={16} />
          </button>
        </div>
      </div>

      {/* New Chat */}
      <div className="px-3 pb-2">
        <Link
          href={role === 'faculty' ? '/chat/new?role=faculty' : '/chat/new'}
          onClick={handleLinkClick}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#ECECEA] text-[#1C1C1B] hover:bg-white transition-colors font-medium w-full"
        >
          <Plus size={16} />
          <span className="text-[13px]">{role === 'faculty' ? 'New paper' : 'New chat'}</span>
        </Link>
      </div>

      {/* Nav Items */}
      <div className="flex flex-col gap-0.5 px-3">
        {navItems.map((item) => (
          <div key={item.href} onClick={handleLinkClick}>
            <SidebarNavItem {...item} />
          </div>
        ))}
      </div>

      {/* Recent Chats — shared for all roles */}
      <SidebarRecentChats />

      {/* Footer */}
      <div className="mt-auto border-t border-[#2E2E2C] px-3 py-3 relative">
        <SidebarUserFooter />
      </div>
    </div>
  );
}
