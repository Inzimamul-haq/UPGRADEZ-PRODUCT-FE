import React from 'react';
import { ChatMessageProps } from '@/lib/types';
import { FileDown, Users, CheckCircle, RefreshCcw } from 'lucide-react';

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
      const lines = part.trim().split('\n');
      const isTable = lines.length >= 2 && lines[0].includes('|') && /\|?\s*:?-+:?\s*\|/.test(lines[1]);

      if (isTable) {
        const parseRow = (line: string) => {
          const cells = line.split('|');
          if (cells.length > 0 && cells[0].trim() === '') cells.shift();
          if (cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();
          return cells.map(c => c.trim());
        };

        const headers = parseRow(lines[0]);
        const rows = lines.slice(2).filter(line => line.includes('|')).map(parseRow);

        return (
          <div key={i} className="my-4 overflow-x-auto rounded-lg border border-[#3A3A38]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2C2C2A] border-b border-[#3A3A38]">
                  {headers.map((h, j) => (
                    <th key={j} className="px-4 py-2 text-[13px] font-semibold text-[#ECECEA]">
                      {h.replace(/\*\*/g, '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A3A38]">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#252523] transition-colors">
                    {row.map((cell, cIdx) => {
                      const boldFormatted = cell.split(/(\*\*.*?\*\*)/).map((segment, j) => {
                        if (segment.startsWith('**') && segment.endsWith('**')) {
                          return <strong key={j} className="font-semibold text-white">{segment.slice(2, -2)}</strong>;
                        }
                        return segment;
                      });
                      return (
                        <td key={cIdx} className="px-4 py-3 text-[13px] text-[#D1D1C7] leading-relaxed">
                          {boldFormatted}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

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
