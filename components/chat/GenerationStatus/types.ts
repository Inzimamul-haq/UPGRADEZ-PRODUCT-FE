export type GenerationStage =
  | 'context'
  | 'syllabus'
  | 'generate'
  | 'check'
  | 'issues'
  | 'repair'
  | 'validate';

export type StepStatus = 'pending' | 'running' | 'done' | 'warning' | 'failed';

export type GenerationStatusType = 'running' | 'completed' | 'failed';

export interface GenerationStepData {
  stage: GenerationStage;
  label: string;
  status: StepStatus;
}
