import React from 'react';
import { MathSolution, MathSolutionData } from './MathSolution';
import { DerivationSolution, DerivationSolutionData } from './DerivationSolution';
import { NumericalSolution, NumericalSolutionData } from './NumericalSolution';

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
  
  // Legacy / Fallback
  return <MathSolution data={data.solution as MathSolutionData} />;
}
