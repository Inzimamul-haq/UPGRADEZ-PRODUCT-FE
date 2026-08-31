import React from 'react';
import { StepExplanation } from '@/lib/types';
import { MathSolution, MathSolutionData } from './MathSolution';
import { DerivationSolution, DerivationSolutionData } from './DerivationSolution';
import { NumericalSolution, NumericalSolutionData } from './NumericalSolution';
import { LegacySolution, LegacySolutionData } from './LegacySolution';
import { FallbackSolution } from './FallbackSolution';
import { GraphTraversalSolution, GraphTraversalSolutionData } from './GraphTraversalSolution';
import { StateTraceSolution, StateTraceSolutionData } from './StateTraceSolution';

export interface MultiSchemaData {
  ui_type?: string;
  solution: any;
}

export function SolutionRenderer({ 
  data,
  messageId,
  chatId,
  stepExplanations = [],
  batchQuestionNo = null,
}: { 
  data: MultiSchemaData;
  messageId?: string;
  chatId?: string;
  stepExplanations?: StepExplanation[];
  batchQuestionNo?: number | null;
}) {
  const sharedProps = { messageId, chatId, stepExplanations, batchQuestionNo };

  if (data.ui_type === 'derivation') {
    return <DerivationSolution data={data.solution as DerivationSolutionData} {...sharedProps} />;
  }
  
  if (data.ui_type === 'numerical') {
    return <NumericalSolution data={data.solution as NumericalSolutionData} {...sharedProps} />;
  }
  
  if (data.ui_type === 'legacy' || data.ui_type === 'math') { // added math just in case
    return <LegacySolution data={data.solution as LegacySolutionData} {...sharedProps} />;
  }
  
  if (data.ui_type === 'graph_traversal') {
    return <GraphTraversalSolution data={data.solution as GraphTraversalSolutionData} {...sharedProps} />;
  }
  
  if (data.ui_type === 'state_trace') {
    // Note: StateTrace schema uses flat structure, not wrapped in 'solution' key
    return <StateTraceSolution data={data as unknown as StateTraceSolutionData} {...sharedProps} />;
  }
  
  // Ultimate Fallback for unknown ui_types or poorly formatted data
  return <FallbackSolution data={data.solution} />;
}
