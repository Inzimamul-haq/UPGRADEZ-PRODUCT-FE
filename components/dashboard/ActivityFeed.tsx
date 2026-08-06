import React from 'react';
import { Notification } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell } from 'lucide-react';
import { ActivityFeedItem } from './ActivityFeedItem';

interface ActivityFeedProps {
  notifications: Notification[];
}

export function ActivityFeed({ notifications }: ActivityFeedProps) {
  return (
    <div className="divide-y divide-[#2E2E2C] max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#3A3A38] scrollbar-track-transparent">
      {notifications.length === 0 ? (
        <EmptyState 
          icon={Bell}
          heading="No recent activity"
          subtext="New papers and updates will appear here" 
        />
      ) : (
        notifications.map(n => <ActivityFeedItem key={n.id} item={n} />)
      )}
    </div>
  );
}
