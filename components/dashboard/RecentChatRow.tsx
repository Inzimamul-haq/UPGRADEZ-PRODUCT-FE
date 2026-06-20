"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChatSession } from '@/lib/types';
import { relativeTime } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface RecentChatRowProps {
  session: ChatSession;
}

export function RecentChatRow({ session }: RecentChatRowProps) {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(`/chat/${session.id}`)}
      className="flex items-center justify-between bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-4 py-3 cursor-pointer hover:bg-[#333331] transition-colors duration-150"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[#ECECEA] truncate">{session.subject_name}</p>
        <p className="text-[12px] text-[#5A5A58] mt-0.5">
          {session.exam_type} · {relativeTime(session.created_at)}
        </p>
      </div>
      <ChevronRight size={16} className="text-[#5A5A58] flex-shrink-0" />
    </div>
  );
}
