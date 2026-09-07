import React from 'react';
import { GraphDisplay } from './GraphDisplay';

export function FlowchartDisplay({ data, subtype, width = '100%', height = 200 }: any) {
  if (data?.nodes && data?.edges) {
    return <GraphDisplay graph={data} width={typeof width === 'number' ? width : 300} height={typeof height === 'number' ? height : 300} />;
  }

  return (
    <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
      <div className="text-xs text-[#6C6C6A] italic">
        [Flowchart{subtype ? `: ${subtype}` : ''}]
      </div>
    </div>
  );
}
