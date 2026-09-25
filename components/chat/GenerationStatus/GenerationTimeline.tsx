import React from 'react';
import { GenerationStepData } from './types';
import { GenerationStep } from './GenerationStep';

export function GenerationTimeline({ steps }: { steps: GenerationStepData[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((step, idx) => (
        <GenerationStep key={`${step.stage}-${idx}`} label={step.label} status={step.status} />
      ))}
    </div>
  );
}
