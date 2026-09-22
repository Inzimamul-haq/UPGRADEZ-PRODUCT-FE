export function addLeftChild(draft: any, parentId: string | number) {
  if (!draft.nodes) draft.nodes = [];
  if (!draft.edges) draft.edges = [];

  const newId = `node_${Math.random().toString(36).substring(2, 7)}`;
  draft.nodes.push({ id: newId, label: 'New' });

  // TreeDisplay determines left/right by edge order.
  // The first edge from a parent goes left. 
  // We want to insert this edge before any existing edge from this parent.
  const firstChildEdgeIndex = draft.edges.findIndex((e: any) => String(e.from) === String(parentId));
  
  if (firstChildEdgeIndex === -1) {
    // No children yet, just push
    draft.edges.push({ from: parentId, to: newId });
  } else {
    // Insert before the first child edge to make it the left child
    draft.edges.splice(firstChildEdgeIndex, 0, { from: parentId, to: newId });
  }
}

export function addRightChild(draft: any, parentId: string | number) {
  if (!draft.nodes) draft.nodes = [];
  if (!draft.edges) draft.edges = [];

  const newId = `node_${Math.random().toString(36).substring(2, 7)}`;
  draft.nodes.push({ id: newId, label: 'New' });

  // To make it a right child, we want it to be the second edge.
  // Find the last edge from this parent.
  let lastChildEdgeIndex = -1;
  for (let i = draft.edges.length - 1; i >= 0; i--) {
    if (String(draft.edges[i].from) === String(parentId)) {
      lastChildEdgeIndex = i;
      break;
    }
  }

  if (lastChildEdgeIndex === -1) {
    // No children yet. If we just push it, it becomes the first (left) child.
    // To force it to be a right child when there's no left child, we actually can't easily 
    // do it with the current TreeDisplay layout without a phantom node, but typically 
    // users add left then right. Let's just push it.
    draft.edges.push({ from: parentId, to: newId });
  } else {
    // Insert after the last child edge
    draft.edges.splice(lastChildEdgeIndex + 1, 0, { from: parentId, to: newId });
  }
}

export function deleteTreeSubtree(draft: any, nodeId: string | number) {
  if (!draft.nodes || !draft.edges) return;
  
  // Find all descendants
  const toDelete = new Set<string | number>([nodeId]);
  let added = true;
  while (added) {
    added = false;
    for (const e of draft.edges) {
      if (toDelete.has(e.from) && !toDelete.has(e.to)) {
        toDelete.add(e.to);
        added = true;
      }
    }
  }

  // Remove nodes
  draft.nodes = draft.nodes.filter((n: any) => !toDelete.has(n.id));
  
  // Remove edges
  draft.edges = draft.edges.filter((e: any) => !toDelete.has(e.from) && !toDelete.has(e.to));
}
export function addNode(draft: any) {
  if (!draft.nodes) draft.nodes = [];
  const newId = `n_${Math.random().toString(36).substring(2, 7)}`;
  draft.nodes.push({ id: newId, label: 'Node' });
}

export function deleteNode(draft: any, nodeId: string | number) {
  if (draft.nodes) {
    draft.nodes = draft.nodes.filter((n: any) => String(n.id) !== String(nodeId));
  }
  if (draft.edges) {
    draft.edges = draft.edges.filter((e: any) => String(e.from) !== String(nodeId) && String(e.to) !== String(nodeId));
  }
}

export function addEdge(draft: any, fromId: string | number, toId: string | number) {
  if (!draft.edges) draft.edges = [];
  // Avoid duplicates
  const exists = draft.edges.some((e: any) => String(e.from) === String(fromId) && String(e.to) === String(toId));
  if (!exists) {
    draft.edges.push({ from: fromId, to: toId });
  }
}

export function deleteEdge(draft: any, edgeId: string) { // edgeId format: 'from-to'
  if (!draft.edges) return;
  draft.edges = draft.edges.filter((e: any) => `${e.from}-${e.to}` !== edgeId);
}