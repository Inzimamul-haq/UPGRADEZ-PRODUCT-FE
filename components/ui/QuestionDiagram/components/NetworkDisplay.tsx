import React from 'react';
import { normalizeDiagramSpec, generateCircularLayout } from '../../layoutUtils';

export function NetworkDisplay({ data, subtype, width = 400, height = 400 }: any) {
  const { nodes, edges } = normalizeDiagramSpec(data);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Network Diagram{subtype ? `: ${subtype}` : ''} - No Data]
        </div>
      </div>
    );
  }

  const numWidth = typeof width === 'number' ? width : 400;
  const numHeight = typeof height === 'number' ? height : 400;
  
  const positions = generateCircularLayout(nodes, numWidth, numHeight);

  const nodeRadius = 24;

  return (
    <div className="relative mt-2" style={{ width: numWidth, height: numHeight }}>
      {subtype && subtype !== 'generic' && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-[#2C2C2A] text-[#10B981] text-[10px] rounded border border-[#3A3A38] uppercase tracking-wider font-semibold shadow-sm z-10 pointer-events-none">
          {subtype.replace(/_/g, ' ')}
        </div>
      )}
      <svg width={numWidth} height={numHeight} viewBox={`0 0 ${numWidth} ${numHeight}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', maxWidth: '100%' }} className="overflow-visible block">
        {/* Edges */}
        {edges.map((e: any, i: number) => {
          const fromPos = positions[e.from];
          const toPos = positions[e.to];
          if (!fromPos || !toPos) return null;

          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          
          return (
            <g key={`edge-${i}`}>
              <line 
                x1={fromPos.x} 
                y1={fromPos.y} 
                x2={toPos.x} 
                y2={toPos.y} 
                stroke="#6C6C6A" 
                strokeWidth="2"
              />
              
              {(e.label || e.weight) && (
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect x={-20} y={-8} width={40} height={16} fill="#1C1C1B" />
                  <text 
                    x={0} 
                    y={3} 
                    fill="#10B981" 
                    fontSize="10" 
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {e.label || e.weight}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((n: any, i: number) => {
          const pos = positions[n.id];
          if (!pos) return null;
          return (
            <g key={`node-${n.id || i}`} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle 
                r={nodeRadius} 
                fill="#27272A" 
                stroke="#10B981" 
                strokeWidth="2" 
              />
              <text 
                x={0} 
                y={4} 
                fill="#F4F4F5" 
                fontSize="12" 
                fontWeight="500" 
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {n.label}
              </text>
              {n.sublabel && (
                <text 
                  x={0} 
                  y={nodeRadius + 12} 
                  fill="#A1A1AA" 
                  fontSize="10" 
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {n.sublabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
