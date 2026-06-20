import React from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';

interface SearchParams {
  paperId?: string;
  role?: string;
  year?: string;
  branch?: string;
  subjectId?: string;
  subjectName?: string;
  subjectCode?: string;
  examType?: string;
}

export default async function NewChatPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  return (
    <ChatContainer
      initialShowOverlay={!params.paperId}
      initialPaperId={params.paperId}
      role={params.role}
    />
  );
}
