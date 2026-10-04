"use client";

import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { GenerationStatus } from './GenerationStatus';
import { GenerationStepData, GenerationStatusType } from './GenerationStatus/types';
import { ChatMessagesProps } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ExtendedChatMessagesProps extends ChatMessagesProps {
  isFaculty?: boolean;
  generationSteps?: GenerationStepData[];
  generationStatus?: GenerationStatusType;
  generationElapsed?: number;
  sessionLocked?: boolean;
  onRetry?: (messageId: string) => void;
  hasMore?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
  isInitialLoading?: boolean;
}

function ChatSkeleton() {
  return (
    <div className="space-y-6 opacity-60 animate-pulse">
      <div className="flex flex-col items-end space-y-2">
        <div className="h-12 w-3/4 max-w-md bg-white/[0.04] rounded-2xl rounded-tr-sm border border-white/[0.08]" />
      </div>
      <div className="flex flex-col items-start space-y-2">
        <div className="h-32 w-full bg-white/[0.04] rounded-2xl rounded-tl-sm border border-white/[0.08]" />
      </div>
    </div>
  );
}

export function ChatMessages({ 
  messages, 
  chatId, 
  paperId, 
  isStreaming, 
  onAction, 
  onEditSubmit, 
  isFaculty, 
  generationSteps, 
  generationStatus, 
  generationElapsed, 
  sessionLocked, 
  onRetry,
  hasMore = false,
  isLoadingOlder = false,
  onLoadOlder,
  isInitialLoading = false
}: ExtendedChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  const prevLastMsgId = useRef<string | null>(null);
  const prevContentLength = useRef<number>(0);
  
  const [armed, setArmed] = useState(false);
  const scrollSnapshot = useRef<{ height: number; top: number }>({ height: 0, top: 0 });

  // 1. Initial pin to bottom when first messages arrive
  useEffect(() => {
    if (messages.length > 0 && !armed) {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'auto' });
      }
      
      // Wait for React to paint and layout before arming the top sentinel
      requestAnimationFrame(() => {
        setArmed(true);
      });
      
      const lastMsg = messages[messages.length - 1];
      prevLastMsgId.current = lastMsg?.id || null;
      prevContentLength.current = lastMsg?.content.length || 0;
    }
  }, [messages.length, armed]);

  // 2. Intersection Observer for the top sentinel
  useEffect(() => {
    if (!armed || !hasMore || isLoadingOlder || !onLoadOlder || !sentinelRef.current || !containerRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (containerRef.current) {
          scrollSnapshot.current = {
            height: containerRef.current.scrollHeight,
            top: containerRef.current.scrollTop
          };
        }
        onLoadOlder();
      }
    }, {
      root: containerRef.current,
      rootMargin: '200px 0px 0px 0px'
    });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [armed, hasMore, isLoadingOlder, onLoadOlder]);

  // 3. Scroll Anchoring after prepending older messages
  useLayoutEffect(() => {
    if (!containerRef.current || !armed || messages.length === 0) return;
    
    // We can detect a prepend if the first message ID changed, 
    // but the last message ID stayed the same.
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.id === prevLastMsgId.current && scrollSnapshot.current.height > 0) {
      const container = containerRef.current;
      const heightDiff = container.scrollHeight - scrollSnapshot.current.height;
      if (heightDiff > 0) {
        container.scrollTop = scrollSnapshot.current.top + heightDiff;
      }
      scrollSnapshot.current = { height: 0, top: 0 };
    }
  }, [messages, armed]);

  // 4. Autoscroll logic for new messages at the bottom
  useEffect(() => {
    if (!armed || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    const lastMsgIdChanged = lastMsg.id !== prevLastMsgId.current;
    const streamingGrew = isStreaming && lastMsg.role === 'assistant' && lastMsg.content.length > prevContentLength.current;
    const userMessage = lastMsg.role === 'user';

    if (lastMsgIdChanged || streamingGrew || (userMessage && lastMsgIdChanged)) {
      if (containerRef.current && bottomRef.current) {
        // Only autoscroll if the user is already near the bottom (within 300px)
        const container = containerRef.current;
        const distToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        
        if (distToBottom < 300 || userMessage || (lastMsgIdChanged && lastMsg.role === 'assistant')) {
          bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }

    prevLastMsgId.current = lastMsg.id;
    prevContentLength.current = lastMsg.content.length;
  }, [messages, isStreaming, armed]);

  if (isInitialLoading) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto w-full custom-scrollbar">
        <div className="max-w-3xl mx-auto px-4 py-8 w-full">
          <ChatSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto w-full custom-scrollbar relative">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 w-full">
        {hasMore && (
          <div ref={sentinelRef} className="h-10 flex items-center justify-center w-full">
            {isLoadingOlder && <Loader2 className="w-5 h-5 animate-spin text-white/30" />}
          </div>
        )}

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
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
