import React from 'react';
import { SupportRenderer } from './SupportRenderer';
import { LoadRenderer } from './LoadRenderer';
import { DimensionRenderer } from './DimensionRenderer';
import { RendererProps } from './BeamRenderer';
import { STRUCTURAL_STYLES } from './constants';

export function FrameRenderer({ nodes, edges, supports, loads, mapX, mapY, getNode }: RendererProps) {
  // Thicker lines, rigid frame appearance
  return (
    <g>
      {/* Edges / Rigid Frame Members */}
      {edges.map((e: any, i: number) => {
        const from = getNode(e.from);
        const to = getNode(e.to);
        if (!from || !to) return null;
        const isVertical = Math.abs(from.x - to.x) < 0.1;
        return (
          <g key={`edge-${i}`}>
            <line 
              x1={mapX(from.x)} y1={mapY(from.y)} 
              x2={mapX(to.x)} y2={mapY(to.y)} 
              stroke="currentColor" 
              strokeWidth="6" 
              strokeLinecap="square" 
            />
            <DimensionRenderer 
              fromX={mapX(from.x)} fromY={mapY(from.y)} 
              toX={mapX(to.x)} toY={mapY(to.y)} 
              label={e.dimension ? (e.dimension.label || `${e.dimension.value} ${e.dimension.unit || ''}`) : undefined}
              isVertical={isVertical}
            />
          </g>
        );
      })}

      {/* Nodes (Rigid Joints) */}
      {nodes.map((n: any, i: number) => {
        const x = mapX(n.x);
        const y = mapY(n.y);
        return (
          <g key={`node-${i}`}>
            <circle cx={x} cy={y} r="3" fill="#A3A3A0" stroke="currentColor" strokeWidth="1" />
            {(n.label || n.id) && (() => {
              const hasLoad = loads.some((l: any) => l.nodeId === n.id);
              const hasSupport = supports.some((s: any) => s.nodeId === n.id);
              let textX = x;
              let textY = y - 15;
              let anchor = "middle";

              if (hasLoad || hasSupport) {
                textX = x + 15;
                textY = y - 15;
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

      {/* Supports */}
      {supports.map((s: any, i: number) => {
        const n = getNode(s.nodeId);
        if (!n) return null;
        return <SupportRenderer key={`support-${i}`} x={mapX(n.x)} y={mapY(n.y)} type={s.type} />;
      })}

      {/* Loads */}
      {loads.map((l: any, i: number) => {
         let loadX = 0, loadY = 0;
         let fromX, fromY, toX, toY;
         
         if (l.nodeId) {
           const n = getNode(l.nodeId);
           if (!n) return null;
           loadX = mapX(n.x);
           loadY = mapY(n.y);
         } else if (l.memberFrom && l.memberTo) {
           const from = getNode(l.memberFrom);
           const to = getNode(l.memberTo);
           if (!from || !to) return null;
           
           fromX = mapX(from.x); fromY = mapY(from.y);
           toX = mapX(to.x); toY = mapY(to.y);
           
           let fraction = 0.5;
           if (l.position === 'start') fraction = 0.1;
           else if (l.position === 'end') fraction = 0.9;
           else if (l.position && l.position.includes('quarter')) fraction = 0.25;
           
           loadX = fromX + (toX - fromX) * fraction;
           loadY = fromY + (toY - fromY) * fraction;
         } else {
           return null;
         }

         return (
           <LoadRenderer 
             key={`load-${i}`} 
             x={loadX} y={loadY} 
             type={l.type} 
             magnitude={l.magnitude} 
             direction={l.direction}
             fromX={fromX} fromY={fromY} toX={toX} toY={toY}
           />
         );
      })}
    </g>
  );
}
