import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessageProps } from '@/lib/types';
import { FileDown, Users, CheckCircle, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import 'katex/dist/katex.min.css';
import { DiagramCard } from './DiagramCard';

import { MathSolution, MathSolutionData } from './MathSolution';

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

  // Pre-process message content:
  // 1. Add a newline before (i), (ii), etc. if it's preceded by text and not already on a new line.
  // 2. Wrap list items starting with (i) in bold Markdown if they end with a colon. E.g. (i) Node and Clusters: -> **(i) Node and Clusters:**
  let processedContent = (message.content || '')
    .replace(/([^\n])\s+(\([ivx]+\))/gi, '$1\n\n$2')
    .replace(/^(\([ivx]+\)\s+)([^:\n]+):/gim, '**$1$2:**');

  let mathJsonData: MathSolutionData | null = null;
  const jsonBlockRegex = /```json\s*(\{[\s\S]*?"solution"[\s\S]*?\})\s*```/i;
  const match = processedContent.match(jsonBlockRegex);
  if (match && match[1]) {
    try {
      // LLMs frequently forget to double-escape LaTeX backslashes in JSON (e.g. outputting \frac instead of \\frac).
      // This sanitizer replaces all single backslashes with double backslashes, unless they are already doubled.
      const sanitizedJson = match[1].replace(/\\/g, '\\\\').replace(/\\\\\\\\/g, '\\\\');
      const parsed = JSON.parse(sanitizedJson);
      if (parsed.solution) {
        mathJsonData = parsed.solution;
        processedContent = processedContent.replace(match[0], '').trim();
      }
    } catch (e) {
      console.error('Failed to parse math solution JSON', e);
    }
  }

  const markdownComponents: any = {
    code(props: any) {
      const { children, className, node, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');
      return match ? (
        <div className="relative my-4 rounded-lg overflow-hidden border border-[#3A3A38]">
          <div className="absolute top-2 right-2 text-xs text-gray-400 font-sans px-2 py-1 bg-[#1E1E1E] rounded z-10 select-none">
            {match[1]}
          </div>
          
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
    p: ({ node, ...props }: any) => {
      const extractText = (child: any): string => {
        if (typeof child === 'string') return child;
        if (Array.isArray(child)) return child.map(extractText).join('');
        if (child?.props?.children) return extractText(child.props.children);
        return '';
      };
      const content = extractText(props.children);

      if (content.startsWith('Answer:') || content.startsWith('**Answer:**') || content.includes('Answer:')) {
        return <p className="border-l-[3px] border-[#818CF8] pl-4 py-2 font-bold my-4 bg-[#2C2C2A] rounded-r-md text-[#F4F4F5]" {...props} />;
      }
      
      if (content.trim() === 'OR' || content.trim() === '**OR**') {
        return (
          <div className="flex items-center gap-3 py-1 px-1 my-4">
            <div className="flex-1 border-t border-dashed border-[#3A3A38]" />
            <span className="text-[11px] font-semibold text-[#8C8C8A] tracking-widest">OR</span>
            <div className="flex-1 border-t border-dashed border-[#3A3A38]" />
          </div>
        );
      }

      return <p className="mb-3 whitespace-pre-wrap" {...props} />;
    },
    ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
    li: ({ node, ...props }: any) => <li className="pl-1" {...props} />,
    table: ({ node, ...props }: any) => (
      <div className="my-4 overflow-x-auto rounded-lg border border-[#3A3A38]">
        <table className="w-full text-left border-collapse" {...props} />
      </div>
    ),
    thead: ({ node, ...props }: any) => <thead className="bg-[#2C2C2A] border-b border-[#3A3A38]" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-4 py-2 text-[13px] font-semibold text-[#ECECEA]" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-[#3A3A38]" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="hover:bg-[#252523] transition-colors" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-4 py-3 text-[13px] text-[#D1D1C7] leading-relaxed" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="font-[600] text-[#BC676A] bg-[#1A1A19] border border-[#BC676A]/30 px-1.5 py-0.5 rounded mx-0.5" {...props} />,
    h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold mt-6 mb-4 pb-2 border-b border-[#3A3A38] text-white" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-lg font-bold mt-5 mb-3 pb-2 border-b border-[#3A3A38] text-white" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-md font-bold mt-4 mb-2 pb-1 border-b border-[#3A3A38]/50 text-white" {...props} />,
    blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-[#3A3A38] pl-4 italic text-[#A1A1AA] my-4" {...props} />,
    img: ({ node, ...props }: any) => {
      if (props.src) {
        const pageNumMatch = props.title?.match(/(\d+)/);
        const pageNumber = pageNumMatch ? parseInt(pageNumMatch[1]) : 0;
        return (
          <div className="my-6 w-full flex justify-center">
            <DiagramCard 
              diagramName={props.alt || ''} 
              pageNumber={pageNumber} 
              url={props.src as string} 
            />
          </div>
        );
      }
      return <img {...props} />;
    },
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-full md:max-w-[85%]">
        {message.batchAnswers && message.batchAnswers.length > 0 ? (
          <div className="flex flex-col gap-8">
            {message.batchAnswers.map((batch, index) => {
              let processedBatchContent = (batch.answer || '')
                .replace(/([^\n])\s+(\([ivx]+\))/gi, '$1\n\n$2')
                .replace(/^(\([ivx]+\)\s+)([^:\n]+):/gim, '**$1$2:**');
                
              let batchMathData: MathSolutionData | null = null;
              const bMatch = processedBatchContent.match(jsonBlockRegex);
              if (bMatch && bMatch[1]) {
                try {
                  const sanitizedJson = bMatch[1].replace(/\\/g, '\\\\').replace(/\\\\\\\\/g, '\\\\');
                  const parsed = JSON.parse(sanitizedJson);
                  if (parsed.solution) {
                    batchMathData = parsed.solution;
                    processedBatchContent = processedBatchContent.replace(bMatch[0], '').trim();
                  }
                } catch (e) {
                  console.error('Failed to parse batch math solution JSON', e);
                }
              }

              return (
                <div key={index} className="text-[14px] text-[#ECECEA] leading-relaxed max-w-none">
                  {/* Q1, Q2 … label */}
                  {batch.questionNo != null && (
                    <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-md bg-[#2C2C2A] border border-[#3A3A38]">
                      <span className="text-[11px] font-semibold text-[#818CF8] tracking-wide">
                        Q{batch.questionNo}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={markdownComponents}
                    >
                      {processedBatchContent}
                    </ReactMarkdown>
                    {batchMathData && <MathSolution data={batchMathData} />}
                  </motion.div>
                </div>
              );
            })}
          </div>
        ) : processedContent.startsWith('[ASSIGN_SUCCESS]') ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 my-4">
            <h3 className="text-[14px] font-semibold text-emerald-400 mb-2 whitespace-pre-wrap">
               {processedContent.replace('[ASSIGN_SUCCESS]', '').trim().split('\n\n')[0]}
            </h3>
            <div className="text-[13px] text-emerald-500/80 whitespace-pre-wrap leading-relaxed">
               {processedContent.replace('[ASSIGN_SUCCESS]', '').trim().split('\n\n').slice(1).join('\n\n')}
            </div>
          </div>
        ) : (
          <div className="text-[14px] text-[#ECECEA] leading-relaxed max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
            >
              {processedContent}
            </ReactMarkdown>
            {mathJsonData && <MathSolution data={mathJsonData} />}
          </div>
        )}

        {message.figures && message.figures.length > 0 && (
          <div className="mt-6 mb-4 flex flex-col gap-4 items-center w-full">
            {message.figures.map((fig, idx) => {
              // If the URL is already in the markdown content (inline diagram), don't render it again at the bottom
              if (fig.url && message.content.includes(fig.url)) {
                return null;
              }
              // If url is missing (e.g. faculty side when includeUrl is false), don't render an empty broken image
              if (!fig.url) {
                return null;
              }
              return (
                <DiagramCard 
                  key={idx} 
                  diagramName={fig.caption} 
                  pageNumber={fig.pageNumber} 
                  url={fig.url as string} 
                />
              );
            })}
          </div>
        )}
        
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

        {message.content && (
          <p className="text-[11px] text-[#5A5A58] mt-2">
            {message.rag_used ? 'Context-matched' : 'AI generated'}
          </p>
        )}
      </div>
    </div>
  );
}
