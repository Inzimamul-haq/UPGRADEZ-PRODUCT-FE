import React from 'react';
import { ControlSystemDiagram } from './ControlSystemDiagram';
import { SignalFlowDiagram } from './SignalFlowDiagram';
import { HardwareDiagram } from './HardwareDiagram';

export function BlockDisplay({ data, subtype, width = 500, height = 320 }: any) {
  if (subtype === 'control_system') {
    return <ControlSystemDiagram data={data} width={width} height={height} />;
  }

  if (subtype === 'signal_flow') {
    return <SignalFlowDiagram data={data} width={width} height={height} />;
  }

  if (subtype === 'hardware') {
    return <HardwareDiagram data={data} width={width} height={height} />;
  }

  return (
    <div className="flex items-center justify-center border border-dashed border-red-900/50 rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
      <div className="text-xs text-red-500/80 font-medium px-4 text-center">
        [Unsupported diagram subtype: '{subtype || 'unknown'}']<br />
        <span className="text-[#6C6C6A] mt-1 block">Valid block subtypes are control_system, signal_flow, or hardware.</span>
      </div>
    </div>
  );
}

