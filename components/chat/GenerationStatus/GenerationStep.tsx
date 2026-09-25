import React from 'react';
import { StepStatus } from './types';
import { CheckCircle2, Circle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

export function GenerationStep({ label, status }: { label: string; status: StepStatus }) {
  return (
    <div className={`flex items-center gap-3 text-sm py-1 transition-opacity duration-200 ${status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
      <div className="w-4 flex justify-center">
        {status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        {status === 'running' && <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />}
        {status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
        {status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
        {status === 'pending' && <Circle className="w-3 h-3 text-white/20" />}
      </div>
      <span className={status === 'running' ? 'text-white' : 'text-white/70'}>
        {label}
      </span>
    </div>
  );
}
