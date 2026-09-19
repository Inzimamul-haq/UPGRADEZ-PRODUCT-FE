"use client";

import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ChatMessagesProps } from '@/lib/types';

export function ChatMessages({ messages, chatId, paperId, isStreaming, onAction, onEditSubmit }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'user') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto w-full custom-scrollbar">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 w-full">
        {messages.map(m => (
          <ChatMessage key={m.id} message={m} chatId={chatId} paperId={paperId} onAction={onAction} onEditSubmit={onEditSubmit} />
        ))}
        {isStreaming && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
