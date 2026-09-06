import React from 'react';
import { LogicGateDisplay } from './LogicGateDisplay';

export function SchematicDisplay({ data, subtype, width = 300, height = 260 }: any) {
  if (subtype === 'logic_gate' || subtype === 'logic gate') {
    return <LogicGateDisplay logic={data} width={width} height={height} />;
  }
  
  // Default schematic stub
  return (
    <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width: '100%', height }}>
      <div className="text-xs text-[#6C6C6A] italic">
        [Schematic Diagram{subtype ? `: ${subtype}` : ''}]
      </div>
    </div>
  );
}
