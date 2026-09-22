export interface NormalizedNode {
  id: string;
  label?: string;
  sublabel?: string;
  type?: string;
  kind?: string;
  value?: string;
}

export interface NormalizedEdge {
  from: string;
  to: string;
  label?: string;
  weight?: string;
  sign?: string;
}

export interface NormalizedGraph {
  nodes: NormalizedNode[];
  edges: NormalizedEdge[];
}

export function normalizeDiagramSpec(spec: any): NormalizedGraph {
  const nodes: NormalizedNode[] = [];
  const edges: NormalizedEdge[] = [];

  // Schema 1: components/connections (circuit, schematic, block/hardware)
  if (spec?.components && Array.isArray(spec.components)) {
    spec.components.forEach((c: any) => {
      nodes.push({
        id: String(c.id),
        label: c.label !== undefined ? String(c.label) : (c.value !== undefined ? String(c.value) : String(c.id)),
        sublabel: c.type || c.kind || '',
        type: c.type || c.kind,
        kind: c.type || c.kind,
        value: c.value
      });
    });
  } 
  // Schema 2: nodes/edges
  else if (spec?.nodes && Array.isArray(spec.nodes)) {
    spec.nodes.forEach((n: any) => {
      const idStr = String(n.id !== undefined ? n.id : (typeof n === 'string' ? n : ''));
      if (!idStr) return;
      nodes.push({
        id: idStr,
        label: n.label !== undefined ? String(n.label) : (n.value !== undefined ? String(n.value) : idStr),
        sublabel: n.type || n.kind || '',
        type: n.type || n.kind,
        kind: n.type || n.kind,
        value: n.value
      });
    });
  }

  if (spec?.connections && Array.isArray(spec.connections)) {
    spec.connections.forEach((c: any) => {
      if (c.from !== undefined && c.to !== undefined) {
        edges.push({
          from: String(c.from),
          to: String(c.to),
          label: c.label !== undefined ? String(c.label) : undefined,
          weight: c.weight !== undefined ? String(c.weight) : undefined,
          sign: c.sign !== undefined ? String(c.sign) : undefined,
        });
      }
    });
  } else if (spec?.edges && Array.isArray(spec.edges)) {
    spec.edges.forEach((e: any) => {
      if (e.from !== undefined && e.to !== undefined) {
        edges.push({
          from: String(e.from),
          to: String(e.to),
          label: e.label !== undefined ? String(e.label) : undefined,
          weight: e.weight !== undefined ? String(e.weight) : undefined,
          sign: e.sign !== undefined ? String(e.sign) : undefined,
        });
      }
    });
  }

  return { nodes, edges };
}

export function computeLayerLayout(
  nodes: NormalizedNode[],
  edges: NormalizedEdge[],
  width: number,
  height: number,
  direction: 'TB' | 'LR' = 'TB'
): Record<string, { x: number; y: number }> {
  if (nodes.length === 0) return {};

  const childrenOf = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  
  nodes.forEach(n => {
    childrenOf.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  edges.forEach(e => {
    if (childrenOf.has(e.from) && inDegree.has(e.to)) {
      childrenOf.get(e.from)!.push(e.to);
      inDegree.set(e.to, inDegree.get(e.to)! + 1);
    }
  });

  let queue: string[] = [];
  const layerMap = new Map<string, number>();

  inDegree.forEach((deg, id) => {
    if (deg === 0) {
      queue.push(id);
      layerMap.set(id, 0);
    }
  });

  // If there are cycles and no root is found, pick the first node as root to unblock
  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
    layerMap.set(nodes[0].id, 0);
  }

  let maxLayer = 0;
  const visited = new Set<string>();

  while (queue.length > 0) {
    const nextQueue: string[] = [];
    for (const u of queue) {
      if (visited.has(u)) continue;
      visited.add(u);
      const currLayer = layerMap.get(u)!;
      maxLayer = Math.max(maxLayer, currLayer);
      
      for (const v of childrenOf.get(u) || []) {
        layerMap.set(v, Math.max(layerMap.get(v) || 0, currLayer + 1));
        inDegree.set(v, inDegree.get(v)! - 1);
        if (inDegree.get(v)! <= 0 && !visited.has(v)) {
          nextQueue.push(v);
        }
      }
    }
    queue = nextQueue;
  }

  // Handle remaining unvisited nodes (cycles or disconnected components)
  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      layerMap.set(n.id, maxLayer + 1);
    }
  });

  // Group by layer
  const layers: string[][] = [];
  layerMap.forEach((layerIndex, id) => {
    if (!layers[layerIndex]) layers[layerIndex] = [];
    layers[layerIndex].push(id);
  });

  // Remove empty layers
  const denseLayers = layers.filter(l => l && l.length > 0);
  
  const positions: Record<string, { x: number; y: number }> = {};
  
  const paddingX = 40;
  const paddingY = 40;
  
  if (direction === 'TB') {
    const usableHeight = height - paddingY * 2;
    const yStep = denseLayers.length > 1 ? usableHeight / (denseLayers.length - 1) : 0;
    
    denseLayers.forEach((layerNodes, lIdx) => {
      const y = paddingY + lIdx * yStep;
      const usableWidth = width - paddingX * 2;
      const xStep = layerNodes.length > 1 ? usableWidth / (layerNodes.length - 1) : 0;
      
      layerNodes.forEach((id, nIdx) => {
        const x = layerNodes.length === 1 ? width / 2 : paddingX + nIdx * xStep;
        positions[id] = { x, y };
      });
    });
  } else { // LR
    const usableWidth = width - paddingX * 2;
    const xStep = denseLayers.length > 1 ? usableWidth / (denseLayers.length - 1) : 0;
    
    denseLayers.forEach((layerNodes, lIdx) => {
      const x = paddingX + lIdx * xStep;
      const usableHeight = height - paddingY * 2;
      const yStep = layerNodes.length > 1 ? usableHeight / (layerNodes.length - 1) : 0;
      
      layerNodes.forEach((id, nIdx) => {
        const y = layerNodes.length === 1 ? height / 2 : paddingY + nIdx * yStep;
        positions[id] = { x, y };
      });
    });
  }

  return positions;
}

