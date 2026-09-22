import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sigma, HelpCircle, Loader2, User, Bot } from 'lucide-react';
import { StepExplanation } from '@/lib/types';
import { useStepDoubt } from '@/hooks/useStepDoubt';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { isCodeContent, formatMixedMath, ensureBoxedIsMath, isMarkdownTable, isPlainText, fixFlattenedMarkdown } from '@/lib/mathFormat';

export interface DerivationOperation {
  type: string;
  // Old schema
  formula?: string;
  substitution?: string;
  transformation?: string;
  result?: string;
  // New schema
  before?: string;
  action?: string;
  after?: string;
  uses?: string[];
}

export interface DerivationEquation {
  id: string;
  label: string;
  latex: string;
  source: string;
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
  equations?: DerivationEquation[];
  steps: DerivationStep[];
  finalAnswer: string;
}

export function DerivationSolution({ 
  data,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo = null,
}: { 
  data: DerivationSolutionData;
  messageId?: string;
  chatId?: string;
  stepExplanations?: StepExplanation[];
  batchQuestionNo?: number | null;
}) {
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
          <DerivationStepCard 
            key={idx} 
            step={step} 
            equations={data.equations} 
            messageId={messageId}
            chatId={chatId}
            stepExplanations={stepExplanations}
            batchQuestionNo={batchQuestionNo}
          />
        ))}
      </div>

      <div className="mt-2 bg-[#2C2C2A] rounded-lg px-4 py-3 shadow-md relative overflow-hidden">
        <h4 className="text-[12px] font-bold text-[#10B981] tracking-wider uppercase mb-1">Final Answer</h4>
        <div className="text-[15px] font-semibold text-[#ECECEA] relative z-10 overflow-x-auto py-2">
          {(() => {
            let ans = ensureBoxedIsMath(data.finalAnswer);
            if (!ans || ans === 'undefined') return null;
            
            if (isPlainText(ans) || isCodeContent(ans)) {
              ans = ans.replace(/^\s*\$\$?|\$\$?\s*$/g, '');
              ans = fixFlattenedMarkdown(ans);
              return (
                <div className="flex flex-col text-left w-full overflow-x-auto text-[13.5px] text-[#D1D1C7] leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {ans}
                  </ReactMarkdown>
                </div>
              );
            }
            
            return (
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                {ans}
              </ReactMarkdown>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function DerivationStepCard({ 
  step, 
  equations,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo
}: { 
  step: DerivationStep; 
  equations?: DerivationEquation[];
  messageId?: string;
  chatId?: string;
  stepExplanations?: StepExplanation[];
  batchQuestionNo?: number | null;
}) {
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [doubtInput, setDoubtInput] = useState('');
  
  const stepLabel = step.stepNumber;
  const { submitDoubt, loading } = useStepDoubt(chatId, messageId, batchQuestionNo);
  
  const [localDoubts, setLocalDoubts] = useState<StepExplanation[]>(() => {
    return stepExplanations.filter(e => e.question.startsWith(`Step ${stepLabel}`));
  });

  const handleDoubtSubmit = async (text: string) => {
    if (!text.trim() || loading) return;
    
    const doubtText = `Step ${stepLabel} — ${text}`;
    
    const newRow = await submitDoubt(stepLabel.toString(), doubtText);
    if (newRow) {
      setLocalDoubts(prev => [...prev, newRow]);
      setDoubtOpen(false);
      setDoubtInput('');
    }
  };

  return (
    <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 relative group hover:border-[#4A4A48] transition-colors">
      <div className="absolute -left-[30px] top-4 w-6 h-6 rounded-full bg-[#2C2C2A] border-2 border-[#3A3A38] flex items-center justify-center text-[10px] font-bold text-[#8C8C8A] group-hover:border-[#818CF8] group-hover:text-[#818CF8] transition-colors">
        {step.stepNumber}
      </div>

      <div className="mb-3 flex justify-between items-start gap-4">
        <div>
          <h3 className="text-[14px] font-semibold text-[#ECECEA]">{step.title}</h3>
          {step.explanation && (
            <div className="text-[12px] text-[#A1A1AA] mt-1 prose prose-invert prose-p:my-1 max-w-none prose-td:border prose-td:border-[#3A3A38] prose-th:border prose-th:border-[#3A3A38]">
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                {fixFlattenedMarkdown(step.explanation)}
              </ReactMarkdown>
            </div>
          )}
        </div>
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

      <div className="flex flex-col gap-3 mt-4 text-[14px] text-[#E5E5E5] w-full">
        {step.operations.map((op, i) => {
          const prevOp = i > 0 ? step.operations[i - 1] : null;
          let showBefore = !prevOp || op.before !== prevOp.after;

          if (showBefore && op.uses && equations && op.before) {
            const usedEqsLatex = op.uses.map(id => equations.find(e => e.id === id)?.latex).filter(Boolean);
            if (usedEqsLatex.some(latex => latex?.replace(/\s/g, '') === op.before?.replace(/\s/g, ''))) {
              showBefore = false;
            }
          }

          return (
            <div key={i} className="flex flex-col w-full bg-[#252523] border border-[#3A3A38]/50 rounded-lg p-3">
              <div className="flex flex-wrap gap-2 mb-2 items-center text-[11px] font-mono text-[#8C8C8A] uppercase tracking-wider">
                <span>{op.type}</span>
              </div>
              
              {(op.formula || op.substitution) && (
                <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-[#3A3A38]/50">
                  {op.formula && (
                    <div className="flex gap-2 items-center text-[13px] text-[#818CF8]">
                      <span className="shrink-0 text-[#A1A1AA]">Using:</span>
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{formatMixedMath(op.formula)}</ReactMarkdown>
                    </div>
                  )}
                  {op.substitution && (
                    <div className="flex gap-2 items-center text-[13px] text-[#F59E0B]">
                      <span className="shrink-0 text-[#A1A1AA]">Substitute:</span>
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{formatMixedMath(op.substitution)}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}

              {op.transformation && (
                <div className="text-[13px] text-[#D1D1C7] mb-3 whitespace-pre-wrap leading-relaxed">
                  {op.transformation}
                </div>
              )}
              
              {op.result && (
                <div className="flex justify-center w-full py-2 overflow-x-auto bg-[#1C1C1B]/50 rounded border border-[#3A3A38]/30">
                  {isCodeContent(op.result) ? (
                    <pre className="w-full text-left text-[12.5px] font-mono text-[#E5A05F] whitespace-pre-wrap break-words px-2 py-1 leading-relaxed">
                      <code>{op.result.replace(/\\n/g, '\n').replace(/\\"/g, '"')}</code>
                    </pre>
                  ) : isPlainText(op.result) || isMarkdownTable(op.result) ? (
                    <div className="w-full text-left text-[13.5px] text-[#D1D1C7] leading-relaxed px-2">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                        {op.result}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {formatMixedMath(op.result, true)}
                    </ReactMarkdown>
                  )}
                </div>
              )}

              {op.uses && op.uses.length > 0 && equations && (
                <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-[#3A3A38]/50">
                  {op.uses.map(useId => {
                    const eq = equations.find(e => e.id === useId);
                    if (!eq) return null;
                    return (
                      <div key={useId} className="flex flex-col gap-1.5 p-3 bg-[#2C2C2A]/50 border border-[#4A4A48]/60 rounded-md">
                        <div className="flex items-center text-[12px] font-medium text-[#A1A1AA]">
                          <span className="text-[#818CF8] font-bold mr-1.5">↳</span> Using {eq.label}
                        </div>
                        <div className="flex justify-center w-full overflow-x-auto text-[13px]">
                          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                            {formatMixedMath(eq.latex, true)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {showBefore && op.before && op.before.trim() !== '' && (
                <div className="flex justify-center w-full py-2 mb-3 overflow-x-auto bg-[#1C1C1B]/30 rounded border border-[#3A3A38]/20">
                  {isCodeContent(op.before) ? (
                    <pre className="w-full text-left text-[12.5px] font-mono text-[#E5A05F] whitespace-pre-wrap break-words px-2 py-1 leading-relaxed">
                      <code>{op.before.replace(/\\n/g, '\n').replace(/\\"/g, '"')}</code>
                    </pre>
                  ) : isPlainText(op.before) || isMarkdownTable(op.before) ? (
                    <div className="w-full text-left text-[13.5px] text-[#D1D1C7] leading-relaxed px-2">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                        {op.before}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {formatMixedMath(op.before, true)}
                    </ReactMarkdown>
                  )}
                </div>
              )}
              
              {op.action && (
                <div className="text-[13px] text-[#D1D1C7] mb-3 whitespace-pre-wrap leading-relaxed flex items-center justify-center text-center">
                   <span className="text-[#818CF8] mr-2">↓</span> {op.action} <span className="text-[#818CF8] ml-2">↓</span>
                </div>
              )}

              {op.after && op.after.trim() !== '' && (
                <div className="flex justify-center w-full py-2 overflow-x-auto bg-[#1C1C1B]/50 rounded border border-[#3A3A38]/30">
                  {isCodeContent(op.after) ? (
                    <pre className="w-full text-left text-[12.5px] font-mono text-[#E5A05F] whitespace-pre-wrap break-words px-2 py-1 leading-relaxed">
                      <code>{op.after.replace(/\\n/g, '\n').replace(/\\"/g, '"')}</code>
                    </pre>
                  ) : isPlainText(op.after) || isMarkdownTable(op.after) ? (
                    <div className="w-full text-left text-[13.5px] text-[#D1D1C7] leading-relaxed px-2">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                        {op.after}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {formatMixedMath(op.after, true)}
                    </ReactMarkdown>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {step.validation && (
         <div className="mt-3 text-[12px] text-[#10B981]/80 italic flex gap-2 items-start bg-[#10B981]/5 p-2 rounded border border-[#10B981]/20">
           <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
           <span>{step.validation}</span>
         </div>
      )}

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
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{d.answer}</ReactMarkdown>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
