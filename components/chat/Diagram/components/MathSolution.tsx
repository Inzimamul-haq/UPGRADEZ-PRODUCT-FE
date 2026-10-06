import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, Calculator } from 'lucide-react';
import { MathMarkdown } from '@/components/ui/MathMarkdown';
import { MathBlock } from '@/components/ui/MathBlock';
import { parseMathLines, isCodeContent, isPlainText } from '@/lib/mathFormat';

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
        <div className="text-[15px] font-semibold text-[#ECECEA] relative z-10 py-2 w-full prose prose-invert prose-p:my-1 prose-math:justify-center">
          {data.final_answer?.display && data.final_answer.display !== 'undefined' ? (
            <div className="flex flex-col text-left w-full overflow-x-auto">
              <MathMarkdown>{data.final_answer.display}</MathMarkdown>
            </div>
          ) : null}
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

      <AnimatePresence>
        {showExplanation && step.work.some(w => w.explanation) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-3 bg-[#252523] rounded-lg border border-[#3A3A38]/50 border-l-[2px] border-l-[#F59E0B] text-[13px] text-[#D1D1C7] leading-relaxed flex flex-col gap-2 prose prose-invert prose-p:my-1 max-w-none prose-td:border prose-td:border-[#3A3A38] prose-th:border prose-th:border-[#3A3A38]">
              {step.work.map((w, i) => w.explanation ? (
                <div key={i}>
                  <MathMarkdown>
                    {w.explanation}
                  </MathMarkdown>
                </div>
              ) : null)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col w-full math-solution-container mt-2 text-[14px] text-[#E5E5E5]">
        {step.work.map((workItem, i) => {
          const eq = workItem.equation;
          if (!eq || eq === 'undefined') return null;

          return (
            <div key={i} className={`flex flex-col w-full ${i > 0 ? 'mt-5' : ''}`}>
              {(() => {
                // Code content → plain pre/code block, never KaTeX
                if (isCodeContent(eq)) {
                  return (
                    <div className="w-full py-2 px-4 bg-[#1C1C1B]/60 border border-[#3A3A38]/50 rounded-lg overflow-x-auto">
                      <pre className="text-left text-[12.5px] font-mono text-[#E5A05F] whitespace-pre-wrap break-words leading-relaxed">
                        <code>{eq.replace(/\\n/g, '\n').replace(/\\"/g, '"')}</code>
                      </pre>
                    </div>
                  );
                }

                // Plain text → standard text rendering, no KaTeX $$ wrapper
                if (isPlainText(eq)) {
                  return (
                    <div className="w-full py-2 px-4 text-[13.5px] text-[#D1D1C7] leading-relaxed">
                      <MathMarkdown>
                        {eq}
                      </MathMarkdown>
                    </div>
                  );
                }

                const lines = parseMathLines(eq);
                if (lines.length === 0) return null;
                
                return (
                  <div className="w-full py-2 px-4 overflow-x-auto text-[13px] text-[#D1D1C7] flex flex-col gap-2 items-center">
                    {lines.map((line, pIdx) => (
                        <div key={pIdx} className="flex justify-center w-full">
                          <MathBlock latex={`${line.isImplies ? '\\implies ' : ''}${line.content}`} display={true} />
                        </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {step.result && (
        <div className="mt-5 bg-[#252523] rounded-r-lg px-4 py-3 relative overflow-hidden">
          <h4 className="text-[11px] font-bold text-[#A1A1AA] tracking-wider uppercase mb-2">Step Result</h4>
          <div className="text-[14px] font-semibold text-[#D1D1C7] relative z-10 overflow-x-auto">
            {(() => {
              const res = step.result;

              // Code content → plain pre/code, no KaTeX
              if (isCodeContent(res)) {
                return (
                  <pre className="w-full text-left text-[12.5px] font-mono text-[#E5A05F] whitespace-pre-wrap break-words leading-relaxed">
                    <code>{res.replace(/\\n/g, '\n').replace(/\\"/g, '"')}</code>
                  </pre>
                );
              }

              // Plain text → standard text rendering, no KaTeX $$ wrapper
              if (isPlainText(res)) {
                return (
                  <div className="w-full text-left text-[13.5px] text-[#D1D1C7] leading-relaxed pb-1">
                    <MathMarkdown>
                      {res}
                    </MathMarkdown>
                  </div>
                );
              }

              const lines = parseMathLines(res);
              if (lines.length === 0) return null;
              
              return (
                <div className="flex flex-col gap-2 items-center">
                  {lines.map((line, i) => (
                    <div key={i} className="flex justify-center w-full">
                      <MathBlock latex={`${line.isImplies ? '\\implies ' : ''}${line.content}`} display={true} />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}