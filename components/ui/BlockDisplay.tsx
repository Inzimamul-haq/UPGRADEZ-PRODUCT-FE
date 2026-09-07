import React from 'react';
import { GraphDisplay } from './GraphDisplay';

export function BlockDisplay({ data, subtype, width = '100%', height = 200 }: any) {
  if (data?.nodes && data?.edges) {
    return <GraphDisplay graph={data} width={typeof width === 'number' ? width : 300} height={typeof height === 'number' ? height : 300} />;
  }

  const blocks = data?.blocks || [];

  if (blocks.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Block Diagram{subtype ? `: ${subtype}` : ''} - No Data]
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center mt-4 mb-4" style={{ width: '100%' }}>
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {blocks.map((b: any, i: number) => (
          <div key={b.id || i} className="flex items-center justify-center min-w-[40px] h-[40px] px-3 bg-[#2D2D2A] border border-[#4C4C4A] rounded shadow-sm text-sm font-mono text-[#D4D4D8]">
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}
