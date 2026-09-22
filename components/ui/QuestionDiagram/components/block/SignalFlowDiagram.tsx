import React from 'react';
import { normalizeDiagramSpec, computeLayerLayout, classifyAndRouteArcs } from '../../../layoutUtils';

export function SignalFlowDiagram({ data, width = 500, height = 320 }: any) {
  const { nodes, edges } = normalizeDiagramSpec(data);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Signal Flow - No Data]
        </div>
      </div>
    );
  }

  const numWidth = typeof width === 'number' ? width : 500;
  const numHeight = typeof height === 'number' ? height : 320;
  
  // LR layout for signal flow
  const positions = computeLayerLayout(nodes, edges, numWidth, numHeight, 'LR');
  const routedEdges = classifyAndRouteArcs(edges, positions, 'LR');

  const nodeRadius = 6;

  return (
    <div className="relative mt-2" style={{ width: numWidth, height: numHeight }}>
      <div className="absolute top-2 right-2 px-2 py-1 bg-[#2C2C2A] text-[#E5A05F] text-[10px] rounded border border-[#3A3A38] uppercase tracking-wider font-semibold shadow-sm z-10 pointer-events-none">
        SIGNAL FLOW GRAPH
      </div>
      <svg width={numWidth} height={numHeight} className="overflow-visible block">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#8B8B88" />
          </marker>
        </defs>
        
        {/* Edges */}
        {routedEdges.map((e: any, i: number) => {
          const fromPos = positions[e.from];
          const toPos = positions[e.to];
          
          if (!fromPos || !toPos) return null;

          const startX = fromPos.x;
          const startY = fromPos.y;
          const endX = toPos.x;
          const endY = toPos.y;
          const gain = e.gain || e.label || "1";

          if (e.isBackwardLayoutEdge) {
            // Backward arc (feedback)
            const laneHeight = 30;
            const arcY = Math.min(startY, endY) - (e.laneOffset * laneHeight) - 10;
            const midX = (startX + endX) / 2;

            return (
              <g key={`edge-${i}`}>
                {/* Draw curved path for backward edge */}
                <path
                  d={`M ${startX},${startY - nodeRadius} 
                      Q ${startX},${arcY} ${midX},${arcY} 
                      Q ${endX},${arcY} ${endX},${endY - nodeRadius}`}
                  fill="none"
                  stroke="#8B8B88"
                  strokeWidth="1.5"
                  markerEnd="url(#arrowhead)"
                />
                <rect x={midX - 12} y={arcY - 10} width={24} height={14} fill="#1C1C1B" rx="2" />
                <text x={midX} y={arcY} fill="#D4D4D8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  {gain}
                </text>
              </g>
            );
          } else {
            // Forward edge (straight line with gain in the middle)
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            return (
              <g key={`edge-${i}`}>
                <line 
                  x1={startX + nodeRadius} 
                  y1={startY} 
                  x2={endX - nodeRadius} 
                  y2={endY} 
                  stroke="#8B8B88" 
                  strokeWidth="1.5" 
                  markerEnd="url(#arrowhead)" 
                />
                <rect x={midX - 12} y={midY - 10} width={24} height={14} fill="#1C1C1B" rx="2" />
                <text x={midX} y={midY} fill="#D4D4D8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  {gain}
                </text>
              </g>
            );
          }
        })}

        {/* Nodes */}
        {nodes.map((n: any, i: number) => {
          const pos = positions[n.id];
          if (!pos) return null;

          return (
            <g key={`node-${n.id || i}`} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle r={nodeRadius} fill="#E5A05F" />
              {n.label && (
                <text x={0} y={16} fill="#F4F4F5" fontSize="12" fontWeight="500" textAnchor="middle" fontFamily="sans-serif">
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
