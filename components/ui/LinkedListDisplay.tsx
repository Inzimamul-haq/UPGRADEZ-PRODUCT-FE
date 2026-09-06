import React from 'react';

export interface LinkedListData {
  nodes?: { id?: string | number; value?: any; label?: any }[];
  edges?: { from: string | number; to: string | number }[];
  values?: any[];
}

interface LinkedListDisplayProps {
  list: LinkedListData;
  width?: number;
  height?: number;
}

export function LinkedListDisplay({ list, width = 400, height = 120 }: LinkedListDisplayProps) {
  let values: any[] = [];
  if (list.values && Array.isArray(list.values) && list.values.length > 0) {
    values = list.values;
  } else if (list.nodes && Array.isArray(list.nodes)) {
    // try to order them if edges exist
    if (list.edges && Array.isArray(list.edges) && list.edges.length > 0) {
      const nodeMap = new Map(list.nodes.map(n => [String(n.id), n.label !== undefined ? n.label : (n.value !== undefined ? n.value : n.id)]));
      const nextMap = new Map(list.edges.map(e => [String(e.from), String(e.to)]));
      const hasPrev = new Set(list.edges.map(e => String(e.to)));
      
      // Find start node
      let current = list.nodes.find(n => !hasPrev.has(String(n.id)))?.id;
      if (!current && list.nodes.length > 0) current = list.nodes[0].id; // fallback
      
      const ordered = [];
      const visited = new Set();
      while (current !== undefined && !visited.has(String(current))) {
        visited.add(String(current));
        ordered.push(nodeMap.get(String(current)));
        current = nextMap.get(String(current));
      }
      values = ordered;
    } else {
      // just take as is
      values = list.nodes.map(n => n.label !== undefined ? n.label : (n.value !== undefined ? n.value : n.id));
    }
  }

  if (values.length === 0) {
    return (
      <svg width={width} height={height} className="mx-auto block">
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#888" fontSize={12}>
          Invalid linked list data
        </text>
      </svg>
    );
  }

  const boxW = 40;
  const boxH = 30;
  const gap = 30;
  const totalW = values.length * boxW + (values.length - 1) * gap;
  const startX = Math.max((width - totalW) / 2, 10);
  const startY = (height - boxH) / 2;
  const actualW = Math.max(width, totalW + 20);

  return (
    <svg width={actualW} height={height} className="mx-auto block" style={{ background: 'transparent' }}>
      {values.map((val, i) => {
        const x = startX + i * (boxW + gap);
        const y = startY;
        return (
          <g key={i}>
            <rect x={x} y={y} width={boxW} height={boxH} fill="#262626" stroke="#EBEBEA" strokeWidth="1.5" rx={4} />
            <text x={x + boxW / 2} y={y + boxH / 2} dy="4" textAnchor="middle" fill="#EBEBEA" fontSize={12} fontWeight="bold">
              {String(val)}
            </text>
            {i < values.length - 1 && (
              <g>
                <line x1={x + boxW} y1={y + boxH / 2} x2={x + boxW + gap - 6} y2={y + boxH / 2} stroke="#8C8C8A" strokeWidth="1.5" />
                <polygon points={`${x + boxW + gap - 6},${y + boxH / 2 - 4} ${x + boxW + gap},${y + boxH / 2} ${x + boxW + gap - 6},${y + boxH / 2 + 4}`} fill="#8C8C8A" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
