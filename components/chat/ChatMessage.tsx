import React from 'react';
import { Message } from '@/lib/types';
import { DiagramCard } from './DiagramCard';
import { FileDown, Users, CheckCircle, RefreshCcw } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onAction?: (messageId: string, actionId: string) => void;
}

export function ChatMessage({ message, onAction }: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-4 py-2">
          <p className="text-[14px] text-[#ECECEA] leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  const renderContent = (content: string) => {
    const parts = content.split('\n\n');
    return parts.map((part, i) => {
      // Basic bold formatting implementation `**text**` -> `<strong>text</strong>`
      const boldFormatted = part.split(/(\*\*.*?\*\*)/).map((segment, j) => {
        if (segment.startsWith('**') && segment.endsWith('**')) {
          return <strong key={j} className="font-semibold text-white">{segment.slice(2, -2)}</strong>;
        }
        return segment;
      });

      return (
        <p key={i} className="mb-3 text-[14px] text-[#ECECEA] leading-relaxed">
          {boldFormatted}
        </p>
      );
    });
  };

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'file-down': return <FileDown size={14} />;
      case 'users': return <Users size={14} />;
      case 'check-circle': return <CheckCircle size={14} />;
      case 'refresh-ccw': return <RefreshCcw size={14} />;
      default: return null;
    }
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        {renderContent(message.content)}
        
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 mb-2">
            {message.actions.map(action => (
              <button
                key={action.id}
                onClick={() => onAction && onAction(message.id, action.id)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[#1C1C1B] bg-[#ECECEA] border border-[#ECECEA] rounded-lg px-3 py-1.5 hover:bg-white transition-colors"
              >
                {renderIcon(action.icon)}
                {action.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-[11px] text-[#5A5A58] mt-2">
          {message.rag_used ? 'Context-matched' : 'AI generated'}
        </p>
      </div>
    </div>
  );
}
