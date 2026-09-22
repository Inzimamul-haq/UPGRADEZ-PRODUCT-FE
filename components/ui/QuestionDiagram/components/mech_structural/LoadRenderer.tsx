import React from 'react';
import { STRUCTURAL_STYLES } from './constants';

interface LoadRendererProps {
  x: number;
  y: number;
  type: string;
  magnitude?: string;
  direction?: string;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
}

export function LoadRenderer({ x, y, type, magnitude, direction, fromX, fromY, toX, toY }: LoadRendererProps) {
  const dir = (direction || '').toLowerCase();
  
  if (type === 'udl' && fromX !== undefined && fromY !== undefined && toX !== undefined && toY !== undefined) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    
    // Perpendicular unit vector
    let px = ny;
    let py = -nx;
    
    let pushFactor = 1;
    if (dir.includes('up')) {
      pushFactor = -1;
    }

    const tailDist = 30 * pushFactor;
    const headDist = 8 * pushFactor;
    const textDist = 45 * pushFactor;

    return (
      <g>
        <defs>
          <marker id="load-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth={STRUCTURAL_STYLES.MARKER_SIZE} markerHeight={STRUCTURAL_STYLES.MARKER_SIZE} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff6b6b" />
          </marker>
        </defs>
        {[0.2, 0.5, 0.8].map((frac, idx) => {
           const cx = fromX + dx * frac;
           const cy = fromY + dy * frac;
           const lx1 = cx + px * tailDist;
           const ly1 = cy + py * tailDist;
           const lx2 = cx + px * headDist;
           const ly2 = cy + py * headDist;
           return <line key={idx} x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="#ff6b6b" strokeWidth="2" markerEnd="url(#load-arrow)" />
        })}
        <line 
          x1={fromX + px * tailDist} y1={fromY + py * tailDist} 
          x2={toX + px * tailDist} y2={toY + py * tailDist} 
          stroke="#ff6b6b" strokeWidth="1" 
        />
        <text 
          x={fromX + dx * 0.5 + px * textDist} 
          y={fromY + dy * 0.5 + py * textDist + 5} 
          fill="#ff6b6b" fontSize={STRUCTURAL_STYLES.FONT_SIZE_LOAD} fontFamily="sans-serif" textAnchor="middle" fontWeight={STRUCTURAL_STYLES.FONT_WEIGHT_LOAD}>
          {magnitude}
        </text>
      </g>
    );
  }

  if (type === 'moment') {
    return (
      <g>
        <defs>
          <marker id="load-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth={STRUCTURAL_STYLES.MARKER_SIZE} markerHeight={STRUCTURAL_STYLES.MARKER_SIZE} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff6b6b" />
          </marker>
        </defs>
        <path d={`M ${x-15} ${y-15} A 20 20 0 1 1 ${x+15} ${y-15}`} fill="none" stroke="#ff6b6b" strokeWidth="2" markerEnd="url(#load-arrow)" />
        <text x={x} y={y - 40} fill="#ff6b6b" fontSize={STRUCTURAL_STYLES.FONT_SIZE_LOAD} fontFamily="sans-serif" textAnchor="middle" fontWeight={STRUCTURAL_STYLES.FONT_WEIGHT_LOAD}>
          {magnitude}
        </text>
      </g>
    );
  }

  // point load on a member or joint
  let px = 0, py = -1; 
  if (fromX !== undefined && fromY !== undefined && toX !== undefined && toY !== undefined) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    px = dy / len;
    py = -dx / len;
  }

  let vecX = 0, vecY = 1; 
  if (dir.includes('up')) { vecX = 0; vecY = -1; }
  else if (dir.includes('left')) { vecX = -1; vecY = 0; }
  else if (dir.includes('right')) { vecX = 1; vecY = 0; }
  else if (fromX !== undefined) { 
    vecX = -px;
    vecY = -py;
  }

  const arrLen = 40;
  const headDist = 8;
  const x1 = x - vecX * arrLen;
  const y1 = y - vecY * arrLen;
  const x2 = x - vecX * headDist;
  const y2 = y - vecY * headDist;
  
  const textX = x - vecX * (arrLen + 15);
  const textY = y - vecY * (arrLen + 15) + 5;

  return (
    <g>
      <defs>
        <marker id="load-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth={STRUCTURAL_STYLES.MARKER_SIZE} markerHeight={STRUCTURAL_STYLES.MARKER_SIZE} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff6b6b" />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff6b6b" strokeWidth="2" markerEnd="url(#load-arrow)" />
      <text x={textX} y={textY} fill="#ff6b6b" fontSize={STRUCTURAL_STYLES.FONT_SIZE_LOAD} fontFamily="sans-serif" textAnchor="middle" fontWeight={STRUCTURAL_STYLES.FONT_WEIGHT_LOAD}>
        {magnitude}
      </text>
    </g>
  );
}
