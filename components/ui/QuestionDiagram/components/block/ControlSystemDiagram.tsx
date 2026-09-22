import React from 'react';
import { normalizeDiagramSpec, computeLayerLayout, classifyAndRouteArcs } from '../../../layoutUtils';

export function ControlSystemDiagram({ data, width = 500, height = 320 }: any) {
  // Note: normalizeDiagramSpec now correctly preserves `sign` for control_system edges.
  // The editor can safely manipulate `sign` on the edge object.
  const { nodes, edges } = normalizeDiagramSpec(data);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Control System - No Data]
        </div>
      </div>
    );
  }

  const numWidth = typeof width === 'number' ? width : 500;
  const numHeight = typeof height === 'number' ? height : 320;

  // LR layout for control systems
  const positions = computeLayerLayout(nodes, edges, numWidth, numHeight, 'LR');
  const routedEdges = classifyAndRouteArcs(edges, positions, 'LR');

  const rectWidth = 80;
  const rectHeight = 40;
  const summerRadius = 15;

  return (
    <div className="relative mt-2" style={{ width: numWidth, height: numHeight }}>
      <div className="absolute top-2 right-2 px-2 py-1 bg-[#2C2C2A] text-[#E5A05F] text-[10px] rounded border border-[#3A3A38] uppercase tracking-wider font-semibold shadow-sm z-10 pointer-events-none">
        CONTROL SYSTEM
      </div>
      <svg width={numWidth} height={numHeight} className="overflow-visible block">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#8B8B88" />
          </marker>
        </defs>

        {/* Edges */}
        {routedEdges.map((e: any, i: number) => {
          const fromNode = nodes.find(n => n.id === e.from);
          const toNode = nodes.find(n => n.id === e.to);
          const fromPos = positions[e.from];
          const toPos = positions[e.to];

          if (!fromPos || !toPos || !fromNode || !toNode) return null;

          // Adjust connection points based on node kind
          const getOffsetX = (node: any) => {
            if (node.kind === 'block') return rectWidth / 2;
            if (node.kind === 'summer') return summerRadius;
            return 0; // input/output
          };

          const startX = fromPos.x + getOffsetX(fromNode);
          const startY = fromPos.y;
          const endX = toPos.x - getOffsetX(toNode);
          const endY = toPos.y;

          const isToSummer = toNode.kind === 'summer';
          const edgeSign = e.sign || '';

          if (e.isBackwardLayoutEdge) {
            // Backward layout arc (e.g. feedback)
            // Go up by (laneOffset * 30) from the highest node, then across, then down
            const laneHeight = 30;
            const arcY = Math.min(startY, endY) - (e.laneOffset * laneHeight) - 20;

            const midX = (startX + endX) / 2;

            return (
              <g key={`edge-${i}`}>
                <path
                  d={`M ${fromPos.x},${startY - (fromNode.kind === 'summer' ? summerRadius : (fromNode.kind === 'block' ? rectHeight / 2 : 0))} 
                      L ${fromPos.x},${arcY} 
                      L ${toPos.x},${arcY} 
                      L ${toPos.x},${endY - (toNode.kind === 'summer' ? summerRadius : (toNode.kind === 'block' ? rectHeight / 2 : 0))}`}
                  fill="none"
                  stroke="#8B8B88"
                  strokeWidth="1.5"
                  markerEnd="url(#arrowhead)"
                />
                {e.label && (
                  <text x={midX} y={arcY - 4} fill="#D4D4D8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    {e.label}
                  </text>
                )}
                {isToSummer && edgeSign && (
                  <text x={toPos.x} y={endY - summerRadius - 8} fill="#F4F4F5" fontSize="10" textAnchor="middle">
                    {edgeSign}
                  </text>
                )}
              </g>
            );
          } else {
            // Forward layout edge (straight line or simple L-shape if y differs)
            return (
              <g key={`edge-${i}`}>
                {startY === endY ? (
                  <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#8B8B88" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                ) : (
                  <polyline
                    points={`${startX},${startY} ${startX + 10},${startY} ${startX + 10},${endY} ${endX},${endY}`}
                    fill="none"
                    stroke="#8B8B88"
                    strokeWidth="1.5"
                    markerEnd="url(#arrowhead)"
                  />
                )}
                {e.label && (
                  <text x={(startX + endX) / 2} y={startY - 4} fill="#D4D4D8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    {e.label}
                  </text>
                )}
                {isToSummer && edgeSign && (
                  <text x={endX - 4} y={endY - 4} fill="#F4F4F5" fontSize="10" textAnchor="end">
                    {edgeSign}
                  </text>
                )}
              </g>
            );
          }
        })}

        {/* Nodes */}
        {nodes.map((n: any, i: number) => {
          const pos = positions[n.id];
          if (!pos) return null;

          if (n.kind === 'summer') {
            // Render summer (circle with cross)
            return (
              <g key={`node-${n.id || i}`} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle r={summerRadius} fill="#2C2C2A" stroke="#E5A05F" strokeWidth="2" />
                <line x1={-summerRadius} y1={-summerRadius} x2={summerRadius} y2={summerRadius} stroke="#E5A05F" strokeWidth="1" />
                <line x1={-summerRadius} y1={summerRadius} x2={summerRadius} y2={-summerRadius} stroke="#E5A05F" strokeWidth="1" />
              </g>
            );
          } else if (n.kind === 'block') {
            return (
              <g key={`node-${n.id || i}`} transform={`translate(${pos.x - rectWidth / 2}, ${pos.y - rectHeight / 2})`}>
                <rect width={rectWidth} height={rectHeight} rx="2" fill="#2C2C2A" stroke="#E5A05F" strokeWidth="2" />
                <text x={rectWidth / 2} y={rectHeight / 2 + 4} fill="#F4F4F5" fontSize="12" fontWeight="500" textAnchor="middle" fontFamily="sans-serif">
                  {n.label}
                </text>
              </g>
            );
          } else {
            // input or output (just text)
            return (
              <g key={`node-${n.id || i}`} transform={`translate(${pos.x}, ${pos.y})`}>
                <text x={0} y={4} fill="#A1A1AA" fontSize="12" fontWeight="500" textAnchor="middle" fontFamily="sans-serif">
                  {n.label}
                </text>
              </g>
            );
          }
        })}
      </svg>
    </div>
  );
}
