import React from 'react';
import { CheckCircle2, Sigma } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export interface DerivationOperation {
  type: string;
  formula?: string;
  substitution?: string;
  transformation: string;
  result: string;
}

export interface DerivationStep {
  stepNumber: number;
  title: string;
  explanation: string;
  operations: DerivationOperation[];
  validation?: string;
}

export interface DerivationSolutionData {
  method?: string;
  steps: DerivationStep[];
  finalAnswer: string;
}

export function DerivationSolution({ data }: { data: DerivationSolutionData }) {
  return (
    <div className="flex flex-col gap-4 mt-4 mb-2">
      {data.method && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#2C2C2A]/60 border border-[#3A3A38] rounded-lg">
          <Sigma size={16} className="text-[#818CF8]" />
          <span className="text-[13px] font-semibold text-[#E5E5E5]">Method: {data.method}</span>
        </div>
      )}
      
      <div className="flex flex-col gap-4 relative border-l-2 border-[#3A3A38]/50 ml-3 pl-5">
        {data.steps.map((step, idx) => (
          <DerivationStepCard key={idx} step={step} />
        ))}
      </div>

      <div className="mt-2 bg-[#2C2C2A] border-l-[3px] border-[#10B981] rounded-r-lg px-4 py-3 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <CheckCircle2 size={48} />
        </div>
        <h4 className="text-[12px] font-bold text-[#10B981] tracking-wider uppercase mb-1">Final Answer</h4>
        <div className="text-[15px] font-semibold text-[#ECECEA] relative z-10 overflow-x-auto py-2">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {`$$${data.finalAnswer}$$`}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function DerivationStepCard({ step }: { step: DerivationStep }) {
  return (
    <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 relative group hover:border-[#4A4A48] transition-colors">
      <div className="absolute -left-[30px] top-4 w-6 h-6 rounded-full bg-[#2C2C2A] border-2 border-[#3A3A38] flex items-center justify-center text-[10px] font-bold text-[#8C8C8A] group-hover:border-[#818CF8] group-hover:text-[#818CF8] transition-colors">
        {step.stepNumber}
      </div>

      <div className="mb-3">
        <h3 className="text-[14px] font-semibold text-[#ECECEA]">{step.title}</h3>
        {step.explanation && (
          <p className="text-[12px] text-[#A1A1AA] mt-1">{step.explanation}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 mt-4 text-[14px] text-[#E5E5E5] w-full">
        {step.operations.map((op, i) => (
          <div key={i} className="flex flex-col w-full bg-[#252523] border border-[#3A3A38]/50 rounded-lg p-3">
            <div className="flex flex-wrap gap-2 mb-2 items-center text-[11px] font-mono text-[#8C8C8A] uppercase tracking-wider">
              <span>{op.type}</span>
            </div>
            
            {(op.formula || op.substitution) && (
              <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-[#3A3A38]/50">
                {op.formula && (
                  <div className="flex gap-2 items-center text-[13px] text-[#818CF8]">
                    <span className="shrink-0 text-[#A1A1AA]">Using:</span>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`$${op.formula}$`}</ReactMarkdown>
                  </div>
                )}
                {op.substitution && (
                  <div className="flex gap-2 items-center text-[13px] text-[#F59E0B]">
                    <span className="shrink-0 text-[#A1A1AA]">Substitute:</span>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`$${op.substitution}$`}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {op.transformation && (
              <div className="text-[13px] text-[#D1D1C7] mb-3 whitespace-pre-wrap leading-relaxed">
                {op.transformation}
              </div>
            )}
            
            <div className="flex justify-center w-full py-2 overflow-x-auto bg-[#1C1C1B]/50 rounded border border-[#3A3A38]/30">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {`$$${op.result}$$`}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {step.validation && (
         <div className="mt-3 text-[12px] text-[#10B981]/80 italic flex gap-2 items-start bg-[#10B981]/5 p-2 rounded border border-[#10B981]/20">
           <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
           <span>{step.validation}</span>
         </div>
      )}
    </div>
  );
}
