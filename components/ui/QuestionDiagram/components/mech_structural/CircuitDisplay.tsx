import React from 'react';
import { normalizeDiagramSpec, computeLayerLayout } from '../../../layoutUtils';

const zigzagPoints = (x: number, y: number, w: number, h: number) => {
  const steps = 6;
  const stepX = w / steps;
  let pts = `${x},${y} `;
  pts += `${x + stepX * 0.5},${y} `;
  for (let i = 1; i < steps - 1; i++) {
    const yOffset = i % 2 === 1 ? -h/2 : h/2;
    pts += `${x + i * stepX},${y + yOffset} `;
  }
  pts += `${x + stepX * (steps - 0.5)},${y} `;
  pts += `${x + w},${y}`;
  return pts;
};

const coilPath = (x: number, y: number, w: number, h: number) => {
  const loops = 4;
  const loopW = w / loops;
  let d = `M ${x},${y} `;
  for(let i = 0; i < loops; i++) {
    const cx = x + i * loopW + loopW/2;
    d += `C ${cx - loopW/4},${y - h} ${cx + loopW/4},${y - h} ${x + (i+1)*loopW},${y} `;
  }
  return d;
};

function ComponentSymbol({ type, x, y, width = 40, height = 20 }: any) {
  const t = (type || '').toLowerCase();
  
  if (t.includes('resistor')) {
    return <polyline points={zigzagPoints(x - width/2, y, width, height)} stroke="#E5A05F" fill="none" strokeWidth="2" strokeLinejoin="round" />;
  }
  if (t.includes('capacitor')) {
    return (
      <g stroke="#F4F4F5" strokeWidth="2">
        <line x1={x - 4} y1={y - height/2} x2={x - 4} y2={y + height/2} />
        <line x1={x + 4} y1={y - height/2} x2={x + 4} y2={y + height/2} />
        <line x1={x - width/2} y1={y} x2={x - 4} y2={y} />
        <line x1={x + 4} y1={y} x2={x + width/2} y2={y} />
      </g>
    );
  }
  if (t.includes('inductor')) {
    return <path d={coilPath(x - width/2, y, width, height)} stroke="#4ADE80" fill="none" strokeWidth="2" />;
  }
  if (t.includes('source') || t.includes('battery')) {
    return (
      <g stroke="#C084FC" strokeWidth="2">
        <circle cx={x} cy={y} r={14} fill="#1C1C1B" />
        <line x1={x - width/2} y1={y} x2={x - 14} y2={y} />
        <line x1={x + 14} y1={y} x2={x + width/2} y2={y} />
        <text x={x - 4} y={y - 2} fill="#C084FC" stroke="none" fontSize="10" fontFamily="monospace" textAnchor="middle">+</text>
        <text x={x - 4} y={y + 8} fill="#C084FC" stroke="none" fontSize="10" fontFamily="monospace" textAnchor="middle">-</text>
      </g>
    );
  }
  
  // Default box (impedance / generic block)
  return (
    <g>
      <rect x={x - 15} y={y - 10} width="30" height="20" rx="2" fill="#2C2C2A" stroke="#A1A1AA" strokeWidth="2" />
      <line x1={x - width/2} y1={y} x2={x - 15} y2={y} stroke="#A1A1AA" strokeWidth="2" />
      <line x1={x + 15} y1={y} x2={x + width/2} y2={y} stroke="#A1A1AA" strokeWidth="2" />
    </g>
  );
}

export function CircuitDisplay({ circuit, subtype, width = 500, height = 320 }: any) {
  const { nodes, edges } = normalizeDiagramSpec(circuit);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Circuit Diagram{subtype ? `: ${subtype}` : ''} - No Data]
        </div>
      </div>
    );
  }

  const numWidth = typeof width === 'number' ? width : 500;
  const numHeight = typeof height === 'number' ? height : 320;
  
  // LR Layout naturally handles series and parallel branches
  // Components in parallel will be placed in the same layer (same X, different Y)
  const positions = computeLayerLayout(nodes, edges, numWidth, numHeight, 'LR');
  const compWidth = 40;

  return (
    <div className="relative mt-2" style={{ width: numWidth, height: numHeight }}>
      {subtype && subtype !== 'generic' && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-[#2C2C2A] text-[#C084FC] text-[10px] rounded border border-[#3A3A38] uppercase tracking-wider font-semibold shadow-sm z-10 pointer-events-none">
          {subtype.replace(/_/g, ' ')}
        </div>
      )}
      <svg width={numWidth} height={numHeight} viewBox={`0 0 ${numWidth} ${numHeight}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', maxWidth: '100%' }} className="overflow-visible block bg-[#1C1C1B] rounded-lg border border-[#3A3A38]">
        
        {/* Draw Edges / Wires */}
        {edges.map((e: any, i: number) => {
          const fromPos = positions[e.from];
          const toPos = positions[e.to];
          if (!fromPos || !toPos) return null;

          const startX = fromPos.x + compWidth / 2;
          const startY = fromPos.y;
          const endX = toPos.x - compWidth / 2;
          const endY = toPos.y;

          // Detect loop-closure: if an edge routes backwards (to an earlier or same layer)
          // Route it as a return wire along the bottom of the canvas
          if (endX <= startX + 10) {
            const bottomY = numHeight - 20;
            return (
              <g key={`wire-${i}`}>
                <polyline 
                  points={`${startX},${startY} ${startX},${bottomY} ${endX},${bottomY} ${endX},${endY}`} 
                  fill="none" 
                  stroke="#8B8B88" 
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </g>
            );
          }

          // Orthogonal routing for forward edges (series/parallel branches)
          // To cleanly fan out to parallel branches without overlapping, we route:
          // right to a midpoint, vertical to target Y, right to target X.
          const midX = (startX + endX) / 2;
          
          return (
            <g key={`wire-${i}`}>
              <polyline 
                points={`${startX},${startY} ${midX},${startY} ${midX},${endY} ${endX},${endY}`} 
                fill="none" 
                stroke="#A1A1AA" 
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* Draw Components */}
        {nodes.map((n: any, i: number) => {
          const pos = positions[n.id];
          if (!pos) return null;
          
          return (
            <g key={`comp-${n.id || i}`}>
              {/* Component Symbol */}
              <ComponentSymbol type={n.type} x={pos.x} y={pos.y} width={compWidth} height={20} />
              
              {/* Labels (ID and value) placed near the symbol */}
              <text 
                x={pos.x} 
                y={pos.y - 18} 
                fill="#F4F4F5" 
                fontSize="11" 
                fontWeight="600" 
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {n.id}
              </text>
              {n.label && n.label !== n.id && (
                <text 
                  x={pos.x} 
                  y={pos.y + 22} 
                  fill="#E4E4E7" 
                  fontSize="10" 
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {n.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
