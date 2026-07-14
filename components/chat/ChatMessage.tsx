import React from 'react';
import { ChatMessageProps } from '@/lib/types';
import { FileDown, Users, CheckCircle, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import 'katex/dist/katex.min.css';

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
        <div className="text-[14px] text-[#ECECEA] leading-relaxed max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code(props) {
                const { children, className, node, ...rest } = props;
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <div className="relative my-4 rounded-lg overflow-hidden border border-[#3A3A38]">
                    <div className="absolute top-2 right-2 text-xs text-gray-400 font-sans px-2 py-1 bg-[#1E1E1E] rounded z-10 select-none">
                      {match[1]}
                    </div>
                    {/* @ts-expect-error Types for react-syntax-highlighter are mismatched */}
                    <SyntaxHighlighter
                      {...rest}
                      PreTag="div"
                      language={match[1]}
                      style={oneDark}
                      customStyle={{ margin: 0, padding: '2rem 1rem 1rem' }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code {...rest} className="inline-code bg-[#2C2C2A] text-[#E5A05F] px-1.5 py-0.5 rounded text-[13px] font-mono border border-[#3A3A38]">
                    {children}
                  </code>
                );
              },
              p: ({ node, ...props }) => {
                const content = String(props.children);
                if (content.startsWith('Answer:') || content.startsWith('**Answer:**') || content.includes('Answer:')) {
                  return <p className="border-l-[3px] border-[#818CF8] pl-4 py-2 font-bold my-4 bg-[#2C2C2A] rounded-r-md text-[#F4F4F5]" {...props} />;
                }
                return <p className="mb-3" {...props} />;
              },
              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
              li: ({ node, ...props }) => <li className="pl-1" {...props} />,
              table: ({ node, ...props }) => (
                <div className="my-4 overflow-x-auto rounded-lg border border-[#3A3A38]">
                  <table className="w-full text-left border-collapse" {...props} />
                </div>
              ),
              thead: ({ node, ...props }) => <thead className="bg-[#2C2C2A] border-b border-[#3A3A38]" {...props} />,
              th: ({ node, ...props }) => <th className="px-4 py-2 text-[13px] font-semibold text-[#ECECEA]" {...props} />,
              tbody: ({ node, ...props }) => <tbody className="divide-y divide-[#3A3A38]" {...props} />,
              tr: ({ node, ...props }) => <tr className="hover:bg-[#252523] transition-colors" {...props} />,
              td: ({ node, ...props }) => <td className="px-4 py-3 text-[13px] text-[#D1D1C7] leading-relaxed" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
              h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-6 mb-3 text-white" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-5 mb-2 text-white" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-md font-bold mt-4 mb-2 text-white" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-[#3A3A38] pl-4 italic text-[#A1A1AA] my-4" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        
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
