import { GraphDefinition } from '@/components/ui/GraphDisplay';

export function isTree(graph: GraphDefinition): boolean {
  if (graph.nodes.length === 0) return true;
  
  // A tree must have exactly n-1 edges (for undirected graph)
  // Or in a directed tree (arborescence), n-1 edges and exactly one root with in-degree 0.
  // For our purposes, let's build an adjacency list and check for cycles and connectedness.
  
  const adj = new Map<string, Set<string>>();
  graph.nodes.forEach(n => adj.set(n, new Set()));
  
  let edgeCount = 0;
  
  for (const edge of graph.edges) {
    if (graph.directed) {
      adj.get(edge.from)?.add(edge.to);
      edgeCount++;
    } else {
      // undirected
      // Prevent duplicate counting if the backend sends both A->B and B->A, 
      // but schema rules say "do not duplicate edges".
      if (!adj.get(edge.from)?.has(edge.to)) {
        adj.get(edge.from)?.add(edge.to);
        adj.get(edge.to)?.add(edge.from);
        edgeCount++;
      }
    }
  }
  
  if (!graph.directed && edgeCount !== graph.nodes.length - 1) {
    return false;
  }
  if (graph.directed && edgeCount !== graph.nodes.length - 1) {
    return false;
  }

  // Check connectedness starting from the first node (or find root if directed)
  let startNode = graph.nodes[0];
  if (graph.directed) {
    const inDegree = new Map<string, number>();
    graph.nodes.forEach(n => inDegree.set(n, 0));
    for (const edge of graph.edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }
    const roots = Array.from(inDegree.entries()).filter(([_, deg]) => deg === 0);
    if (roots.length !== 1) return false; // Must have exactly one root
    startNode = roots[0][0];
  }

  const visited = new Set<string>();
  const queue = [startNode];
  visited.add(startNode);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adj.get(curr) || new Set();
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    }
  }

  return visited.size === graph.nodes.length;
}

export function generateTreeLayout(graph: GraphDefinition, width: number, height: number): Record<string, { x: number; y: number }> {
  // Simple hierarchical layout for trees
  // Find root
  let startNode = graph.nodes[0];
  const adj = new Map<string, string[]>();
  graph.nodes.forEach(n => adj.set(n, []));
  
  if (graph.directed) {
    const inDegree = new Map<string, number>();
    graph.nodes.forEach(n => inDegree.set(n, 0));
    for (const edge of graph.edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
      adj.get(edge.from)?.push(edge.to);
    }
    const roots = Array.from(inDegree.entries()).filter(([_, deg]) => deg === 0);
    if (roots.length > 0) startNode = roots[0][0];
  } else {
    // undirected tree, build a directed tree from startNode
    const undirectedAdj = new Map<string, string[]>();
    graph.nodes.forEach(n => undirectedAdj.set(n, []));
    for (const edge of graph.edges) {
      undirectedAdj.get(edge.from)?.push(edge.to);
      undirectedAdj.get(edge.to)?.push(edge.from);
    }
    
    // BFS to direct edges
    const visited = new Set<string>();
    const queue = [startNode];
    visited.add(startNode);
    
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const n of (undirectedAdj.get(curr) || [])) {
        if (!visited.has(n)) {
          visited.add(n);
          adj.get(curr)?.push(n);
          queue.push(n);
        }
      }
    }
  }
  
  // Assign levels and calculate positions
  const levels = new Map<string, number>();
  const nodesByLevel = new Map<number, string[]>();
  
  const dfs = (node: string, depth: number) => {
    levels.set(node, depth);
    if (!nodesByLevel.has(depth)) nodesByLevel.set(depth, []);
    nodesByLevel.get(depth)?.push(node);
    for (const child of (adj.get(node) || [])) {
      dfs(child, depth + 1);
    }
  };
  
  dfs(startNode, 0);
  
  const maxDepth = Math.max(...Array.from(levels.values()));
  const positions: Record<string, { x: number; y: number }> = {};
  
  const yStep = (height - 60) / (maxDepth === 0 ? 1 : maxDepth);
  
  nodesByLevel.forEach((nodesInLevel, depth) => {
    const xStep = width / (nodesInLevel.length + 1);
    nodesInLevel.forEach((node, i) => {
      positions[node] = {
        x: xStep * (i + 1),
        y: 30 + depth * yStep
      };
    });
  });
  
  return positions;
}
