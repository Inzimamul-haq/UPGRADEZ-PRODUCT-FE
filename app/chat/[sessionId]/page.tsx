import React from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';

export default function ExistingChatPage({ params }: { params: { sessionId: string } }) {
  return <ChatContainer initialShowOverlay={false} initialSessionId={params.sessionId} />;
}
