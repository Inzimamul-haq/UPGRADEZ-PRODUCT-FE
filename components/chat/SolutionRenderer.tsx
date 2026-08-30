import React from 'react';
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

export function SolutionRenderer({ data }: { data: MultiSchemaData }) {
  if (data.ui_type === 'derivation') {
    return <DerivationSolution data={data.solution as DerivationSolutionData} />;
  }
  
  if (data.ui_type === 'numerical') {
    return <NumericalSolution data={data.solution as NumericalSolutionData} />;
  }
  
  if (data.ui_type === 'legacy') {
    return <LegacySolution data={data.solution as LegacySolutionData} />;
  }
  
  if (data.ui_type === 'graph_traversal') {
    return <GraphTraversalSolution data={data.solution as GraphTraversalSolutionData} />;
  }
  
  if (data.ui_type === 'state_trace') {
    // Note: StateTrace schema uses flat structure, not wrapped in 'solution' key
    return <StateTraceSolution data={data as unknown as StateTraceSolutionData} />;
  }
  
  // Ultimate Fallback for unknown ui_types or poorly formatted data
  return <FallbackSolution data={data.solution} />;
}
