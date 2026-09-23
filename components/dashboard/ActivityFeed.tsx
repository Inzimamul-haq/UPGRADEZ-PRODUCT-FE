'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell } from 'lucide-react';
import { ActivityFeedItem } from './ActivityFeedItem';
import { useAuth } from '@/context/AuthContext';
import { examTypeToTab } from '@/lib/examType';

interface ActivityFeedProps {
  notifications: Notification[];
}

function getSubjectId(notification: Notification): string | null {
  return (
    notification.paper?.subjectId ?? 
    notification.paper?.subject?.id ?? 
    notification.topicAssignment?.subjectId ??
    notification.topicAssignment?.subject?.id ??
    null
  );
}

function getQuestionsPath(role: string | undefined, subjectId: string): string {
  if (role === 'faculty') return `/faculty/questions/${subjectId}`;
  if (role === 'admin' || role === 'super_admin') return `/admin/questions/${subjectId}`;
  return `/student/questions/${subjectId}`;
}

function buildNotificationPath(
  item: Notification,
  role: string | undefined,
  isEngineering: boolean
): string | null {
  const subjectId = getSubjectId(item);
  if (!subjectId) return null;

  const basePath = getQuestionsPath(role, subjectId);
  if (item.topicAssignmentId) {
    return `${basePath}/${item.topicAssignmentId}?kind=TOPIC_ASSIGNMENT`;
  }

  const paperId = item.paperId ?? null;
  const examType = item.paper?.examType ?? item.topicAssignment?.examType;

  if (paperId) {
    const kind = (item.paper as any)?.kind;
    if (kind) {
      return `${basePath}/${paperId}?kind=${kind}`;
    }
    return `${basePath}/${paperId}`;
  }

  if (examType) {
    const tab = examTypeToTab(examType, isEngineering);
    return `${basePath}?examType=${encodeURIComponent(tab)}`;
  }

  return basePath;
}

export function ActivityFeed({ notifications }: ActivityFeedProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isEngineering = user?.college?.name?.toLowerCase().includes('engineering') ?? true;

  const handleItemClick = (item: Notification) => {
    const path = buildNotificationPath(item, user?.role, isEngineering);
    if (!path) return;
    router.push(path);
  };

  return (
    <div className="divide-y divide-[#2E2E2C] max-h-[300px] sm:max-h-[350px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-[#3A3A38] scrollbar-track-transparent">
      {notifications.length === 0 ? (
        <EmptyState 
          icon={Bell}
          heading="No recent activity"
          subtext="New papers and updates will appear here" 
        />
      ) : (
        notifications.map(n => (
          <ActivityFeedItem
            key={n.id}
            item={n}
            onClick={buildNotificationPath(n, user?.role, isEngineering) ? () => handleItemClick(n) : undefined}
          />
        ))
      )}
    </div>
  );
}
