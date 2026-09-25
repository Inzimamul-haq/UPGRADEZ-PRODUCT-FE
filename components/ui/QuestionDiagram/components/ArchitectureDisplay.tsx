import React from 'react';
import { normalizeDiagramSpec, computeLayerLayout } from '../../layoutUtils';

export function ArchitectureDisplay({ data, subtype, width = 500, height = 320 }: any) {
  const { nodes, edges } = normalizeDiagramSpec(data);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Architecture Diagram{subtype ? `: ${subtype}` : ''} - No Data]
        </div>
      </div>
    );
  }

  const numWidth = typeof width === 'number' ? width : 500;
  const numHeight = typeof height === 'number' ? height : 320;

  const positions = computeLayerLayout(nodes, edges, numWidth, numHeight, 'TB');

  const rectWidth = 140;
  const rectHeight = 48;

  return (
    <div className="relative mt-2" style={{ width: numWidth, height: numHeight }}>
      <svg width={numWidth} height={numHeight} viewBox={`0 0 ${numWidth} ${numHeight}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', maxWidth: '100%' }} className="overflow-visible block">
        <defs>
          <marker id="arrowhead-arch" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6C6C6A" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e: any, i: number) => {
          const fromPos = positions[e.from];
          const toPos = positions[e.to];
          if (!fromPos || !toPos) return null;

          const startX = fromPos.x;
          const startY = fromPos.y + rectHeight / 2;
          const endX = toPos.x;
          const endY = toPos.y - rectHeight / 2;

          const midY = (startY + endY) / 2;

          return (
            <g key={`edge-${i}`}>
              <polyline
                points={`${startX},${startY} ${startX},${midY} ${endX},${midY} ${endX},${endY}`}
                fill="none"
                stroke="#6C6C6A"
                strokeWidth="1.5"
                strokeDasharray={e.label ? "4 4" : "none"}
                markerEnd="url(#arrowhead-arch)"
              />

              {e.label && (
                <g transform={`translate(${(startX + endX) / 2}, ${midY})`}>
                  <rect x={-20} y={-8} width={40} height={16} fill="#1C1C1B" />
                  <text
                    x={0}
                    y={3}
                    fill="#A1A1AA"
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
          return (
            <g key={`node-${n.id || i}`} transform={`translate(${pos.x - rectWidth / 2}, ${pos.y - rectHeight / 2})`}>
              <rect
                width={rectWidth}
                height={rectHeight}
                rx="8"
                fill="#27272A"
                stroke="#4F46E5"
                strokeWidth="2"
              />
              <text
                x={rectWidth / 2}
                y={n.sublabel ? rectHeight / 2 - 2 : rectHeight / 2 + 4}
                fill="#F4F4F5"
                fontSize="13"
                fontWeight="500"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {n.label}
              </text>
              {n.sublabel && (
                <text
                  x={rectWidth / 2}
                  y={rectHeight / 2 + 14}
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
