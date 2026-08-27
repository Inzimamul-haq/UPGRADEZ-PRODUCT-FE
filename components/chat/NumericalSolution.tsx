import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, FileDigit, List, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { parseMathLines, ensureBoxedIsMath } from '@/lib/mathFormat';

export interface NumericalExecutionStep {
  step_title?: string;
  explanation?: string;
  description?: string;
  calculation: string;
}

export interface NumericalSolutionData {
  method?: string;
  given: string[];
  formulas_used: string[];
  execution_steps: NumericalExecutionStep[];
  finalAnswer: string;
}

export function NumericalSolution({ data }: { data: NumericalSolutionData }) {
  return (
    <div className="flex flex-col gap-4 mt-4 mb-2">
      {data.method && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#2C2C2A]/60 border border-[#3A3A38] rounded-lg">
          <FileDigit size={16} className="text-[#818CF8]" />
          <span className="text-[13px] font-semibold text-[#E5E5E5]">Method: {data.method}</span>
        </div>
      )}

      {((data.given && data.given.length > 0) || (data.formulas_used && data.formulas_used.length > 0)) && (
        <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4">
           <h3 className="text-[12px] font-bold text-[#A1A1AA] uppercase tracking-wider mb-3 flex items-center gap-2">
             <List size={14} /> Given Data
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {data.given && data.given.length > 0 && (
               <div className="flex flex-col gap-2">
                 {data.given.map((g, i) => (
                   <div key={i} className="text-[13px] text-[#D1D1C7] flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                     <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`$${g}$`}</ReactMarkdown>
                   </div>
                 ))}
               </div>
             )}
             {data.formulas_used && data.formulas_used.length > 0 && (
               <div className="flex flex-col gap-2">
                 {data.formulas_used.map((f, i) => (
                   <div key={i} className="text-[13px] text-[#D1D1C7] flex items-center gap-2 border border-[#3A3A38]/50 bg-[#252523] px-2 py-1 rounded">
                     <span className="text-[11px] text-[#8C8C8A] uppercase font-mono mr-1">Formula</span>
                     <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`$${f}$`}</ReactMarkdown>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        {data.execution_steps.map((step, idx) => (
          <NumericalStepCard key={idx} step={step} idx={idx} />
        ))}
      </div>

      <div className="mt-2 bg-[#2C2C2A] border-l-[3px] border-[#10B981] rounded-r-lg px-4 py-3 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <CheckCircle2 size={48} />
        </div>
        <h4 className="text-[12px] font-bold text-[#10B981] tracking-wider uppercase mb-1">Final Answer</h4>
        <div className="text-[15px] font-semibold text-[#ECECEA] relative z-10 py-2 w-full prose prose-invert prose-p:my-1 prose-math:justify-center">
          {(() => {
            const ans = ensureBoxedIsMath(data.finalAnswer);
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
    </div>
  );
}

function NumericalStepCard({ step, idx }: { step: NumericalExecutionStep; idx: number }) {
  const [showExplanation, setShowExplanation] = useState(false);
  const title = step.step_title || step.description || 'Calculation';

  return (
    <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 relative group hover:border-[#4A4A48] transition-colors">
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="text-[14px] font-semibold text-[#ECECEA] flex items-center gap-2">
          <span className="text-[#818CF8]">Step {idx + 1}:</span>
          {title}
        </div>
        {step.explanation && (
          <button 
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2C2C2A] hover:bg-[#3A3A38] transition-colors text-[11px] font-medium text-[#A1A1AA]"
          >
            {showExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Explanation
          </button>
        )}
      </div>

      <AnimatePresence>
        {showExplanation && step.explanation && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-3 bg-[#252523] rounded-lg border border-[#3A3A38]/50 border-l-[2px] border-l-[#F59E0B] text-[13px] text-[#D1D1C7] leading-relaxed">
              {step.explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col w-full mt-2 text-[14px] text-[#E5E5E5]">
        {(() => {
          const calc = step.calculation;
          if (!calc || calc === 'undefined') return null;
          
          const lines = parseMathLines(calc);
          const containerClass = "w-full py-3 px-4 bg-[#252523] rounded-lg border border-[#3A3A38]/50 overflow-x-auto text-[13px] text-[#D1D1C7]";
          
          if (lines.length === 0) return null;
          
          return (
            <div className={`${containerClass} flex flex-col gap-2 items-center`}>
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
  );
}
