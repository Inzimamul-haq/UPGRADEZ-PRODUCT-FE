import React from 'react';
import { normalizeDiagramSpec, computeLayerLayout } from './layoutUtils';

export function BlockDisplay({ data, subtype, width = 500, height = 320 }: any) {
  const { nodes, edges } = normalizeDiagramSpec(data);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Block Diagram{subtype ? `: ${subtype}` : ''} - No Data]
        </div>
      </div>
    );
  }

  const numWidth = typeof width === 'number' ? width : 500;
  const numHeight = typeof height === 'number' ? height : 320;
  
  const positions = computeLayerLayout(nodes, edges, numWidth, numHeight, 'TB');

  const rectWidth = 100;
  const rectHeight = 40;

  return (
    <div className="relative mt-2" style={{ width: numWidth, height: numHeight }}>
      {subtype && subtype !== 'generic' && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-[#2C2C2A] text-[#E5A05F] text-[10px] rounded border border-[#3A3A38] uppercase tracking-wider font-semibold shadow-sm z-10 pointer-events-none">
          {subtype.replace(/_/g, ' ')}
        </div>
      )}
      <svg width={numWidth} height={numHeight} className="overflow-visible block">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#8B8B88" />
          </marker>
        </defs>
        
        {/* Edges */}
        {edges.map((e: any, i: number) => {
          const fromPos = positions[e.from];
          const toPos = positions[e.to];
          if (!fromPos || !toPos) return null;

          const startX = fromPos.x;
          const startY = fromPos.y + rectHeight / 2; // Bottom of source
          const endX = toPos.x;
          const endY = toPos.y - rectHeight / 2; // Top of target

          const midY = (startY + endY) / 2;
          
          return (
            <g key={`edge-${i}`}>
              {/* Orthogonal routing: straight down to midY, horizontal to endX, then down */}
              <polyline 
                points={`${startX},${startY} ${startX},${midY} ${endX},${midY} ${endX},${endY}`} 
                fill="none" 
                stroke="#8B8B88" 
                strokeWidth="1.5"
                markerEnd="url(#arrowhead)"
              />
              
              {e.label && (
                <text 
                  x={(startX + endX) / 2} 
                  y={midY - 4} 
                  fill="#D4D4D8" 
                  fontSize="10" 
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((n: any, i: number) => {
          const pos = positions[n.id];
          if (!pos) return null;
          return (
            <g key={`node-${n.id || i}`} transform={`translate(${pos.x - rectWidth / 2}, ${pos.y - rectHeight / 2})`}>
              <rect 
                width={rectWidth} 
                height={rectHeight} 
                rx="6" 
                fill="#2C2C2A" 
                stroke="#E5A05F" 
                strokeWidth="2" 
              />
              <text 
                x={rectWidth / 2} 
                y={n.sublabel ? rectHeight / 2 - 2 : rectHeight / 2 + 4} 
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
                  x={rectWidth / 2} 
                  y={rectHeight / 2 + 12} 
                  fill="#A1A1AA" 
                  fontSize="9" 
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
