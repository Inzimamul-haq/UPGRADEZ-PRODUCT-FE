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

  function buildTreeLayout(nodes: any[], edges: any[], width: number, height: number) {
    if (!nodes || nodes.length === 0) return null;

    const childrenOf = new Map<number | string, (number | string)[]>();
    const hasParent = new Set<number | string>();
    const knownIds = new Set(nodes.map(n => n.id));

    // Group edges by from
    for (const e of edges || []) {
      if (!knownIds.has(e.from) || !knownIds.has(e.to)) continue;
      if (!childrenOf.has(e.from)) childrenOf.set(e.from, []);
      childrenOf.get(e.from)!.push(e.to);
      hasParent.add(e.to);
    }

    const roots = nodes.filter(n => !hasParent.has(n.id)).map(n => n.id);
    if (roots.length === 0) return null;

    // 1. Calculate depths
    const depths = new Map<number | string, number>();
    let maxDepth = 0;
    
    function computeDepth(id: number | string, d: number, visited = new Set<number | string>()) {
      if (visited.has(id)) return;
      visited.add(id);
      depths.set(id, Math.max(d, depths.get(id) || 0));
      maxDepth = Math.max(maxDepth, d);
      for (const child of childrenOf.get(id) || []) {
        computeDepth(child, d + 1, visited);
      }
      visited.delete(id);
    }
    for (const r of roots) computeDepth(r, 0);

    const levelsCount = maxDepth + 1;
    const startY = 30;
    const endY = height - 30;
    const ySpacing = levelsCount > 1 ? Math.min((endY - startY) / (levelsCount - 1), 60) : 0;

    // Check max degree to see if it's a binary tree
    let maxDegree = 0;
    for (const children of childrenOf.values()) {
      maxDegree = Math.max(maxDegree, children.length);
    }
    const isBinaryTree = maxDegree <= 2;

    // GENERIC TREE LAYOUT (Post-order DFS centering)
    const xSlots = new Map<number | string, number>();
    let nextLeafSlot = 0;

    function assignSlots(id: number | string, visited = new Set<number | string>()): number {
      if (visited.has(id)) return xSlots.get(id) || 0;
      visited.add(id);

      const children = childrenOf.get(id) || [];
      if (children.length === 0) {
        xSlots.set(id, nextLeafSlot);
        nextLeafSlot++;
        visited.delete(id);
        return xSlots.get(id)!;
      }

      let minX = Infinity;
      let maxX = -Infinity;

      if (isBinaryTree && children.length === 1) {
        // If it's a binary tree and has 1 child, assume it's a left child.
        // Add a 'phantom' right slot so the parent shifts to the right, slanting the edge.
        const cx = assignSlots(children[0], visited);
        minX = cx;
        maxX = nextLeafSlot;
        nextLeafSlot++; // consume phantom slot
      } else {
        for (const child of children) {
          const cx = assignSlots(child, visited);
          minX = Math.min(minX, cx);
          maxX = Math.max(maxX, cx);
        }
      }

      const myX = (minX + maxX) / 2;
      xSlots.set(id, myX);
      visited.delete(id);
      return myX;
    }

    for (const r of roots) {
      assignSlots(r);
      nextLeafSlot++; // gap between multiple roots
    }

    let minSlot = Infinity;
    let maxSlot = -Infinity;
    xSlots.forEach(slot => {
      minSlot = Math.min(minSlot, slot);
      maxSlot = Math.max(maxSlot, slot);
    });

    const positions = new Map<number | string, {x: number, y: number}>();
    const margin = 24;
    const drawableWidth = width - margin * 2;
    const slotRange = maxSlot - minSlot || 1;

    for (const [id, slot] of xSlots.entries()) {
      const depth = depths.get(id) || 0;
      let cx = margin;
      if (maxSlot > minSlot) {
        cx = margin + ((slot - minSlot) / slotRange) * drawableWidth;
      } else {
        cx = width / 2;
      }
      const cy = startY + depth * ySpacing;
      positions.set(id, { x: cx, y: cy });
    }

    return positions;
  }

  const nodePositions = buildTreeLayout(nodes, edges, width, height);

  if (!nodePositions) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="mx-auto block" style={{ display: 'block', maxWidth: '100%',  background: 'transparent' }}>
        <text x={width/2} y={height/2} textAnchor="middle" fill="#888" fontSize={12}>Invalid tree structure</text>
      </svg>
    );
  }

  const nodeRadius = 14;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="mx-auto block" style={{ display: 'block', maxWidth: '100%',  background: 'transparent' }}>
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
