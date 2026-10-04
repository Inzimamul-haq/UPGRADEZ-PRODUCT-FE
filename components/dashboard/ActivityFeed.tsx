'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell } from 'lucide-react';
import { ActivityFeedItem } from './ActivityFeedItem';
import { useAuth } from '@/context/AuthContext';
import { examTypeToTab } from '@/lib/examType';
import { SkeletonList, NotificationSkeleton } from '@/components/ui/Skeletons';
import { LoadingNext } from '@/components/ui/LoadingNext';
import api from '@/lib/api';

interface ActivityFeedProps {
  collegeId?: string;
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

export function ActivityFeed({ collegeId }: ActivityFeedProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isEngineering = user?.college?.name?.toLowerCase().includes('engineering') ?? true;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);

  const fetchNotifications = React.useCallback(async (cursor?: string | null) => {
    const isLoadMore = !!cursor;
    if (isLoadMore) setIsFetchingMore(true);
    else setLoading(true);
    
    const params = new URLSearchParams();
    if (collegeId) params.append('collegeId', collegeId);
    if (cursor) params.append('cursor', cursor);
    params.append('limit', '40');
    
    try {
      const res = await api.get(`/api/notifications?${params.toString()}`);
      if (res.data.success) {
        if (isLoadMore) {
          setNotifications(prev => [...prev, ...res.data.data.items]);
        } else {
          setNotifications(res.data.data.items);
        }
        setNextCursor(res.data.data.nextCursor);
        setHasMore(res.data.data.hasMore);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, [collegeId]);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  React.useEffect(() => {
    if (!hasMore || loading) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingMore && nextCursor) {
        fetchNotifications(nextCursor);
      }
    }, { root: scrollRef.current, rootMargin: '200px' });

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, fetchNotifications, nextCursor, loading]);

  const handleItemClick = (item: Notification) => {
    const path = buildNotificationPath(item, user?.role, isEngineering);
    if (!path) return;
    router.push(path);
  };

  return (
    <div ref={scrollRef} className="divide-y divide-[#2E2E2C] max-h-[300px] sm:max-h-[350px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-[#3A3A38] scrollbar-track-transparent">
      {loading ? (
        <SkeletonList count={5} Row={NotificationSkeleton} />
      ) : notifications.length === 0 ? (
        <EmptyState 
          icon={Bell}
          heading="No recent activity"
          subtext="New papers and updates will appear here" 
        />
      ) : (
        <>
          {notifications.map(n => (
            <ActivityFeedItem
              key={n.id}
              item={n}
              onClick={buildNotificationPath(n, user?.role, isEngineering) ? () => handleItemClick(n) : undefined}
            />
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="min-h-[48px]">
              {isFetchingMore && <LoadingNext showEndOfList={false} hasMore={true} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
