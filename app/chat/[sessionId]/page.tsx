import React from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';

export default async function ExistingChatPage({ params, searchParams }: { params: Promise<{ sessionId: string }>, searchParams: Promise<{ role?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  return <ChatContainer initialShowOverlay={false} initialSessionId={resolvedParams.sessionId} role={resolvedSearch.role} />;
}