export function generateCircularLayout(nodes: (string | { id: string })[], width: number, height: number): Record<string, { x: number; y: number }> {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 30; // 30px padding
  
  const positions: Record<string, { x: number; y: number }> = {};
  const n = nodes.length;
  
  nodes.forEach((nodeItem, i) => {
    const node = typeof nodeItem === 'string' ? nodeItem : nodeItem.id;
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2; // Start from top
    positions[node] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
  
  return positions;
}

export function buildLevelOrder(nodes: {id:number | string}[], edges: {from:number | string,to:number | string}[]): (number | string)[][] {
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

export function findParallelGroups(edges: NormalizedEdge[]): NormalizedEdge[][] {
  const groups = new Map<string, NormalizedEdge[]>();
  for (const e of edges) {
    const key = [e.from, e.to].sort().join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return [...groups.values()].filter(g => g.length > 1);
}

export function collapseParallelGroups(edges: NormalizedEdge[]) {
  const simplifiedEdges: NormalizedEdge[] = [];
  const parallelMap = new Map<string, NormalizedEdge[]>();
  const seen = new Set<string>();

  for (const e of edges) {
    const key = [e.from, e.to].sort().join('|');
    if (seen.has(key)) continue;

    const group = edges.filter(ed => [ed.from, ed.to].sort().join('|') === key);
    if (group.length > 1) {
      seen.add(key);
      parallelMap.set(key, group);
      simplifiedEdges.push(group[0]); // Pick the first as representative for layout
    } else {
      simplifiedEdges.push(e);
    }
  }

  return { simplifiedEdges, parallelMap };
}

export function classifyAndRouteArcs(
  edges: NormalizedEdge[],
  positions: Record<string, { x: number; y: number }>,
  direction: 'TB' | 'LR' = 'LR'
) {
  const routedEdges = edges.map(e => {
    const fromPos = positions[e.from];
    const toPos = positions[e.to];
    
    if (!fromPos || !toPos) {
      return { ...e, isBackwardLayoutEdge: false, laneOffset: 0 };
    }

    // Determine if edge is backward based on positions
    const isBackwardLayoutEdge = direction === 'LR' ? toPos.x <= fromPos.x : toPos.y <= fromPos.y;
    return { ...e, isBackwardLayoutEdge, laneOffset: 0 };
  });

  // Calculate nested lane offsets for backward edges
  const backwardEdges = routedEdges.filter(e => e.isBackwardLayoutEdge);
  
  // Sort backward edges by span (shortest span first, they get the innermost lane)
  backwardEdges.sort((a, b) => {
    const spanA = direction === 'LR' 
      ? Math.abs(positions[a.from]!.x - positions[a.to]!.x)
      : Math.abs(positions[a.from]!.y - positions[a.to]!.y);
    const spanB = direction === 'LR'
      ? Math.abs(positions[b.from]!.x - positions[b.to]!.x)
      : Math.abs(positions[b.from]!.y - positions[b.to]!.y);
    return spanA - spanB;
  });

  // Assign lanes (simple overlap avoidance: increment lane for each nested span)
  const lanes: { start: number, end: number, lane: number }[] = [];
  
  for (const edge of backwardEdges) {
    const start = direction === 'LR' ? positions[edge.to]!.x : positions[edge.to]!.y; // backward goes right-to-left
    const end = direction === 'LR' ? positions[edge.from]!.x : positions[edge.from]!.y;
    
    let lane = 1;
    // Find first available lane that doesn't overlap
    while (lanes.some(l => l.lane === lane && !(end < l.start || start > l.end))) {
      lane++;
    }
    
    edge.laneOffset = lane;
    lanes.push({ start, end, lane });
  }

  return routedEdges;
}
