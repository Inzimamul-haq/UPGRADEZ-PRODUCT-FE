import React from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ChatSearchParams } from '@/lib/types';

export default async function NewChatPage({ searchParams }: { searchParams: Promise<ChatSearchParams> }) {
  const params = await searchParams;

  return (
    <ChatContainer
      initialShowOverlay={!params.paperId && !(params.subjectId && params.examType)}
      initialPaperId={params.paperId}
      initialSubjectId={params.subjectId}
      initialExamType={params.examType}
      role={params.role}
    />
  );
}
