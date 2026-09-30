"use client";

import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
// import { TypingIndicator } from './TypingIndicator';
import { GenerationStatus } from './GenerationStatus';
import { GenerationStepData, GenerationStatusType } from './GenerationStatus/types';
import { ChatMessagesProps } from '@/lib/types';

interface ExtendedChatMessagesProps extends ChatMessagesProps {
  isFaculty?: boolean;
  generationSteps?: GenerationStepData[];
  generationStatus?: GenerationStatusType;
  generationElapsed?: number;
  sessionLocked?: boolean;
  onRetry?: (messageId: string) => void;
}

export function ChatMessages({ messages, chatId, paperId, isStreaming, onAction, onEditSubmit, isFaculty, generationSteps, generationStatus, generationElapsed, sessionLocked, onRetry }: ExtendedChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const prevLastMsgId = useRef<string | null>(null);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    // Autoscroll if a brand new message is added (like the compiled paper)
    if (lastMsg.id !== prevLastMsgId.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      prevLastMsgId.current = lastMsg.id;
    } else if (lastMsg.role === 'user') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto w-full custom-scrollbar">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 w-full">
        {(() => {
          const lastUserIndex = messages.map(msg => msg.role).lastIndexOf('user');
          return messages.map((m, i) => {
            const isLastUser = i === lastUserIndex;
            return (
              <React.Fragment key={m.id}>
                <ChatMessage 
                  message={m} 
                  chatId={chatId} 
                  paperId={paperId} 
                  onAction={onAction} 
                  onEditSubmit={onEditSubmit} 
                  sessionLocked={sessionLocked} 
                  onRetry={onRetry} 
                  isLastMessage={i === messages.length - 1} 
                  isStreaming={isStreaming} 
                />
                {isFaculty && isLastUser && generationSteps && generationSteps.length > 0 && generationStatus && (
                  <div className="flex justify-start -mt-5 -mb-1 z-10 relative">
                    <GenerationStatus steps={generationSteps} status={generationStatus} elapsed={generationElapsed || 0} />
                  </div>
                )}
              </React.Fragment>
            );
          });
        })()}
        {/* {isStreaming && !isFaculty && <TypingIndicator />} */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
