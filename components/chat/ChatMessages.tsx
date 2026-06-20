"use client";

import React, { useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';

interface ChatMessagesProps {
  messages: Message[];
  isStreaming: boolean;
  onAction?: (messageId: string, actionId: string) => void;
}

export function ChatMessages({ messages, isStreaming, onAction }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto w-full">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 w-full">
        {messages.map(m => (
          <ChatMessage key={m.id} message={m} onAction={onAction} />
        ))}
        {isStreaming && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
