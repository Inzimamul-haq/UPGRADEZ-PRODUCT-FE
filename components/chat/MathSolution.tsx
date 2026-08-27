import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, Calculator } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export interface MathWorkItem {
  explanation: string;
  equation: string;
}

export interface MathStep {
  step: number;
  title: string;
  work: MathWorkItem[];
  result: string;
}

export interface MathSolutionData {
  method?: string;
  steps: MathStep[];
  final_answer: {
    display: string;
  };
}

export function MathSolution({ data }: { data: MathSolutionData }) {
  return (
    <div className="flex flex-col gap-4 mt-4 mb-2">
      {data.method && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#2C2C2A]/60 border border-[#3A3A38] rounded-lg">
          <Calculator size={16} className="text-[#818CF8]" />
          <span className="text-[13px] font-semibold text-[#E5E5E5]">Method: {data.method}</span>
        </div>
      )}
      
      <div className="flex flex-col gap-3 relative border-l-2 border-[#3A3A38]/50 ml-3 pl-5">
        {data.steps.map((step, idx) => (
          <MathStepCard key={idx} step={step} />
        ))}
      </div>

      <div className="mt-2 bg-[#2C2C2A] border-l-[3px] border-[#10B981] rounded-r-lg px-4 py-3 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <CheckCircle2 size={48} />
        </div>
        <h4 className="text-[12px] font-bold text-[#10B981] tracking-wider uppercase mb-1">Final Answer</h4>
        <div className="text-[15px] font-semibold text-[#ECECEA] relative z-10">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {`$$${data.final_answer.display}$$`}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function MathStepCard({ step }: { step: MathStep }) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 relative group hover:border-[#4A4A48] transition-colors">
      {/* Step Badge */}
      <div className="absolute -left-[30px] top-4 w-6 h-6 rounded-full bg-[#2C2C2A] border-2 border-[#3A3A38] flex items-center justify-center text-[10px] font-bold text-[#8C8C8A] group-hover:border-[#818CF8] group-hover:text-[#818CF8] transition-colors">
        {step.step}
      </div>

      <div className="flex justify-between items-start gap-4 mb-3">
        <h3 className="text-[14px] font-semibold text-[#ECECEA]">{step.title}</h3>
        <button 
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2C2C2A] hover:bg-[#3A3A38] transition-colors text-[11px] font-medium text-[#A1A1AA]"
        >
          {showExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Explanation
        </button>
      </div>

      <div className="flex flex-col gap-4 mt-2 text-[14px] text-[#E5E5E5] w-full math-solution-container">
        {step.work.map((workItem, i) => (
          <div key={i} className="flex flex-col w-full">
            <AnimatePresence>
              {showExplanation && workItem.explanation && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mb-2 p-3 bg-[#252523] rounded-lg border border-[#3A3A38]/50 border-l-[2px] border-l-[#F59E0B] text-[13px] text-[#D1D1C7] leading-relaxed">
                    {workItem.explanation}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {(() => {
              const eq = workItem.equation;
              if (!eq || eq === 'undefined') return null;
              const isText = eq.includes('\n') || eq.includes('\\n') || eq.includes('$') || eq.split(/\s+/).filter(w => /^[a-zA-Z]{3,}$/.test(w)).length >= 3;
              const displayEq = isText ? eq.replace(/\\n/g, '\n\n').replace(/\n/g, '\n\n').replace(/\n\n\n\n/g, '\n\n') : `$$${eq}$$`;
              
              return (
                <div className={`w-full py-3 px-4 overflow-x-auto text-[13px] text-[#D1D1C7] ${isText ? 'text-left whitespace-pre-wrap leading-relaxed flex flex-col gap-2' : 'flex justify-center'}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {displayEq}
                  </ReactMarkdown>
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {step.result && (
        <div className="mt-4 pt-3 border-t border-[#3A3A38]/50 flex justify-end">
          <div className="px-3 py-1 bg-[#2C2C2A] rounded font-medium text-[13px] text-[#A1A1AA]">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {`$${step.result}$`}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
