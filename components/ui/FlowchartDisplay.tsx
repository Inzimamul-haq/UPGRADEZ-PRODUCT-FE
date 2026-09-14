import React from 'react';
import { normalizeDiagramSpec, computeLayerLayout } from './layoutUtils';

export function FlowchartDisplay({ data, subtype, width = 500, height = 320 }: any) {
  const { nodes, edges } = normalizeDiagramSpec(data);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Flowchart{subtype ? `: ${subtype}` : ''} - No Data]
        </div>
      </div>
    );
  }

  const numWidth = typeof width === 'number' ? width : 500;
  const numHeight = typeof height === 'number' ? height : 320;
  
  const positions = computeLayerLayout(nodes, edges, numWidth, numHeight, 'TB');

  const getShape = (n: any) => {
    const t = (n.type || n.kind || '').toLowerCase();
    const l = (n.label || '').toLowerCase();
    
    if (t === 'decision' || l.startsWith('if') || l.startsWith('is') || l.startsWith('check') || l.endsWith('?')) {
      return 'diamond';
    }
    if (t === 'start' || t === 'end' || l === 'start' || l === 'end' || l === 'stop') {
      return 'oval';
    }
    return 'rect';
  };

  const rectW = 100;
  const rectH = 40;

  return (
    <div className="relative mt-2" style={{ width: numWidth, height: numHeight }}>
      <svg width={numWidth} height={numHeight} className="overflow-visible block">
        <defs>
          <marker id="arrowhead-flow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#8B8B88" />
          </marker>
        </defs>
        
        {/* Edges */}
        {edges.map((e: any, i: number) => {
          const fromPos = positions[e.from];
          const toPos = positions[e.to];
          if (!fromPos || !toPos) return null;

          const startX = fromPos.x;
          const startY = fromPos.y + rectH / 2;
          const endX = toPos.x;
          const endY = toPos.y - rectH / 2;

          const midY = (startY + endY) / 2;
          
          return (
            <g key={`edge-${i}`}>
              <polyline 
                points={`${startX},${startY} ${startX},${midY} ${endX},${midY} ${endX},${endY}`} 
                fill="none" 
                stroke="#8B8B88" 
                strokeWidth="1.5"
                markerEnd="url(#arrowhead-flow)"
              />
              
              {e.label && (
                <g transform={`translate(${(startX + endX) / 2}, ${midY})`}>
                  <rect x={-15} y={-8} width={30} height={16} fill="#1C1C1B" />
                  <text 
                    x={0} 
                    y={3} 
                    fill="#D4D4D8" 
                    fontSize="10" 
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {e.label}
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
          
          const shape = getShape(n);
          
          return (
            <g key={`node-${n.id || i}`} transform={`translate(${pos.x}, ${pos.y})`}>
              {shape === 'diamond' && (
                <polygon 
                  points={`0,${-rectH/2} ${rectW/2},0 0,${rectH/2} ${-rectW/2},0`} 
                  fill="#2C2C2A" 
                  stroke="#E5A05F" 
                  strokeWidth="2" 
                />
              )}
              {shape === 'oval' && (
                <ellipse 
                  cx={0} 
                  cy={0} 
                  rx={rectW/2} 
                  ry={rectH/2} 
                  fill="#2C2C2A" 
                  stroke="#60A5FA" 
                  strokeWidth="2" 
                />
              )}
              {shape === 'rect' && (
                <rect 
                  x={-rectW/2} 
                  y={-rectH/2} 
                  width={rectW} 
                  height={rectH} 
                  rx="4" 
                  fill="#2C2C2A" 
                  stroke="#A1A1AA" 
                  strokeWidth="2" 
                />
              )}
              
              <text 
                x={0} 
                y={4} 
                fill="#F4F4F5" 
                fontSize="11" 
                fontWeight="500" 
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
