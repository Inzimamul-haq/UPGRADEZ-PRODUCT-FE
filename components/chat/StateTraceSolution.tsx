import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Loader2, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepExplanation } from '@/lib/types';
import { useStepDoubt } from '@/hooks/useStepDoubt';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export interface StateTraceStep {
  step_number: number;
  action: string;
  reason: string;
  highlight?: string;
  state_after: string;
}

export interface StateTraceSolutionData {
  initial_state: string;
  steps: StateTraceStep[];
  final_answer: string;
}

function StepCard({ 
  step, 
  isLast,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo
}: { 
  step: StateTraceStep; 
  isLast: boolean;
  messageId?: string;
  chatId?: string;
  stepExplanations?: StepExplanation[];
  batchQuestionNo?: number | null;
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [doubtInput, setDoubtInput] = useState('');
  
  const stepLabel = step.step_number;
  const { submitDoubt, loading } = useStepDoubt(chatId, messageId, batchQuestionNo);
  
  const [localDoubts, setLocalDoubts] = useState<StepExplanation[]>(() => {
    return stepExplanations.filter(e => e.question.startsWith(`Step ${stepLabel}`));
  });

  const handleDoubtSubmit = async (text: string) => {
    if (!text.trim() || loading) return;
    
    const stepContent = `${step.action}\n${step.reason}\n${step.state_after}`;
    const doubtText = `Step ${stepLabel} — ${text}`;
    
    const newRow = await submitDoubt(stepLabel, stepContent, doubtText);
    if (newRow) {
      setLocalDoubts(prev => [...prev, newRow]);
      setDoubtOpen(false);
      setDoubtInput('');
    }
  };

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-[-24px] w-[2px] bg-[#3A3A38]"></div>
      )}
      
      {/* Step Node */}
      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#2C2C2A] border-2 border-[#3A3A38] flex items-center justify-center text-[10px] font-bold text-[#8C8C8A]">
        {step.step_number}
      </div>

      <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 relative group hover:border-[#4A4A48] transition-colors mb-6 shadow-sm">
        {/* Action Header */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className={`text-[14px] font-semibold text-[#ECECEA] prose prose-invert prose-p:my-0 flex-1 ${!showExplanation ? 'line-clamp-2' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {step.action}
            </ReactMarkdown>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2C2C2A] hover:bg-[#3A3A38] transition-colors text-[11px] font-medium text-[#A1A1AA] shrink-0 mt-0.5"
            >
              {showExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Explanation
            </button>
            {messageId && (
              <button 
                onClick={() => setDoubtOpen(!doubtOpen)}
                title="I have a doubt about this step"
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#2C2C2A] hover:bg-[#3A3A38] transition-colors text-[#818CF8] shrink-0 mt-0.5"
              >
                <HelpCircle size={14} />
              </button>
            )}
          </div>
        </div>

        {doubtOpen && (
          <div className="mb-4 p-3 bg-[#252523] rounded-lg border border-[#3A3A38]/50 flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
              {["Didn't understand this step", "Explain more simply", "Why does state change like this?"].map(chip => (
                <button
                  key={chip}
                  onClick={() => handleDoubtSubmit(chip)}
                  disabled={loading}
                  className="text-[11px] px-2.5 py-1 bg-[#2C2C2A] border border-[#3A3A38] rounded-md text-[#D1D1C7] hover:bg-[#3A3A38] disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={doubtInput}
                onChange={e => setDoubtInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDoubtSubmit(doubtInput)}
                disabled={loading}
                placeholder="Ask something specific..."
                className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-md px-3 py-1.5 text-[12px] text-[#ECECEA] placeholder-[#8C8C8A] focus:outline-none focus:border-[#818CF8]"
              />
              {loading && <Loader2 size={14} className="animate-spin text-[#818CF8]" />}
            </div>
          </div>
        )}

        {/* Expandable Reason */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="p-3 bg-[#252523] rounded-lg border border-[#3A3A38]/50 border-l-[2px] border-l-[#F59E0B] text-[13px] text-[#D1D1C7] leading-relaxed flex flex-col gap-2">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {step.reason}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State After */}
        <div className="bg-[#222220] rounded-lg border border-[#3A3A38] p-4 flex items-center justify-center text-center">
          <div className="text-sm font-mono text-[#ECECEA]">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {step.state_after}
            </ReactMarkdown>
          </div>
        </div>

        {localDoubts.map(d => (
          <motion.div 
            key={d.id} 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-[#252523] border border-[#3A3A38]/50 border-l-[3px] border-l-[#818CF8] rounded-xl flex flex-col gap-4"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-[#818CF8]/20 flex items-center justify-center shrink-0 mt-0.5">
                <User size={12} className="text-[#818CF8]" />
              </div>
              <div className="text-[12.5px] text-[#ECECEA] font-medium leading-relaxed">
                {d.question.replace(/^Step [^\s]+ — /, '')}
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={12} className="text-amber-500" />
              </div>
              <div className="text-[13px] text-[#D1D1C7] prose prose-invert prose-p:my-0 prose-p:leading-relaxed w-full min-w-0">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{d.answer}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function StateTraceSolution({ 
  data,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo = null,
}: { 
  data: StateTraceSolutionData;
  messageId?: string;
  chatId?: string;
  stepExplanations?: StepExplanation[];
  batchQuestionNo?: number | null;
}) {
  if (!data || !data.steps) {
    return <div className="text-red-400">Invalid state trace data.</div>;
  }

  return (
    <div className="font-sans text-[#ECECEA] space-y-6">
      <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl overflow-hidden shadow-lg p-5">
        
        {/* Title */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#3A3A38] pb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          <span className="font-semibold text-sm tracking-wide">Step-by-Step Trace</span>
        </div>

        {/* Initial State */}
        <div className="mb-8">
          <span className="text-[11px] font-bold text-green-400 uppercase mb-2 block tracking-wider">Initial State</span>
          <div className="bg-[#222220] rounded-xl border border-[#3A3A38] p-5 flex items-center justify-center text-center">
            <div className="text-lg font-mono text-[#ECECEA]">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {data.initial_state}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Steps List */}
        <div className="mt-6">
          <span className="text-[11px] font-bold text-[#8C8C8A] uppercase mb-4 block tracking-wider">Execution Steps</span>
          <div className="flex flex-col">
            {data.steps.map((step, idx) => (
              <StepCard 
                key={idx} 
                step={step} 
                isLast={idx === data.steps.length - 1}
                messageId={messageId}
                chatId={chatId}
                stepExplanations={stepExplanations}
                batchQuestionNo={batchQuestionNo}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Final Answer */}
      {data.final_answer && (
        <div className="bg-[#1C1C1B] p-5 rounded-xl border border-green-500/30">
          <span className="text-[11px] font-bold text-green-400 uppercase mb-2 block tracking-wider">Final Result</span>
          <div className="prose prose-invert max-w-none text-sm text-[#ECECEA]">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {data.final_answer}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
