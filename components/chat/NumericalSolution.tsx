import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, FileDigit, List, ChevronDown, ChevronUp, HelpCircle, Loader2, User, Bot } from 'lucide-react';
import { StepExplanation } from '@/lib/types';
import { useStepDoubt } from '@/hooks/useStepDoubt';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { parseMathLines, ensureBoxedIsMath, isCodeContent, formatMixedMath } from '@/lib/mathFormat';

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

export function NumericalSolution({ 
  data,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo = null,
}: { 
  data: NumericalSolutionData;
  messageId?: string;
  chatId?: string;
  stepExplanations?: StepExplanation[];
  batchQuestionNo?: number | null;
}) {
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
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
  {data.given && data.given.length > 0 && (
    <div className="min-w-0 flex flex-col gap-2">
      {data.given.map((g, i) => (
        <div
          key={i}
          className="min-w-0 flex items-start gap-2 text-[13px] text-[#D1D1C7]"
        >
          <div className="w-1.5 h-1.5 shrink-0 rounded-full bg-[#F59E0B] mt-[7px]" />

          <div className="min-w-0 flex-1 overflow-hidden">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ children }) => (
                  <p className="m-0 min-w-0 break-words leading-relaxed">
                    {children}
                  </p>
                ),
              }}
            >
              {formatMixedMath(g)}
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  )}

  {data.formulas_used && data.formulas_used.length > 0 && (
    <div className="min-w-0 flex flex-col gap-2">
      {data.formulas_used.map((f, i) => (
        <div
          key={i}
          className="
            min-w-0
            w-full
            flex
            items-start
            gap-2
            border
            border-[#3A3A38]/50
            bg-[#252523]
            px-2.5
            py-2
            rounded
            overflow-hidden
          "
        >
          <span
            className="
              shrink-0
              text-[10px]
              sm:text-[11px]
              text-[#8C8C8A]
              uppercase
              font-mono
              pt-[2px]
            "
          >
            Formula
          </span>

          <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
            <div className="min-w-0 text-[13px] text-[#D1D1C7]">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => (
                    <p className="m-0 min-w-0 leading-relaxed">
                      {children}
                    </p>
                  ),
                }}
              >
                {formatMixedMath(f)}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        {data.execution_steps.map((step, idx) => (
          <NumericalStepCard 
            key={idx} 
            step={step} 
            idx={idx} 
            messageId={messageId}
            chatId={chatId}
            stepExplanations={stepExplanations}
            batchQuestionNo={batchQuestionNo}
          />
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

function NumericalStepCard({ 
  step, 
  idx,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo
}: { 
  step: NumericalExecutionStep; 
  idx: number;
  messageId?: string;
  chatId?: string;
  stepExplanations?: StepExplanation[];
  batchQuestionNo?: number | null;
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [doubtInput, setDoubtInput] = useState('');
  
  const title = step.step_title || step.description || 'Calculation';
  const stepLabel = idx + 1;
  const { submitDoubt, loading } = useStepDoubt(chatId, messageId, batchQuestionNo);
  
  const [localDoubts, setLocalDoubts] = useState<StepExplanation[]>(() => {
    return stepExplanations.filter(e => e.question.startsWith(`Step ${stepLabel}`));
  });

  const handleDoubtSubmit = async (text: string) => {
    if (!text.trim() || loading) return;
    
    const doubtText = `Step ${stepLabel} — ${text}`;
    
    const newRow = await submitDoubt(stepLabel, doubtText);
    if (newRow) {
      setLocalDoubts(prev => [...prev, newRow]);
      setDoubtOpen(false);
      setDoubtInput('');
    }
  };

  return (
    <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 relative group hover:border-[#4A4A48] transition-colors">
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="text-[14px] font-semibold text-[#ECECEA] flex items-center gap-2">
          <span className="text-[#818CF8]">Step {stepLabel}:</span>
          {title}
        </div>
        <div className="flex items-center gap-2">
          {step.explanation && (
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2C2C2A] hover:bg-[#3A3A38] transition-colors text-[11px] font-medium text-[#A1A1AA]"
            >
              {showExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Explanation
            </button>
          )}
          {messageId && (
            <button 
              onClick={() => setDoubtOpen(!doubtOpen)}
              title="I have a doubt about this step"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#2C2C2A] hover:bg-[#3A3A38] transition-colors text-[#818CF8]"
            >
              <HelpCircle size={14} />
            </button>
          )}
        </div>
      </div>
      
      {doubtOpen && (
        <div className="mb-4 p-3 bg-[#252523] rounded-lg border border-[#3A3A38]/50 flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            {["Didn't understand this step", "Explain more simply", "Show an example"].map(chip => (
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

          // Code content → render as pre/code, never KaTeX
          if (isCodeContent(calc)) {
            return (
              <div className="w-full py-3 px-4 bg-[#252523] rounded-lg border border-[#3A3A38]/50 overflow-x-auto">
                <pre className="text-left text-[12.5px] font-mono text-[#E5A05F] whitespace-pre-wrap break-words leading-relaxed">
                  <code>{calc.replace(/\\n/g, '\n').replace(/\\"/g, '"')}</code>
                </pre>
              </div>
            );
          }

          const lines = parseMathLines(calc);
          const containerClass = "w-full py-3 px-4 bg-[#252523] rounded-lg border border-[#3A3A38]/50 overflow-x-auto text-[13px] text-[#D1D1C7]";
          
          if (lines.length === 0) return null;
          
          return (
            <div className={`${containerClass} flex flex-col gap-2 items-center`}>
              {lines.map((line, i) => (
                <div key={i} className="flex justify-center w-full">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {formatMixedMath(`${line.isImplies ? '\\textcolor{#818CF8}{\\implies} ' : ''} ${line.content}`, true)}
                  </ReactMarkdown>
                </div>
              ))}
            </div>
          );
        })()}
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
  );
}
