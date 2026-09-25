import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GenerationStepData, GenerationStatusType } from './types';
import { GenerationTimeline } from './GenerationTimeline';

const STATES = [
  "Surfing",
  "Thinking",
  "Pondering",
  "Contemplating",
  "Unraveling",
  "Deliberating",
];

interface GenerationStatusProps {
  steps: GenerationStepData[];
  status: GenerationStatusType;
  elapsed: number;
}

export function GenerationStatus({ steps, status, elapsed }: GenerationStatusProps) {
  const [expanded, setExpanded] = useState(false);
  const [animState, setAnimState] = useState(STATES[0]);

  useEffect(() => {
    if (status !== 'running') return;
    const interval = setInterval(() => {
      setAnimState((current) => {
        const availableStates = STATES.filter((s) => s !== current);
        return availableStates[Math.floor(Math.random() * availableStates.length)];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  // Find the currently active or most relevant step label
  const activeStep = steps.slice().reverse().find(s => s.status === 'running' || s.status === 'warning') 
    || steps.slice().reverse().find(s => s.status === 'done')
    || steps[0];

  const currentLabel = status === 'completed' 
    ? 'Question paper generated' 
    : status === 'failed'
    ? 'Question paper generation failed'
    : animState;

  return (
    <div className="flex w-full justify-start group relative text-[#d1d5db]">
      <div className="flex flex-col max-w-[85%] items-start w-full gap-2">
        {/* Toggle / Current Stage Label */}
        <div 
          className="flex items-center gap-2 cursor-pointer transition-colors w-fit group-hover:text-white"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="text-[#8c8c8a] flex items-center justify-center">
            {status === 'failed' ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : (
              <img src="/icons/icon-192x192.png" alt="Status" className={`w-4 h-4 ${status === 'completed' ? 'opacity-100' : 'opacity-80'}`} />
            )}
          </div>
          
          <span className={`text-[14px] font-medium select-none flex items-center gap-1 ${status === 'running' ? 'shimmer-text' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.span
                key={currentLabel}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.2 }}
                className="inline-block"
              >
                {currentLabel}
              </motion.span>
            </AnimatePresence>
            {status === 'running' && <span>{elapsed}s</span>}
          </span>
          
          <div className="text-[#8c8c8a] ml-1">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>

        {/* Collapsible Details */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out w-full origin-top ${
            expanded ? 'max-h-[800px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          <div className="border border-[#2E2E2C] rounded-[16px] bg-[#1C1C1B] p-4 text-[13px] text-[#A1A1AA]">
            <GenerationTimeline steps={steps} />
          </div>
        </div>
      </div>
    </div>
  );
}
