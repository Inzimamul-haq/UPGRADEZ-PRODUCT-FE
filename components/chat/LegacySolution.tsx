import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, CheckCircle2, HelpCircle, Loader2, User, Bot } from 'lucide-react';
import { StepExplanation } from '@/lib/types';
import { useStepDoubt } from '@/hooks/useStepDoubt';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { parseMathLines, ensureBoxedIsMath, isCodeContent, isPlainText } from '@/lib/mathFormat';

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

export function LegacySolution({ 
  data,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo = null,
}: { 
  data: LegacySolutionData;
  messageId?: string;
  chatId?: string;
  stepExplanations?: StepExplanation[];
  batchQuestionNo?: number | null;
}) {
  return (
    <div className="flex flex-col gap-4 mt-4 mb-2">
      {/* Concept Header */}
      {data.method && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#2C2C2A]/60 border border-[#3A3A38] rounded-lg">
          <Lightbulb size={16} className="text-[#818CF8]" />
          <span className="text-[13px] font-semibold text-[#E5E5E5]">Concept: {data.method}</span>
        </div>
      )}
      
      {/* Steps */}
      <div className="flex flex-col gap-3 relative border-l-2 border-[#3A3A38]/50 ml-3 pl-5">
        {data.steps.map((step, idx) => (
          <LegacyStepCard 
            key={idx} 
            step={step} 
            messageId={messageId}
            chatId={chatId}
            stepExplanations={stepExplanations}
            batchQuestionNo={batchQuestionNo}
          />
        ))}
      </div>

      {/* Final Conclusion */}
      {data.final_answer && data.final_answer.display && (
        <div className="mt-2 bg-[#2C2C2A] border-l-[3px] border-[#10B981] rounded-r-lg px-4 py-3 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <CheckCircle2 size={48} />
          </div>
          <h4 className="text-[12px] font-bold text-[#10B981] tracking-wider uppercase mb-1">Final Conclusion</h4>
          <div className="text-[15px] font-semibold text-[#ECECEA] relative z-10 py-2 w-full prose prose-invert prose-p:my-1 prose-math:justify-center">
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

function LegacyStepCard({ 
  step,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo
}: { 
  step: MathStep;
  messageId?: string;
  chatId?: string;
  stepExplanations?: StepExplanation[];
  batchQuestionNo?: number | null;
}) {
  const [doubtOpen, setDoubtOpen] = useState(false);
  const [doubtInput, setDoubtInput] = useState('');
  
  const stepLabel = step.step;
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
      {/* Step Badge */}
      <div className="absolute -left-[30px] top-4 w-6 h-6 rounded-full bg-[#2C2C2A] border-2 border-[#3A3A38] flex items-center justify-center text-[10px] font-bold text-[#8C8C8A] group-hover:border-[#818CF8] group-hover:text-[#818CF8] transition-colors">
        {step.step}
      </div>

      <div className="flex justify-between items-start gap-4 mb-3">
        <h3 className="text-[14px] font-semibold text-[#ECECEA]">{step.title}</h3>
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

      <div className="flex flex-col w-full math-solution-container mt-2 text-[14px] text-[#E5E5E5]">
        {step.work.map((workItem, i) => (
          <div key={i} className={`flex flex-col w-full ${i > 0 ? 'mt-5' : ''}`}>
            {/* Explanation text */}
            {workItem.explanation && (
              <div className="p-3 bg-[#252523] rounded-lg border border-[#3A3A38]/50 border-l-[2px] border-l-[#F59E0B] text-[13px] text-[#D1D1C7] leading-relaxed mb-3">
                {workItem.explanation}
              </div>
            )}
            
            {/* Equation / Formulation box */}
            {workItem.equation && workItem.equation !== 'undefined' && (
              <div className="w-full">
                {(() => {
                  const eq = workItem.equation;
                  if (!eq || eq === 'undefined') return null;

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
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {eq}
                        </ReactMarkdown>
                      </div>
                    );
                  }

                  const lines = parseMathLines(eq);
                  if (lines.length === 0) return null;
                  
                  return (
                    <div className="w-full py-2 px-4 overflow-x-auto text-[13px] text-[#D1D1C7] flex flex-col gap-2 items-center">
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
      </div>

      {/* Step Result Outcome */}
      {step.result && (
        <div className="mt-5 bg-[#252523] border-l-[3px] border-[#3A3A38] rounded-r-lg px-4 py-3 relative overflow-hidden">
          <h4 className="text-[11px] font-bold text-[#A1A1AA] tracking-wider uppercase mb-2">Step Result</h4>
          <div className="text-[14px] font-semibold text-[#D1D1C7] relative z-10 overflow-x-auto">
            {(() => {
              const res = step.result;

              // Code content → plain pre/code, no italic/KaTeX
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
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {res}
                    </ReactMarkdown>
                  </div>
                );
              }

              const lines = parseMathLines(res);
              if (lines.length === 0) return null;
              
              return (
                <div className="flex flex-col gap-2 items-center">
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
