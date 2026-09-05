import React from 'react';

interface LogicGate {
  id: string;
  kind: string;
  inputs: string[];
}

export interface LogicGateSpec {
  gates: LogicGate[];
  output: string;
}

export function LogicGateDisplay({ logic, width = 300, height = 250 }: { logic: LogicGateSpec, width?: number, height?: number }) {
  return (
    <svg width={width} height={height} className="bg-[#1C1C1B] rounded-lg">
      <text x={10} y={20} fill="#D1D1C7" fontSize={12} fontFamily="sans-serif">Logic Gate Diagram</text>
      {logic.gates?.map((g, i) => (
        <g key={g.id} transform={`translate(${40 + (i % 2) * 100}, ${50 + Math.floor(i / 2) * 60})`}>
          <circle cx={20} cy={15} r={20} fill="#2C2C2A" stroke="#818CF8" />
          <text x={20} y={18} fill="#ECECEA" fontSize={10} textAnchor="middle">{g.kind}</text>
          <text x={20} y={45} fill="#A1A1AA" fontSize={8} textAnchor="middle">{g.id}</text>
        </g>
      ))}
    </svg>
  );
}
