import React from 'react';

interface Force {
  name: string;
  direction: string;
  magnitude: string;
}

export interface FreeBodySpec {
  object: string;
  forces: Force[];
  angle?: string;
}

export function FreeBodyDisplay({ fbd, width = 300, height = 250 }: { fbd: FreeBodySpec, width?: number, height?: number }) {
  return (
    <svg width={width} height={height} className="bg-[#1C1C1B] rounded-lg">
      <text x={10} y={20} fill="#D1D1C7" fontSize={12} fontFamily="sans-serif">Free Body Diagram</text>
      <rect x={width / 2 - 20} y={height / 2 - 20} width={40} height={40} fill="#2C2C2A" stroke="#10B981" />
      <text x={width / 2} y={height / 2 + 35} fill="#ECECEA" fontSize={10} textAnchor="middle">{fbd.object}</text>
      {fbd.forces?.map((f, i) => (
        <g key={i} transform={`translate(${width / 2}, ${height / 2})`}>
          {/* Mock arrows for forces */}
          <line x1={0} y1={0} x2={40 * Math.cos(i)} y2={40 * Math.sin(i)} stroke="#EF4444" strokeWidth={2} markerEnd="url(#arrow)" />
          <text x={50 * Math.cos(i)} y={50 * Math.sin(i)} fill="#EF4444" fontSize={10}>{f.name} ({f.magnitude})</text>
        </g>
      ))}
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#EF4444" />
        </marker>
      </defs>
    </svg>
  );
}
