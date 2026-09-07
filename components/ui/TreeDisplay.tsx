import React from 'react';

export interface TreeData {
  nodes: { id: number | string; label?: any; value?: any }[];
  edges: { from: number | string; to: number | string }[];
}

interface TreeDisplayProps {
  tree: TreeData;
  width?: number;
  height?: number;
}

export function TreeDisplay({ tree, width = 260, height = 260 }: TreeDisplayProps) {
  const { nodes, edges } = tree;

  function buildLevelOrder(nodes: {id:number | string, label?: any, value?: any}[], edges: {from:number | string,to:number | string}[]) {
    const MAX_NODES = 50;
    const childrenOf = new Map<number | string, (number | string)[]>();
    const hasParent = new Set<number | string>();
    const knownIds = new Set(nodes.map(n => n.id));

    for (const e of edges) {
      if (!knownIds.has(e.from) || !knownIds.has(e.to)) continue; // unknown id guard
      if (!childrenOf.has(e.from)) childrenOf.set(e.from, []);
      childrenOf.get(e.from)!.push(e.to);
      hasParent.add(e.to);
    }

    const roots = nodes.filter(n => !hasParent.has(n.id));
    if (roots.length === 0) return []; // cycle or no valid root

    const visited = new Set<number | string>();
    const levels: (number | string)[][] = [];
    let queue = roots.map(r => r.id);

    while (queue.length > 0 && visited.size < MAX_NODES) {
      levels.push(queue);
      const next: (number | string)[] = [];
      for (const id of queue) {
        if (visited.has(id)) continue;
        visited.add(id);
        for (const child of (childrenOf.get(id) ?? [])) {
          if (!visited.has(child)) next.push(child);
        }
      }
      queue = next;
    }
    return levels;
  }

  const levels = buildLevelOrder(nodes || [], edges || []);
  if (levels.length === 0) {
    return (
      <svg width={width} height={height} className="mx-auto block" style={{ background: 'transparent' }}>
        <text x={width/2} y={height/2} textAnchor="middle" fill="#888" fontSize={12}>Invalid tree structure</text>
      </svg>
    );
  }

  // Assign positions
  const nodePositions = new Map<number | string, { x: number, y: number }>();
  const ySpacing = Math.min((height - 40) / (levels.length || 1), 60);
  const startY = 20;

  levels.forEach((levelNodes, i) => {
    const y = startY + (i * ySpacing);
    const xSpacing = width / (levelNodes.length + 1);
    
    levelNodes.forEach((id, j) => {
      const x = xSpacing * (j + 1);
      nodePositions.set(id, { x, y });
    });
  });

  const nodeRadius = 14;

  return (
    <svg width={width} height={height} className="mx-auto block" style={{ background: 'transparent' }}>
      {/* Edges */}
      {(edges || []).map((e, idx) => {
        const p1 = nodePositions.get(e.from);
        const p2 = nodePositions.get(e.to);
        if (!p1 || !p2) return null;
        return (
          <line
            key={`e-${idx}`}
            x1={p1.x} y1={p1.y}
            x2={p2.x} y2={p2.y}
            stroke="#8C8C8A"
            strokeWidth="1.5"
          />
        );
      })}

      {/* Nodes */}
      {(nodes || []).map(n => {
        const pos = nodePositions.get(n.id);
        if (!pos) return null;
        return (
          <g key={`n-${n.id}`}>
            <circle
              cx={pos.x} cy={pos.y} r={nodeRadius}
              fill="#262626"
              stroke="#EBEBEA"
              strokeWidth="1.5"
            />
            <text
              x={pos.x} y={pos.y}
              dy="4"
              textAnchor="middle"
              fill="#EBEBEA"
              fontSize={12}
              fontWeight="bold"
            >
              {n.label ?? n.value ?? n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
