import React from 'react';
import { StepExplanation } from '@/lib/types';
import { MathSolution, MathSolutionData } from './components/MathSolution';
import { DerivationSolution, DerivationSolutionData } from './components/DerivationSolution';
import { NumericalSolution, NumericalSolutionData } from './components/NumericalSolution';
import { LegacySolution, LegacySolutionData } from './components/LegacySolution';
import { FallbackSolution } from './components/FallbackSolution';
import { GraphTraversalSolution, GraphTraversalSolutionData } from './components/GraphTraversalSolution';
import { StateTraceSolution, StateTraceSolutionData } from './components/StateTraceSolution';
import { TreeSolution, TreeSolutionData } from './components/TreeSolution';
import { TableSolution } from './components/TableSolution';
import { TableSolutionData } from '@/lib/types';

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
    return <StateTraceSolution data={(data.solution || data) as StateTraceSolutionData} {...sharedProps} />;
  }

  if (data.ui_type === 'tree') {
    return <TreeSolution data={(data.solution || data) as TreeSolutionData} {...sharedProps} />;
  }

  if (data.ui_type === 'table') {
    return <TableSolution data={(data.solution || data) as TableSolutionData} />;
  }

  // Ultimate Fallback for unknown ui_types or poorly formatted data
  return <FallbackSolution data={data.solution} />;
}
