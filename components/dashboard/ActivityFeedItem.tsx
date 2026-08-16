import React from 'react';
import { Bell, FileText, BookOpen, MessageSquare } from 'lucide-react';
import { Notification } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

interface ActivityFeedItemProps {
  item: Notification;
  onClick?: () => void;
}

export function ActivityFeedItem({ item, onClick }: ActivityFeedItemProps) {
  let Icon = Bell;

  if (item.type === 'new_paper') Icon = FileText;
  else if (item.type === 'syllabus_update') Icon = BookOpen;
  else if (item.type === 'study_recap') Icon = MessageSquare;

  const cleanMessage = item.message
    .replace(/^[\s\-•.]+/, '')
    .replace(/[.]+$/, '')
    .trim();

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={`flex items-center gap-4 px-4 py-4 hover:bg-[#2C2C2A] transition-colors ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="w-9 h-9 rounded-full bg-[#333331] flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-[#ECECEA]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] sm:text-[13.5px] text-[#ECECEA] leading-snug">
          {cleanMessage}
        </p>

        <p className="hidden sm:block text-[11.5px] text-[#8C8C8A] mt-0.5">
          Across your college and subjects
        </p>
      </div>

      <span className="text-[11px] text-[#5A5A58] whitespace-nowrap flex-shrink-0 ml-2">
        {relativeTime((item as any).createdAt || item.created_at)}
      </span>
    </div>
  );
}