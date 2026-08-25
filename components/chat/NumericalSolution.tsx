import React from 'react';
import { CheckCircle2, FileDigit, List } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export interface NumericalExecutionStep {
  description: string;
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
          <div key={idx} className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between group hover:border-[#4A4A48] transition-colors">
            <div className="flex-1 w-full text-[13px] text-[#D1D1C7] leading-relaxed">
              <span className="font-semibold text-[#818CF8] mr-2">Step {idx + 1}:</span>
              {step.description}
            </div>
            <div className="w-full md:w-auto min-w-[200px] flex justify-center py-2 px-4 bg-[#252523] rounded-lg border border-[#3A3A38]/50 overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {`$$${step.calculation}$$`}
              </ReactMarkdown>
            </div>
          </div>
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
