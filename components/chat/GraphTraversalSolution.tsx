import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Loader2, User, Bot } from 'lucide-react';
import { StepExplanation } from '@/lib/types';
import { useStepDoubt } from '@/hooks/useStepDoubt';
import { GraphDefinition, GraphDisplay, generateCircularLayout } from '@/components/ui/GraphDisplay';
import { isTree, generateTreeLayout } from '@/lib/graphUtils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export interface GraphTraversalState {
  currentNode?: string;
  visited?: string[];
  queue?: string[];
  stack?: string[];
  distances?: Record<string, number | null>;
}

export interface GraphTraversalStep {
  step: number;
  explanation: string;
  state: GraphTraversalState;
}

export interface GraphTraversalSolutionData {
  algorithm: string;
  graph: GraphDefinition;
  steps: GraphTraversalStep[];
  finalAnswer: string;
}

function StepCard({ 
  step, 
  isLast,
  graph, 
  layout,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo
}: { 
  step: GraphTraversalStep; 
  isLast: boolean; 
  graph: GraphDefinition; 
  layout: Record<string, { x: number; y: number }>;
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
    
    // For graph step, stepContent is just the explanation
    const doubtText = `Step ${stepLabel} — ${text}`;
    
    const newRow = await submitDoubt(stepLabel, doubtText);
    if (newRow) {
      setLocalDoubts(prev => [...prev, newRow]);
      setDoubtOpen(false);
      setDoubtInput('');
    }
  };
  const state = step.state || {};
  const activeNodes = new Set<string>();
  if (state.currentNode) activeNodes.add(state.currentNode);
  const visitedNodes = new Set<string>(state.visited || []);

  const renderDataStructures = () => {
    return (
      <div className="flex flex-col gap-3 w-full">
        {state.queue && (
          <div className="bg-[#2C2C2A] rounded p-3 border border-[#3A3A38]">
            <span className="text-[11px] font-bold text-[#8C8C8A] uppercase mb-2 block">Queue</span>
            <div className="flex flex-wrap gap-2">
              {state.queue.length === 0 ? (
                <span className="text-[#8C8C8A] text-xs">Empty</span>
              ) : (
                state.queue.map((item, idx) => (
                  <div key={idx} className="bg-[#1C1C1B] border border-[#4b4b4b] px-3 py-1 rounded text-sm text-[#ECECEA]">
                    {item}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {state.stack && (
          <div className="bg-[#2C2C2A] rounded p-3 border border-[#3A3A38]">
            <span className="text-[11px] font-bold text-[#8C8C8A] uppercase mb-2 block">Stack</span>
            <div className="flex flex-wrap gap-2">
              {state.stack.length === 0 ? (
                <span className="text-[#8C8C8A] text-xs">Empty</span>
              ) : (
                state.stack.map((item, idx) => (
                  <div key={idx} className="bg-[#1C1C1B] border border-[#4b4b4b] px-3 py-1 rounded text-sm text-[#ECECEA]">
                    {item}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {state.distances && (
          <div className="bg-[#2C2C2A] rounded p-3 border border-[#3A3A38]">
            <span className="text-[11px] font-bold text-[#8C8C8A] uppercase mb-2 block">Distances</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(state.distances).map(([node, dist]) => (
                <div key={node} className="flex justify-between items-center bg-[#1C1C1B] border border-[#4b4b4b] px-2 py-1 rounded text-sm">
                  <span className="text-[#8C8C8A]">{node}</span>
                  <span className="text-[#ECECEA] font-mono">{dist === null ? '∞' : dist}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-[-24px] w-[2px] bg-[#3A3A38]"></div>
      )}
      
      {/* Step Node */}
      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#2C2C2A] border-2 border-[#3A3A38] flex items-center justify-center text-[10px] font-bold text-[#8C8C8A]">
        {step.step}
      </div>

      <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 relative group hover:border-[#4A4A48] transition-colors mb-6 shadow-sm">
        {/* Action Header */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="text-[14px] leading-relaxed text-[#ECECEA] prose prose-invert prose-p:my-0">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {step.explanation}
            </ReactMarkdown>
          </div>
          {messageId && (
            <button 
              onClick={() => setDoubtOpen(!doubtOpen)}
              title="I have a doubt about this step"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#2C2C2A] hover:bg-[#3A3A38] transition-colors text-[#818CF8] shrink-0 mt-0.5"
            >
              <HelpCircle size={14} />
            </button>
          )}
        </div>

        {doubtOpen && (
          <div className="mb-4 p-3 bg-[#252523] rounded-lg border border-[#3A3A38]/50 flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
              {["Didn't understand this step", "Explain more simply", "Why traverse here?"].map(chip => (
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

        {/* Visuals and Data */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2 min-w-0 flex items-center justify-center bg-[#222220] rounded-xl border border-[#3A3A38] p-4">
            {Object.keys(layout).length > 0 && (
              <GraphDisplay 
                graph={graph}
                width={300}
                height={220}
                activeNodes={activeNodes}
                visitedNodes={visitedNodes}
                nodePositions={layout}
              />
            )}
          </div>
          <div className="w-full md:w-1/2 min-w-0 flex flex-col justify-center">
            {renderDataStructures()}
          </div>
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
    </div>
  );
}

export function GraphTraversalSolution({ 
  data,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo = null,
}: { 
  data: GraphTraversalSolutionData;
  messageId?: string;
  chatId?: string;
  stepExplanations?: StepExplanation[];
  batchQuestionNo?: number | null;
}) {
  const [layout, setLayout] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (data && data.graph) {
      const tree = isTree(data.graph);
      if (tree) {
        setLayout(generateTreeLayout(data.graph, 300, 220));
      } else {
        setLayout(generateCircularLayout(data.graph.nodes, 300, 220));
      }
    }
  }, [data?.graph]);

  if (!data || !data.graph || !data.steps || data.steps.length === 0) {
    return <div className="text-red-400">Invalid graph traversal data.</div>;
  }

  return (
    <div className="font-sans text-[#ECECEA] space-y-6">
      <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl overflow-hidden shadow-lg p-5">
        
        {/* Title */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#3A3A38] pb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          <span className="font-semibold text-sm tracking-wide">{data.algorithm} Traversal</span>
        </div>

        {/* Steps List */}
        <div className="mt-4">
          <span className="text-[11px] font-bold text-[#8C8C8A] uppercase mb-4 block tracking-wider">Execution Steps</span>
          <div className="flex flex-col">
            {data.steps.map((step, idx) => (
              <StepCard 
                key={idx} 
                step={step} 
                isLast={idx === data.steps.length - 1} 
                graph={data.graph}
                layout={layout}
                messageId={messageId}
                chatId={chatId}
                stepExplanations={stepExplanations}
                batchQuestionNo={batchQuestionNo}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Final Answer */}
      {data.finalAnswer && (
        <div className="bg-[#1C1C1B] p-5 rounded-xl border border-green-500/30">
          <span className="text-[11px] font-bold text-green-400 uppercase mb-2 block tracking-wider">Final Result</span>
          <div className="prose prose-invert max-w-none text-sm text-[#ECECEA]">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {data.finalAnswer}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
