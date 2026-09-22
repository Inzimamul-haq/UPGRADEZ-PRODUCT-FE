import React from 'react';
import { OrthographicDiagram } from './OrthographicDiagram';
import { IsometricDiagram } from './IsometricDiagram';

export function EngineeringDrawingDisplay({ data, subtype, width = 500, height = 320 }: any) {
  if (subtype === 'orthographic') {
    return <OrthographicDiagram data={data} width={width} height={height} />;
  }
  
  if (subtype === 'isometric') {
    return <IsometricDiagram data={data} width={width} height={height} />;
  }
  
  return (
    <div className="flex items-center justify-center border border-dashed border-red-900/50 rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
      <div className="text-xs text-red-500/80 font-medium px-4 text-center">
        [Unsupported engineering_drawing subtype: '{subtype || 'unknown'}']<br/>
        <span className="text-[#6C6C6A] mt-1 block">Valid subtypes are orthographic or isometric.</span>
      </div>
    </div>
  );
}
