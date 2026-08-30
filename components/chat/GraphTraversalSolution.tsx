import React, { useState, useEffect } from 'react';
import { GraphDefinition, GraphDisplay, generateCircularLayout } from '@/components/ui/GraphDisplay';
import { isTree, generateTreeLayout } from '@/lib/graphUtils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
  layout 
}: { 
  step: GraphTraversalStep; 
  isLast: boolean; 
  graph: GraphDefinition; 
  layout: Record<string, { x: number; y: number }>;
}) {
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
        <div className="text-[14px] leading-relaxed text-[#ECECEA] prose prose-invert prose-p:my-0 mb-4">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {step.explanation}
          </ReactMarkdown>
        </div>

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
      </div>
    </div>
  );
}

export function GraphTraversalSolution({ data }: { data: GraphTraversalSolutionData }) {
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
