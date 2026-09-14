import React from 'react';
import { normalizeDiagramSpec, computeLayerLayout } from './layoutUtils';

export function CircuitDisplay({ circuit, width = 500, height = 320 }: any) {
  const { nodes, edges } = normalizeDiagramSpec(circuit);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Circuit Diagram - No Data]
        </div>
      </div>
    );
  }

  const numWidth = typeof width === 'number' ? width : 500;
  const numHeight = typeof height === 'number' ? height : 320;
  
  const positions = computeLayerLayout(nodes, edges, numWidth, numHeight, 'LR');

  const rectWidth = 60;
  const rectHeight = 40;

  const getTypeColor = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('resistor')) return '#E5A05F'; // amber
    if (t.includes('capacitor')) return '#60A5FA'; // blue
    if (t.includes('inductor')) return '#4ADE80'; // green
    if (t.includes('source') || t.includes('battery')) return '#C084FC'; // purple
    return '#A1A1AA'; // gray
  };

  return (
    <div className="relative mt-2" style={{ width: numWidth, height: numHeight }}>
      <svg width={numWidth} height={numHeight} className="overflow-visible block bg-[#1C1C1B] rounded-lg border border-[#3A3A38]">
        {/* Edges / Wires */}
        {edges.map((e: any, i: number) => {
          const fromPos = positions[e.from];
          const toPos = positions[e.to];
          if (!fromPos || !toPos) return null;

          const startX = fromPos.x + rectWidth / 2; // Right of source
          const startY = fromPos.y;
          const endX = toPos.x - rectWidth / 2; // Left of target
          const endY = toPos.y;

          const midX = (startX + endX) / 2;
          
          return (
            <g key={`wire-${i}`}>
              {/* Wire routing: straight right to midX, vertical to endY, then right */}
              <polyline 
                points={`${startX},${startY} ${midX},${startY} ${midX},${endY} ${endX},${endY}`} 
                fill="none" 
                stroke="#A1A1AA" 
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Components */}
        {nodes.map((n: any, i: number) => {
          const pos = positions[n.id];
          if (!pos) return null;
          const color = getTypeColor(n.type);
          
          return (
            <g key={`comp-${n.id || i}`} transform={`translate(${pos.x - rectWidth / 2}, ${pos.y - rectHeight / 2})`}>
              {/* Terminal dots */}
              <circle cx={0} cy={rectHeight / 2} r={3} fill="#A1A1AA" />
              <circle cx={rectWidth} cy={rectHeight / 2} r={3} fill="#A1A1AA" />
              
              <rect 
                width={rectWidth} 
                height={rectHeight} 
                rx="4" 
                fill="#2C2C2A" 
                stroke={color} 
                strokeWidth="2" 
              />
              <text 
                x={rectWidth / 2} 
                y={n.label ? rectHeight / 2 - 2 : rectHeight / 2 + 4} 
                fill="#F4F4F5" 
                fontSize="12" 
                fontWeight="500" 
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {n.id}
              </text>
              {n.label && (
                <text 
                  x={rectWidth / 2} 
                  y={rectHeight / 2 + 12} 
                  fill="#E4E4E7" 
                  fontSize="10" 
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {n.label}
                </text>
              )}
              {n.type && (
                <text 
                  x={rectWidth / 2} 
                  y={-6} 
                  fill={color} 
                  fontSize="9" 
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {n.type}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
