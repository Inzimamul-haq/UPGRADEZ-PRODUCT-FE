import React from 'react';

export function ArchitectureDisplay({ data, subtype, width = '100%', height = 200 }: any) {
  return (
    <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
      <div className="text-xs text-[#6C6C6A] italic">
        [Architecture Diagram{subtype ? `: ${subtype}` : ''}]
      </div>
    </div>
  );
}
