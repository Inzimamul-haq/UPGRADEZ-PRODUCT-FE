import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessageProps } from '@/lib/types';
import { FileDown, Users, CheckCircle, RefreshCcw, Copy, Pencil, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import 'katex/dist/katex.min.css';
import { DiagramCard } from './DiagramCard';

import { SolutionRenderer, MultiSchemaData } from './SolutionRenderer';

// Helper to safely extract and parse math JSON from markdown text
function parseMathSolution(text: string): { data: MultiSchemaData | null; remainingText: string } {
  let data: MultiSchemaData | null = null;
  let match = text.match(/```(?:json)?\s*(\{[\s\S]*?"solution"[\s\S]*?\})\s*```/i);
  
  if (!match) {
    const startIndex = text.indexOf('{');
    if (startIndex !== -1) {
      let braceCount = 0;
      for (let i = startIndex; i < text.length; i++) {
        if (text[i] === '{') braceCount++;
        else if (text[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            const possibleJson = text.substring(startIndex, i + 1);
            if (possibleJson.includes('"solution"')) {
              match = [possibleJson, possibleJson]; 
              break;
            }
          }
        }
      }
    }
  }

  let remainingText = text;
  if (match && match[1]) {
    try {
      const sanitizedJson = match[1].replace(/\\(?!")/g, '\\\\').replace(/\\\\\\\\/g, '\\\\');
      let parsed;
      try {
        parsed = JSON.parse(sanitizedJson);
      } catch (err) {
        parsed = new Function('return ' + match[1])();
      }
      
      if (parsed && parsed.solution) {
        data = parsed;
        remainingText = remainingText
          .replace(match[0], '')
          .replace(/```(?:json)?\s*```/ig, '')
          .replace(/%%EXECUTION_JSON_START%%/g, '')
          .replace(/%%EXECUTION_JSON_END%%/g, '')
          .trim();
      }
    } catch (e) {
      console.error('Failed to parse math solution JSON', e);
    }
  }
  
  return { data, remainingText };
}

export function ChatMessage({ message, onAction, onEditSubmit }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isEditable = !message.isAssigned && message.role === 'assistant' && !!onEditSubmit && !!message.actions?.some(a => a.id === 'generate_pdf');
  const visibleActions = message.actions?.filter(a => {
    if (message.isAssigned && (a.id === 'generate_pdf' || a.id === 'pick_exam_paper')) return false;
    return true;
  });

  if (isUser) {
    if (isEditing) {
      return (
        <div className="flex justify-end">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col mt-2 mb-4 relative rounded-xl overflow-hidden ring-1 ring-[#3A3A38] focus-within:ring-amber-500/50 transition-all duration-300 bg-[#161615] w-[90vw] sm:w-[400px] md:w-[500px]"
          >
            <textarea
              ref={el => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }
              }}
              value={editContent}
              onChange={e => {
                setEditContent(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              className="w-full bg-transparent text-[#ECECEA] text-[13px] p-4 min-h-[80px] max-h-[50vh] resize-none focus:outline-none"
              disabled={isSaving}
            />
            <div className="flex justify-end gap-2 p-2 bg-[#1C1C1B] border-t border-[#3A3A38]">
              <button 
                onClick={() => { setIsEditing(false); setEditContent(message.content || ''); }} 
                className="px-3 py-1 text-[11px] font-medium text-[#8C8C8A] hover:text-[#ECECEA] transition-colors rounded-lg hover:bg-[#333331]"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (onEditSubmit) {
                    setIsSaving(true);
                    try {
                      await onEditSubmit(message.id, editContent);
                      setIsEditing(false);
                    } catch (e) {
                      // err
                    } finally {
                      setIsSaving(false);
                    }
                  }
                }} 
                disabled={isSaving || !editContent.trim() || editContent === message.content} 
                className="px-4 py-1 text-[11px] font-medium bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg shadow-lg hover:from-amber-500 hover:to-amber-400 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save & Resubmit'}
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="flex justify-end w-full">
        <div className="flex flex-col items-end gap-1.5 max-w-[90%] md:max-w-[70%]">
          <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-4 py-2 w-auto text-left">
            <p className="text-[14px] text-[#ECECEA] leading-relaxed break-words">
              {message.content}
            </p>
          </div>
          <div className=" flex items-center gap-1 mt-0.5">
            <button
              onClick={handleCopy}
              title="Copy message"
              className="p-1.5 text-[#8C8C8A] hover:text-[#ECECEA] bg-transparent rounded transition-colors hover:bg-[#333331]"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              
            </button>
            {/* <button
              onClick={() => { setIsEditing(true); setEditContent(message.content || ''); }}
              title="Edit message"
              className="p-1.5 text-[#8C8C8A] hover:text-[#ECECEA] bg-transparent rounded transition-colors hover:bg-[#333331]"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={async () => {
                if (onEditSubmit) {
                  await onEditSubmit(message.id, message.content || '');
                }
              }}
              title="Regenerate message"
              className="p-1.5 text-[#8C8C8A] hover:text-[#ECECEA] bg-transparent rounded transition-colors hover:bg-[#333331]"
            >
              <RefreshCcw size={12} />
            </button> */}
          </div>
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

  const parsedMain = parseMathSolution(processedContent);
  const mathJsonData = parsedMain.data;
  processedContent = parsedMain.remainingText;

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

      if (content.startsWith('Example:') || content.startsWith('**Example:**')) {
        return (
          <div className="bg-[#2C2C2A]/50 border border-[#3A3A38] rounded-lg p-3.5 my-3 relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#10B981]/80"></div>
             <p className="text-[13.5px] text-[#D1D1C7] whitespace-pre-wrap leading-relaxed pl-2" {...props} />
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
                
              const parsedBatch = parseMathSolution(processedBatchContent);
              const batchMathData = parsedBatch.data;
              processedBatchContent = parsedBatch.remainingText;

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
                    {batchMathData && <SolutionRenderer data={batchMathData} />}
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
            {message.isAssigned && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 mb-3">
                <CheckCircle size={12} className="text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-500 tracking-wide uppercase">Assigned</span>
              </div>
            )}
            
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div 
                  key="edit"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="flex flex-col mt-2 mb-4 relative rounded-xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-[#3A3A38] focus-within:ring-amber-500/50 transition-all duration-300 bg-[#161615] w-[90vw] sm:w-[500px] md:w-[700px] lg:w-[850px] max-w-full"
                >
                  <div className="bg-[#1C1C1B] border-b border-[#3A3A38] px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[12px] font-semibold text-[#D1D1C7] uppercase tracking-wider">Edit Mode</span>
                    </div>
                  </div>
                  <textarea
                    ref={el => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                    value={editContent}
                    onChange={e => {
                      setEditContent(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    className="w-full bg-transparent text-[#ECECEA] text-[13px] p-5 min-h-[150px] max-h-[70vh] resize-none custom-scrollbar focus:outline-none leading-relaxed"
                    disabled={isSaving}
                    placeholder="Make changes to the AI generated content..."
                  />
                  <div className="flex justify-end gap-3 p-3 bg-[#1C1C1B] border-t border-[#3A3A38]">
                    <button 
                      onClick={() => { setIsEditing(false); setEditContent(message.content || ''); }} 
                      className="px-4 py-1.5 text-[12px] font-medium text-[#8C8C8A] hover:text-[#ECECEA] transition-colors rounded-lg hover:bg-[#333331]"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={async () => {
                        if (onEditSubmit) {
                          setIsSaving(true);
                          try {
                            await onEditSubmit(message.id, editContent);
                            setIsEditing(false);
                          } catch (e) {
                            // Error toast handled by parent
                          } finally {
                            setIsSaving(false);
                          }
                        }
                      }} 
                      disabled={isSaving || !editContent.trim() || editContent === message.content} 
                      className="px-5 py-1.5 text-[12px] font-medium bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg shadow-lg hover:shadow-amber-500/20 hover:from-amber-500 hover:to-amber-400 transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={markdownComponents}
                  >
                    {processedContent}
                  </ReactMarkdown>
                  {mathJsonData && <SolutionRenderer data={mathJsonData} />}
                </motion.div>
              )}
            </AnimatePresence>
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
        
        {((visibleActions && visibleActions.length > 0) || (isEditable && !isEditing)) && (
          <div className="flex flex-wrap gap-2 mt-3 mb-2">
            {visibleActions?.map(action => (
              <button
                key={action.id}
                onClick={() => onAction && onAction(message.id, action.id)}
                disabled={isEditing}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[#1C1C1B] bg-[#ECECEA] border border-[#ECECEA] rounded-lg px-3 py-1.5 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {renderIcon(action.icon)}
                {action.label}
              </button>
            ))}
            
            {isEditable && !isEditing && (
              <button
                onClick={() => { setIsEditing(true); setEditContent(message.content || ''); }}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[#8C8C8A] bg-transparent border border-[#3A3A38] rounded-lg px-3 py-1.5 hover:text-[#ECECEA] hover:bg-[#333331] transition-colors"
              >
                Edit
              </button>
            )}
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
