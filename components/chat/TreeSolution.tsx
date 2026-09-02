import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Loader2, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepExplanation } from '@/lib/types';
import { useStepDoubt } from '@/hooks/useStepDoubt';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export interface TreeNode {
  id: string;
  value: string;
  left: string | null;
  right: string | null;
}

export interface TreeStep {
  step: number;
  action: string;
  explanation: string;
  highlight?: string;
  tree_snapshot: TreeNode[];
}

export interface TreeSolutionData {
  ui_type: string;
  tree_type: string;
  initial_nodes: TreeNode[];
  steps: TreeStep[];
  traversals?: {
    inorder?: string[];
    preorder?: string[];
    postorder?: string[];
  };
  final_answer: string;
}

function calculateTreeLayout(nodes: TreeNode[]) {
  const layout: Record<string, { x: number, y: number }> = {};
  
  if (!nodes || nodes.length === 0) return { layout, width: 0, height: 0, nodeMap: new Map() };

  const childIds = new Set<string>();
  nodes.forEach(n => {
    if (n.left) childIds.add(n.left);
    if (n.right) childIds.add(n.right);
  });
  
  let root = nodes.find(n => !childIds.has(n.id));
  if (!root) root = nodes[0]; // fallback

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const Y_SPACING = 60;
  
  function traverse(nodeId: string, depth: number, x: number, offset: number) {
    layout[nodeId] = { x, y: depth * Y_SPACING };
    const node = nodeMap.get(nodeId);
    if (!node) return;
    
    if (node.left) {
      traverse(node.left, depth + 1, x - offset, offset / 1.8);
    }
    if (node.right) {
      traverse(node.right, depth + 1, x + offset, offset / 1.8);
    }
  }

  traverse(root.id, 0, 0, 100);

  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  Object.values(layout).forEach(pos => {
    if (pos.x < minX) minX = pos.x;
    if (pos.x > maxX) maxX = pos.x;
    if (pos.y > maxY) maxY = pos.y;
  });

  const width = Math.max(maxX - minX + 80, 200);
  const height = maxY + 80;
  
  Object.keys(layout).forEach(id => {
    layout[id].x = layout[id].x - minX + 40;
    layout[id].y += 40; 
  });

  return { layout, width, height, nodeMap };
}

function getMergedSnapshot(initial: TreeNode[], steps: TreeStep[], upToStepIndex: number): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  if (initial) {
    initial.forEach(n => nodeMap.set(n.id, { ...n }));
  }
  for (let i = 0; i <= upToStepIndex; i++) {
    const stepNodes = steps[i].tree_snapshot;
    if (stepNodes) {
      stepNodes.forEach(n => nodeMap.set(n.id, { ...n }));
    }
  }
  return Array.from(nodeMap.values());
}

