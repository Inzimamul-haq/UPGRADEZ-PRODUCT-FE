import React from 'react';
import { LinkedListDisplay } from './LinkedListDisplay';
import { BucketsDisplay } from './BucketsDisplay';

export function StructuralDisplay({ data, subtype, width = 300, height = 260 }: any) {
  if (subtype === 'linked_list' || subtype === 'linked list') {
    return <LinkedListDisplay list={data} width={width} height={height} />;
  }
  if (subtype === 'buckets' || subtype === 'hash table') {
    return <BucketsDisplay data={data} width={width} height={height} />;
  }
  
  // Default structural stub
  return (
    <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width: '100%', height }}>
      <div className="text-xs text-[#6C6C6A] italic">
        [Structural Diagram{subtype ? `: ${subtype}` : ''}]
      </div>
    </div>
  );
}
