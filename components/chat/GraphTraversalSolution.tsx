import React, { useState, useEffect } from 'react';
import { GraphDefinition, GraphDisplay, generateCircularLayout } from '@/components/ui/GraphDisplay';
import { isTree, generateTreeLayout } from '@/lib/graphUtils';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
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

export function GraphTraversalSolution({ data }: { data: GraphTraversalSolutionData }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize layout once
  const [layout, setLayout] = useState<Record<string, { x: number; y: number }>>({});
  const [isGraphTree, setIsGraphTree] = useState(false);

  useEffect(() => {
    if (data.graph) {
      const tree = isTree(data.graph);
      setIsGraphTree(tree);
      if (tree) {
        setLayout(generateTreeLayout(data.graph, 400, 300));
      } else {
        setLayout(generateCircularLayout(data.graph.nodes, 400, 300));
      }
    }
  }, [data.graph]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStep < data.steps.length - 1) {
      interval = setInterval(() => {
        setCurrentStep((prev) => prev + 1);
      }, 1500); // fixed speed play
    } else if (currentStep >= data.steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, data.steps.length]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const reset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };
  const prevStep = () => setCurrentStep(Math.max(0, currentStep - 1));
  const nextStep = () => setCurrentStep(Math.min(data.steps.length - 1, currentStep + 1));

  if (!data || !data.graph || !data.steps || data.steps.length === 0) {
    return <div className="text-red-400">Invalid graph traversal data.</div>;
  }

  const stepData = data.steps[currentStep];
  const state = stepData.state || {};

  const activeNodes = new Set<string>();
  if (state.currentNode) activeNodes.add(state.currentNode);

  const visitedNodes = new Set<string>(state.visited || []);

  const renderDataStructures = () => {
    return (
      <div className="flex flex-col gap-3 mt-4 w-full">
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
    <div className="font-sans text-[#ECECEA] space-y-6">
      <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="bg-[#2C2C2A] px-5 py-3 border-b border-[#3A3A38] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="font-semibold text-sm tracking-wide">{data.algorithm} Traversal</span>
          </div>
          <span className="text-xs font-mono text-[#8C8C8A] bg-[#1C1C1B] px-2 py-1 rounded border border-[#3A3A38]">
            Step {currentStep + 1} / {data.steps.length}
          </span>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-center gap-4 py-3 bg-[#222220] border-b border-[#3A3A38]">
          <button onClick={reset} className="p-1.5 text-[#8C8C8A] hover:text-white transition-colors" title="Reset">
            <RotateCcw size={16} />
          </button>
          <button onClick={prevStep} disabled={currentStep === 0} className="p-1.5 text-[#8C8C8A] hover:text-white disabled:opacity-30 transition-colors">
            <SkipBack size={18} />
          </button>
          <button onClick={togglePlay} className="p-2 bg-[#EAB308] text-black rounded-full hover:bg-yellow-400 transition-colors shadow-md">
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          <button onClick={nextStep} disabled={currentStep === data.steps.length - 1} className="p-1.5 text-[#8C8C8A] hover:text-white disabled:opacity-30 transition-colors">
            <SkipForward size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex flex-col md:flex-row gap-6">
          {/* Graph Visualization */}
          <div className="w-full md:w-1/2 min-w-0 flex items-center justify-center bg-[#222220] rounded-xl border border-[#3A3A38] p-4 min-h-[300px]">
            {Object.keys(layout).length > 0 && (
              <GraphDisplay 
                graph={data.graph}
                width={400}
                height={300}
                activeNodes={activeNodes}
                visitedNodes={visitedNodes}
                nodePositions={layout}
              />
            )}
          </div>

          {/* Explanation & Data Structures */}
          <div className="w-full md:w-1/2 min-w-0 flex flex-col">
            <div className="mb-4 flex-1">
              <span className="text-[11px] font-bold text-[#EAB308] uppercase mb-2 block tracking-wider">Action</span>
              <div className="text-[15px] leading-relaxed text-[#ECECEA] prose prose-invert prose-p:my-1">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {stepData.explanation}
                </ReactMarkdown>
              </div>
            </div>
            
            {renderDataStructures()}
          </div>
        </div>
      </div>

      {/* Final Answer */}
      {currentStep === data.steps.length - 1 && data.finalAnswer && (
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