function StepCard({ 
  step,
  stepIndex,
  initialNodes,
  allSteps,
  isLast,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo
}: { 
  step: TreeStep; 
  stepIndex: number;
  initialNodes: TreeNode[];
  allSteps: TreeStep[];
  isLast: boolean;
  messageId?: string;
  chatId?: string;
  stepExplanations?: StepExplanation[];
  batchQuestionNo?: number | null;
}) {
  const [showExplanation, setShowExplanation] = useState(true);
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

  const mergedSnapshot = useMemo(() => getMergedSnapshot(initialNodes, allSteps, stepIndex), [initialNodes, allSteps, stepIndex]);
  const { layout, width, height } = useMemo(() => calculateTreeLayout(mergedSnapshot), [mergedSnapshot]);

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-[-24px] w-[2px] bg-[#3A3A38]"></div>
      )}
      
      {/* Step Node */}
      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#2C2C2A] border-2 border-[#3A3A38] flex items-center justify-center text-[10px] font-bold text-[#8C8C8A]">
        {stepLabel}
      </div>

      <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 relative group hover:border-[#4A4A48] transition-colors mb-6 shadow-sm">
        {/* Action Header */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className={`text-[14px] font-semibold text-[#ECECEA] prose prose-invert prose-p:my-0 flex-1 ${!showExplanation ? 'line-clamp-2' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {step.action}
            </ReactMarkdown>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2C2C2A] hover:bg-[#3A3A38] transition-colors text-[11px] font-medium text-[#A1A1AA] shrink-0 mt-0.5"
            >
              {showExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Explanation
            </button>
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
        </div>

        {doubtOpen && (
          <div className="mb-4 p-3 bg-[#252523] rounded-lg border border-[#3A3A38]/50 flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
              {["Didn't understand this step", "Explain more simply", "Why does state change like this?"].map(chip => (
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

        {/* Expandable Reason */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="p-3 bg-[#252523] rounded-lg border border-[#3A3A38]/50 border-l-[2px] border-l-[#F59E0B] text-[13px] text-[#D1D1C7] leading-relaxed flex flex-col gap-2">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {step.explanation}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tree SVG Visualization */}
        {mergedSnapshot.length > 0 && width > 0 && (
          <div className="bg-[#18181B] rounded-lg border border-[#27272A] p-4 flex flex-col gap-2 overflow-x-auto overflow-y-hidden" style={{ touchAction: 'pan-x' }}>
            <svg width={width} height={height} className="block mx-auto">
              {/* Edges */}
              {mergedSnapshot.map(node => {
                const pos = layout[node.id];
                if (!pos) return null;
                const edges = [];
                if (node.left && layout[node.left]) {
                  const lPos = layout[node.left];
                  edges.push(
                    <line key={`edge-${node.id}-L`} x1={pos.x} y1={pos.y} x2={lPos.x} y2={lPos.y} stroke="#4A4A48" strokeWidth="2" />
                  );
                }
                if (node.right && layout[node.right]) {
                  const rPos = layout[node.right];
                  edges.push(
                    <line key={`edge-${node.id}-R`} x1={pos.x} y1={pos.y} x2={rPos.x} y2={rPos.y} stroke="#4A4A48" strokeWidth="2" />
                  );
                }
                return edges;
              })}
              
              {/* Nodes */}
              {mergedSnapshot.map(node => {
                const pos = layout[node.id];
                if (!pos) return null;
                const isHighlighted = step.highlight === node.id;
                return (
                  <g key={node.id} transform={`translate(${pos.x},${pos.y})`}>
                    <circle
                      r="16"
                      fill={isHighlighted ? '#6366f1' : '#2C2C2A'}
                      stroke={isHighlighted ? '#818cf8' : '#4A4A48'}
                      strokeWidth="2"
                    />
                    <text
                      textAnchor="middle"
                      dy=".3em"
                      fill="#ECECEA"
                      fontSize="12px"
                      fontWeight={isHighlighted ? "bold" : "normal"}
                    >
                      {node.value}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {localDoubts.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {localDoubts.map((doubt, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-[#18181B] border border-[#27272A] rounded-lg text-[13px]">
                <div className="flex gap-2 items-start text-[#D1D1C7]">
                  <User size={14} className="mt-0.5 shrink-0 text-[#8C8C8A]" />
                  <span className="font-medium text-[#ECECEA]">{doubt.question.replace(/^Step \d+ — /, '')}</span>
                </div>
                <div className="flex gap-2 items-start text-[#A1A1AA]">
                  <Bot size={14} className="mt-0.5 shrink-0 text-[#818CF8]" />
                  <div className="prose prose-invert prose-p:my-0 prose-sm">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {doubt.answer}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TreeSolution({ 
  data,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo
}: { 
  data: TreeSolutionData;
  messageId?: string;
  chatId?: string;
  stepExplanations?: StepExplanation[];
  batchQuestionNo?: number | null;
}) {
  const finalSnapshot = data.steps && data.steps.length > 0 
    ? getMergedSnapshot(data.initial_nodes || [], data.steps, data.steps.length - 1)
    : [];
    
  const { layout: finalLayout, width: finalWidth, height: finalHeight } = useMemo(() => calculateTreeLayout(finalSnapshot), [finalSnapshot]);

  return (
    <div className="flex flex-col gap-4 font-sans max-w-3xl w-full">
      <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 md:p-6 shadow-sm">
        <h3 className="text-[16px] font-semibold text-[#ECECEA] flex items-center gap-2 mb-2">
          {data.tree_type} Operations
        </h3>
        
        <div className="mt-6 pt-2">
          {data.steps.map((step, i) => (
            <StepCard 
              key={i} 
              step={step} 
              stepIndex={i}
              initialNodes={data.initial_nodes || []}
              allSteps={data.steps}
              isLast={i === data.steps.length - 1} 
              messageId={messageId}
              chatId={chatId}
              stepExplanations={stepExplanations}
              batchQuestionNo={batchQuestionNo}
            />
          ))}
        </div>
      </div>
      
      {finalSnapshot.length > 0 && finalWidth > 0 && (
        <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 md:p-6 shadow-sm">
          <h3 className="text-[15px] font-semibold text-[#ECECEA] mb-4">Final Tree Structure</h3>
          <div className="bg-[#18181B] rounded-lg border border-[#27272A] p-4 flex flex-col gap-2 overflow-x-auto overflow-y-hidden" style={{ touchAction: 'pan-x' }}>
            <svg width={finalWidth} height={finalHeight} className="block mx-auto">
              {/* Edges */}
              {finalSnapshot.map(node => {
                const pos = finalLayout[node.id];
                if (!pos) return null;
                const edges = [];
                if (node.left && finalLayout[node.left]) {
                  const lPos = finalLayout[node.left];
                  edges.push(
                    <line key={`edge-${node.id}-L`} x1={pos.x} y1={pos.y} x2={lPos.x} y2={lPos.y} stroke="#4A4A48" strokeWidth="2" />
                  );
                }
                if (node.right && finalLayout[node.right]) {
                  const rPos = finalLayout[node.right];
                  edges.push(
                    <line key={`edge-${node.id}-R`} x1={pos.x} y1={pos.y} x2={rPos.x} y2={rPos.y} stroke="#4A4A48" strokeWidth="2" />
                  );
                }
                return edges;
              })}
              
              {/* Nodes */}
              {finalSnapshot.map(node => {
                const pos = finalLayout[node.id];
                if (!pos) return null;
                return (
                  <g key={node.id} transform={`translate(${pos.x},${pos.y})`}>
                    <circle
                      r="16"
                      fill={'#2C2C2A'}
                      stroke={'#4A4A48'}
                      strokeWidth="2"
                    />
                    <text
                      textAnchor="middle"
                      dy=".3em"
                      fill="#ECECEA"
                      fontSize="12px"
                    >
                      {node.value}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {data.traversals && (Object.keys(data.traversals).length > 0) && (
        <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 md:p-6 shadow-sm">
          <h4 className="text-[14px] font-semibold text-[#ECECEA] mb-4">Traversals</h4>
          <div className="space-y-3">
            {data.traversals.inorder && data.traversals.inorder.length > 0 && (
              <div className="flex gap-3">
                <span className="text-[#8C8C8A] text-[13px] font-medium w-20 shrink-0">Inorder:</span>
                <span className="text-[#D1D1C7] text-[13px] font-mono break-all">{data.traversals.inorder.join(' → ')}</span>
              </div>
            )}
            {data.traversals.preorder && data.traversals.preorder.length > 0 && (
              <div className="flex gap-3">
                <span className="text-[#8C8C8A] text-[13px] font-medium w-20 shrink-0">Preorder:</span>
                <span className="text-[#D1D1C7] text-[13px] font-mono break-all">{data.traversals.preorder.join(' → ')}</span>
              </div>
            )}
            {data.traversals.postorder && data.traversals.postorder.length > 0 && (
              <div className="flex gap-3">
                <span className="text-[#8C8C8A] text-[13px] font-medium w-20 shrink-0">Postorder:</span>
                <span className="text-[#D1D1C7] text-[13px] font-mono break-all">{data.traversals.postorder.join(' → ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {data.final_answer && (
        <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4 md:p-6 shadow-sm">
          <div className="prose prose-invert prose-p:my-0 prose-sm text-[#D1D1C7] leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {data.final_answer}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
