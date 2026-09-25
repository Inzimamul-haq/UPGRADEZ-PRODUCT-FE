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

  // Detect doubly linked list: back-edges exist when edges go both A→B and B→A
  const isDoubly = (() => {
    if (!list.edges || list.edges.length < 2) return false;
    const edgeSet = new Set(list.edges.map(e => `${e.from}->${e.to}`));
    return list.edges.some(e => edgeSet.has(`${e.to}->${e.from}`));
  })();

  if (values.length === 0) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', maxWidth: '100%' }} className="mx-auto block">
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

  const arrowColor = '#8C8C8A';
  const ARROW_SIZE = 5;

  return (
    <svg width={actualW} height={height} viewBox={`0 0 ${actualW} ${height}`} preserveAspectRatio="xMidYMid meet" className="mx-auto block" style={{ display: 'block', maxWidth: '100%',  background: 'transparent' }}>
      {values.map((val, i) => {
        const x = startX + i * (boxW + gap);
        const y = startY;

        // x coords for the connector segment between box i and box i+1
        const lineX1 = x + boxW;
        const lineX2 = x + boxW + gap;
        const midY = y + boxH / 2;

        return (
          <g key={i}>
            <rect x={x} y={y} width={boxW} height={boxH} fill="#262626" stroke="#EBEBEA" strokeWidth="1.5" rx={4} />
            <text x={x + boxW / 2} y={y + boxH / 2} dy="4" textAnchor="middle" fill="#EBEBEA" fontSize={12} fontWeight="bold">
              {String(val)}
            </text>

            {i < values.length - 1 && (
              <g>
                {isDoubly ? (
                  <>
                    {/* Forward arrow (bottom lane) → */}
                    <line
                      x1={lineX1} y1={midY + 4}
                      x2={lineX2 - ARROW_SIZE} y2={midY + 4}
                      stroke={arrowColor} strokeWidth="1.5"
                    />
                    <polygon
                      points={`${lineX2 - ARROW_SIZE},${midY + 4 - 3} ${lineX2},${midY + 4} ${lineX2 - ARROW_SIZE},${midY + 4 + 3}`}
                      fill={arrowColor}
                    />
                    {/* Backward arrow (top lane) ← */}
                    <line
                      x1={lineX2} y1={midY - 4}
                      x2={lineX1 + ARROW_SIZE} y2={midY - 4}
                      stroke={arrowColor} strokeWidth="1.5"
                    />
                    <polygon
                      points={`${lineX1 + ARROW_SIZE},${midY - 4 - 3} ${lineX1},${midY - 4} ${lineX1 + ARROW_SIZE},${midY - 4 + 3}`}
                      fill={arrowColor}
                    />
                  </>
                ) : (
                  /* Single forward arrow */
                  <>
                    <line x1={lineX1} y1={midY} x2={lineX2 - ARROW_SIZE} y2={midY} stroke={arrowColor} strokeWidth="1.5" />
                    <polygon
                      points={`${lineX2 - ARROW_SIZE},${midY - 4} ${lineX2},${midY} ${lineX2 - ARROW_SIZE},${midY + 4}`}
                      fill={arrowColor}
                    />
                  </>
                )}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
