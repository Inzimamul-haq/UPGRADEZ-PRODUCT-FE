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

  const isPaperRole = ['faculty', 'admin', 'super_admin', 'super-admin'].includes(role);

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <div
      className={`
        fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col border-r border-[#2E2E2C] bg-[#1F1F1E]
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Header: Logo + Search + Close toggle */}
      <div className="flex items-center justify-between px-3 py-3">
        <h1 className="pl-1 text-[16px] font-medium tracking-wide text-[#ECECEA]">
          StudyMate
        </h1>

        <div className="flex items-center gap-1.5">
          <button
            onClick={openSearch}
            className="rounded-md p-1.5 text-[#8C8C8A] transition-colors hover:bg-[#2C2C2A] hover:text-[#ECECEA]"
          >
            <Search size={16} />
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1.5 text-[#8C8C8A] transition-colors hover:bg-[#2C2C2A] hover:text-[#ECECEA]"
          >
            <PanelLeft size={16} />
          </button>
        </div>
      </div>

      {/* New Chat / New Paper */}
      <div className="px-3 pb-2">
        <Link
          href={isPaperRole ? `/chat/new?role=${role}` : '/chat/new'}
          onClick={handleLinkClick}
          className="flex w-full items-center gap-2 rounded-md bg-[#ECECEA] px-3 py-2 font-medium text-[#1C1C1B] transition-colors hover:bg-white"
        >
          <Plus size={16} />
          <span className="text-[13px]">
            {isPaperRole ? 'New paper' : 'New chat'}
          </span>
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

      {/* Recent Chats */}
      <SidebarRecentChats />

      {/* Footer */}
      <div className="relative mt-auto border-t border-[#2E2E2C] px-3 py-3">
        <SidebarUserFooter />
      </div>
    </div>
  );
}