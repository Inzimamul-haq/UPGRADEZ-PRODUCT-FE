import React from 'react';
import { normalizeDiagramSpec, computeLayerLayout } from '../../../layoutUtils';

export function LogicGateDisplay({ logic, width = 500, height = 320 }: any) {
  const { nodes, edges } = normalizeDiagramSpec(logic);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Logic Gate Diagram - No Data]
        </div>
      </div>
    );
  }

  const numWidth = typeof width === 'number' ? width : 500;
  const numHeight = typeof height === 'number' ? height : 320;
  
  const positions = computeLayerLayout(nodes, edges, numWidth, numHeight, 'LR');

  const rectWidth = 60;
  const rectHeight = 40;

  const getGateColor = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('nand') || t.includes('nor')) return '#F87171'; // red
    if (t.includes('and')) return '#60A5FA'; // blue
    if (t.includes('xor') || t.includes('xnor')) return '#C084FC'; // purple
    if (t.includes('or')) return '#4ADE80'; // green
    if (t.includes('not') || t.includes('inv')) return '#FB923C'; // orange
    return '#A1A1AA'; // gray
  };

  const inDegree = new Map<string, number>();
  nodes.forEach(n => inDegree.set(n.id, 0));
  edges.forEach(e => {
    if (inDegree.has(e.to)) {
      inDegree.set(e.to, inDegree.get(e.to)! + 1);
    }
  });

  return (
    <div className="relative mt-2" style={{ width: numWidth, height: numHeight }}>
      <svg width={numWidth} height={numHeight} viewBox={`0 0 ${numWidth} ${numHeight}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', maxWidth: '100%' }} className="overflow-visible block bg-[#1C1C1B] rounded-lg border border-[#3A3A38]">
        {/* Wires */}
        {edges.map((e: any, i: number) => {
          const fromPos = positions[e.from];
          const toPos = positions[e.to];
          if (!fromPos || !toPos) return null;

          // For inputs (0 in-degree), draw from the center of the small circle
          // For gates, draw from the right edge
          const isInput = inDegree.get(e.from) === 0;
          const startX = isInput ? fromPos.x : fromPos.x + rectWidth / 2;
          const startY = fromPos.y;
          
          const endX = toPos.x - rectWidth / 2;
          const endY = toPos.y;

          const midX = (startX + endX) / 2;
          
          return (
            <g key={`wire-${i}`}>
              <polyline 
                points={`${startX},${startY} ${midX},${startY} ${midX},${endY} ${endX},${endY}`} 
                fill="none" 
                stroke="#A1A1AA" 
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Gates / Inputs */}
        {nodes.map((n: any, i: number) => {
          const pos = positions[n.id];
          if (!pos) return null;
          
          const isInput = inDegree.get(n.id) === 0;
          const color = getGateColor(n.type || n.label);
          
          if (isInput) {
            return (
              <g key={`input-${n.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle cx={0} cy={0} r={6} fill="#A1A1AA" />
                <text 
                  x={-10} 
                  y={4} 
                  fill="#F4F4F5" 
                  fontSize="12" 
                  fontWeight="600" 
                  textAnchor="end"
                  fontFamily="sans-serif"
                >
                  {n.id || n.label}
                </text>
              </g>
            );
          }
          
          return (
            <g key={`gate-${n.id || i}`} transform={`translate(${pos.x - rectWidth / 2}, ${pos.y - rectHeight / 2})`}>
              <rect 
                width={rectWidth} 
                height={rectHeight} 
                rx="4" 
                fill="#2C2C2A" 
                stroke={color} 
                strokeWidth="2" 
              />
              {/* Input dot */}
              <circle cx={0} cy={rectHeight / 2} r={3} fill="#A1A1AA" />
              {/* Output dot */}
              <circle cx={rectWidth} cy={rectHeight / 2} r={3} fill="#A1A1AA" />
              
              <text 
                x={rectWidth / 2} 
                y={rectHeight / 2 + 4} 
                fill="#F4F4F5" 
                fontSize="12" 
                fontWeight="600" 
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {n.type || n.label || n.id}
              </text>
              
              <text 
                x={rectWidth / 2} 
                y={-6} 
                fill="#A1A1AA" 
                fontSize="10" 
                textAnchor="middle"
                fontFamily="monospace"
              >
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
