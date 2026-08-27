import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { parseMathLines, ensureBoxedIsMath } from '@/lib/mathFormat';

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

export interface LegacySolutionData {
  method?: string;
  steps: MathStep[];
  final_answer: {
    display: string;
  };
}

export function LegacySolution({ data }: { data: LegacySolutionData }) {
  return (
    <div className="flex flex-col gap-6 mt-6 mb-4 w-full">
      {/* Concept Header */}
      {data.method && (
        <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
          <Lightbulb size={18} className="text-indigo-400" />
          <span className="text-[14px] font-semibold text-indigo-100 tracking-wide">
            Concept: {data.method}
          </span>
        </div>
      )}
      
      {/* Timeline Steps */}
      <div className="relative pl-6 flex flex-col gap-8 w-full mt-2">
        {/* Vertical Timeline Line */}
        <div className="absolute left-0 top-2 bottom-6 w-[2px] bg-gradient-to-b from-indigo-500/40 via-purple-500/30 to-emerald-500/20 rounded-full"></div>
        
        {data.steps.map((step, idx) => (
          <LegacyStepCard key={idx} step={step} />
        ))}
      </div>

      {/* Final Conclusion */}
      {data.final_answer && data.final_answer.display && (
        <div className="mt-4 bg-[#1C1C1B] border border-[#3A3A38] rounded-xl px-5 py-4 shadow-xl relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
          <div className="absolute opacity-5 -right-4 -bottom-4">
            <CheckCircle2 size={100} />
          </div>
          <h4 className="text-[11px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-2">Final Conclusion</h4>
          <div className="text-[16px] font-medium text-[#ECECEA] relative z-10 w-full prose prose-invert prose-p:my-1 prose-math:justify-center">
            {(() => {
              const ans = ensureBoxedIsMath(data.final_answer.display);
              if (!ans || ans === 'undefined') return null;
              
              return (
                <div className="flex flex-col text-left w-full overflow-x-auto">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {ans}
                  </ReactMarkdown>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function LegacyStepCard({ step }: { step: MathStep }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex flex-col gap-3 w-full group"
    >
      {/* Timeline Dot */}
      <div className="absolute -left-[31px] top-0.5 w-7 h-7 rounded-full bg-[#1C1C1B] border-2 border-indigo-500/50 flex items-center justify-center text-[12px] font-bold text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)] z-10 group-hover:border-indigo-400 group-hover:text-indigo-200 transition-colors">
        {step.step}
      </div>

      <h3 className="text-[15px] font-semibold text-indigo-50 mb-1 ml-1 tracking-wide flex items-center gap-2">
        {step.title}
      </h3>

      <div className="flex flex-col gap-3 w-full ml-1">
        {step.work.map((workItem, i) => (
          <div key={i} className="flex flex-col gap-2 w-full">
            {/* Explanation text */}
            {workItem.explanation && (
              <div className="text-[13.5px] text-[#A1A1AA] leading-relaxed">
                {workItem.explanation}
              </div>
            )}
            
            {/* Equation / Formulation box */}
            {workItem.equation && workItem.equation !== 'undefined' && (
              <div className="bg-[#181817] border border-[#2A2A28] rounded-lg p-3 w-full shadow-inner">
                {(() => {
                  const eq = workItem.equation;
                  if (!eq || eq === 'undefined') return null;
                  
                  const lines = parseMathLines(eq);
                  if (lines.length === 0) return null;
                  
                  return (
                    <div className="w-full overflow-x-auto flex flex-col gap-2 items-center text-[15px] text-indigo-200">
                      {lines.map((line, i) => (
                        <div key={i} className="flex justify-center w-full">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {`$$ ${line.isImplies ? '\\textcolor{#818CF8}{\\implies} ' : ''} ${line.content} $$`}
                          </ReactMarkdown>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ))}

        {/* Step Result Outcome */}
        {step.result && (
          <div className="mt-1 flex items-start gap-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-2.5 w-max max-w-full">
            <ArrowRight size={14} className="text-indigo-400 mt-0.5 shrink-0" />
            <div className="text-[13px] font-medium text-indigo-300/90 italic">
              {(() => {
                const res = step.result;
                const lines = parseMathLines(res);
                if (lines.length === 0) return null;
                
                return (
                  <div className="flex flex-col gap-2 items-start">
                    {lines.map((line, i) => (
                      <div key={i} className="flex justify-center w-full">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {`$$ ${line.isImplies ? '\\textcolor{#818CF8}{\\implies} ' : ''} ${line.content} $$`}
                        </ReactMarkdown>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
