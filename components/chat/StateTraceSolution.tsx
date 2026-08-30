import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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

function StepCard({ step, isLast }: { step: StateTraceStep; isLast: boolean }) {
  const [showExplanation, setShowExplanation] = useState(false);

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
          <button 
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2C2C2A] hover:bg-[#3A3A38] transition-colors text-[11px] font-medium text-[#A1A1AA] shrink-0"
          >
            {showExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Explanation
          </button>
        </div>

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
      </div>
    </div>
  );
}

export function StateTraceSolution({ data }: { data: StateTraceSolutionData }) {
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
              <StepCard key={idx} step={step} isLast={idx === data.steps.length - 1} />
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
