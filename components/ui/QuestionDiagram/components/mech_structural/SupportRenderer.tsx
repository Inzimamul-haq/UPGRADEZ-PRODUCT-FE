import React from 'react';

interface SupportRendererProps {
  x: number;
  y: number;
  type: string;
  orientation?: 'bottom' | 'top' | 'left' | 'right';
}

export function SupportRenderer({ x, y, type, orientation }: SupportRendererProps) {
  const sz = 16;
  const orient = orientation || 'bottom'; // Default bottom

  if (type === 'pin') {
    return (
      <g>
        {/* Triangle */}
        <polygon points={`${x},${y} ${x - sz},${y + sz} ${x + sz},${y + sz}`} fill="#FCD34D" stroke="#000" strokeWidth="1" />
        {/* Base line */}
        <line x1={x - sz - 5} y1={y + sz} x2={x + sz + 5} y2={y + sz} stroke="#FCD34D" strokeWidth="2" />
        {/* Hatches */}
        <line x1={x - sz} y1={y + sz} x2={x - sz - 5} y2={y + sz + 5} stroke="#FCD34D" strokeWidth="1" />
        <line x1={x} y1={y + sz} x2={x - 5} y2={y + sz + 5} stroke="#FCD34D" strokeWidth="1" />
        <line x1={x + sz} y1={y + sz} x2={x + sz - 5} y2={y + sz + 5} stroke="#FCD34D" strokeWidth="1" />
      </g>
    );
  }
  
  if (type === 'roller') {
    return (
      <g>
        {/* Triangle */}
        <polygon points={`${x},${y} ${x - sz},${y + sz - 8} ${x + sz},${y + sz - 8}`} fill="#60A5FA" stroke="#000" strokeWidth="1" />
        {/* Rollers (circles) */}
        <circle cx={x - 8} cy={y + sz - 4} r="4" fill="#60A5FA" stroke="#000" strokeWidth="1" />
        <circle cx={x + 8} cy={y + sz - 4} r="4" fill="#60A5FA" stroke="#000" strokeWidth="1" />
        {/* Base line */}
        <line x1={x - sz - 5} y1={y + sz} x2={x + sz + 5} y2={y + sz} stroke="#60A5FA" strokeWidth="2" />
      </g>
    );
  }
  
  if (type === 'fixed') {
    if (orient === 'bottom') {
      return (
        <g>
          <line x1={x - sz} y1={y} x2={x + sz} y2={y} stroke="#A3A3A0" strokeWidth="4" />
          <line x1={x - 10} y1={y} x2={x - 15} y2={y + 8} stroke="#A3A3A0" strokeWidth="1" />
          <line x1={x} y1={y} x2={x - 5} y2={y + 8} stroke="#A3A3A0" strokeWidth="1" />
          <line x1={x + 10} y1={y} x2={x + 5} y2={y + 8} stroke="#A3A3A0" strokeWidth="1" />
        </g>
      );
    }
    if (orient === 'top') {
      return (
        <g>
          <line x1={x - sz} y1={y} x2={x + sz} y2={y} stroke="#A3A3A0" strokeWidth="4" />
          <line x1={x - 10} y1={y} x2={x - 5} y2={y - 8} stroke="#A3A3A0" strokeWidth="1" />
          <line x1={x} y1={y} x2={x + 5} y2={y - 8} stroke="#A3A3A0" strokeWidth="1" />
          <line x1={x + 10} y1={y} x2={x + 15} y2={y - 8} stroke="#A3A3A0" strokeWidth="1" />
        </g>
      );
    }
    if (orient === 'right') {
      return (
        <g>
          <line x1={x} y1={y - sz} x2={x} y2={y + sz} stroke="#A3A3A0" strokeWidth="4" />
          <line x1={x} y1={y - 10} x2={x + 8} y2={y - 15} stroke="#A3A3A0" strokeWidth="1" />
          <line x1={x} y1={y} x2={x + 8} y2={y - 5} stroke="#A3A3A0" strokeWidth="1" />
          <line x1={x} y1={y + 10} x2={x + 8} y2={y + 5} stroke="#A3A3A0" strokeWidth="1" />
        </g>
      );
    }
    // Default / left
    return (
      <g>
        <line x1={x} y1={y - sz} x2={x} y2={y + sz} stroke="#A3A3A0" strokeWidth="4" />
        <line x1={x} y1={y - 10} x2={x - 8} y2={y - 2} stroke="#A3A3A0" strokeWidth="1" />
        <line x1={x} y1={y} x2={x - 8} y2={y + 8} stroke="#A3A3A0" strokeWidth="1" />
        <line x1={x} y1={y + 10} x2={x - 8} y2={y + 18} stroke="#A3A3A0" strokeWidth="1" />
      </g>
    );
  }
  
  return <rect x={x - 10} y={y} width="20" height="10" fill="#9CA3AF" />;
}
