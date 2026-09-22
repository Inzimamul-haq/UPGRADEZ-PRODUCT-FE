import React from 'react';
import { LoadRenderer } from './LoadRenderer';
import { RendererProps } from './BeamRenderer';
import { STRUCTURAL_STYLES } from './constants';

export function FreeBodyRenderer({ nodes, edges, loads, mapX, mapY, getNode }: RendererProps) {
  // Free body diagrams - just blocks and forces.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  nodes.forEach(n => {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  });

  const mMinX = mapX(minX);
  const mMaxX = mapX(maxX);
  const mMinY = mapY(minY);
  const mMaxY = mapY(maxY);

  const w = Math.max(mMaxX - mMinX, 60);
  const h = Math.max(mMaxY - mMinY, 40);
  const cx = (mMinX + mMaxX) / 2;
  const cy = (mMinY + mMaxY) / 2;

  return (
    <g>
      {/* Central block body */}
      <rect 
        x={cx - w/2} y={cy - h/2} 
        width={w} height={h} 
        fill="#1e1e1e" 
        stroke="#4ADE80" 
        strokeWidth="2" 
        rx="4"
      />
      
      {/* Nodes / Application points */}
      {nodes.map((n: any, i: number) => {
        const x = mapX(n.x);
        const y = mapY(n.y);
        return (
          <g key={`node-${i}`}>
            <circle cx={x} cy={y} r="3" fill="#A3A3A0" stroke="none" />
            {(n.label || n.id) && (() => {
              const hasLoad = loads.some((l: any) => l.nodeId === n.id);
              let textX = x;
              let textY = y - 10;
              let anchor = "middle";

              if (hasLoad) {
                textX = x + 15;
                textY = y - 10;
                anchor = "start";
              }

              return (
                <text 
                  x={textX} y={textY} 
                  fill="#A3A3A0" 
                  fontSize={STRUCTURAL_STYLES.FONT_SIZE_NODE} 
                  fontWeight={STRUCTURAL_STYLES.FONT_WEIGHT_NODE}
                  fontFamily="sans-serif" 
                  textAnchor={anchor as any}
                >
                  {n.label || n.id}
                </text>
              );
            })()}
          </g>
        );
      })}

      {/* Loads / Forces */}
      {loads.map((l: any, i: number) => {
         let loadX = cx, loadY = cy;
         if (l.nodeId) {
           const n = getNode(l.nodeId);
           if (n) {
             loadX = mapX(n.x);
             loadY = mapY(n.y);
           }
         }
         return (
           <LoadRenderer 
             key={`load-${i}`} 
             x={loadX} y={loadY} 
             type={l.type} 
             magnitude={l.magnitude} 
             direction={l.direction}
           />
         );
      })}
    </g>
  );
}
