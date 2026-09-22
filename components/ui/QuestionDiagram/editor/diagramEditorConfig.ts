import { addLeftChild, addRightChild, deleteTreeSubtree, addNode, deleteNode, deleteEdge } from './diagramActions';

export interface DiagramActionDef {
  label: string;
  show: (draft: any, selection: any) => boolean;
  run: (draft: any, selection: any) => void;
}

export interface DiagramEditorConfig {
  toolbar: DiagramActionDef[];
  panel: {
    node?: string[];
    edge?: string[];
    [key: string]: string[] | undefined;
  };
}

const rootId = (draft: any) => {
  if (!draft.nodes || draft.nodes.length === 0) return null;
  const hasParent = new Set(draft.edges?.map((e: any) => e.to));
  const root = draft.nodes.find((n: any) => !hasParent.has(n.id));
  return root ? root.id : draft.nodes[0].id;
};

const hasLeft = (draft: any, parentId: string | number) => {
  return draft.edges?.some((e: any) => String(e.from) === String(parentId));
};

const hasRight = (draft: any, parentId: string | number) => {
  const children = draft.edges?.filter((e: any) => String(e.from) === String(parentId));
  return children && children.length >= 2;
};

// Generic actions shared across graph-like types
const genericNodeEdgeToolbar: DiagramActionDef[] = [
  {
    label: 'Add Node',
    show: () => true, // always show on canvas
    run: (d) => addNode(d)
  },
  {
    label: 'Delete Node',
    show: (d, sel) => sel?.kind === 'node',
    run: (d, sel) => deleteNode(d, sel.id)
  },
  {
    label: 'Delete Edge',
    show: (d, sel) => sel?.kind === 'edge',
    run: (d, sel) => deleteEdge(d, sel.id)
  }
];

export const editorConfig: Record<string, Record<string, DiagramEditorConfig>> = {
  tree: {
    generic: {
      toolbar: [
        { 
          label: 'Add left child', 
          show: (d, sel) => sel?.kind === 'node' && !hasLeft(d, sel.id), 
          run: (d, sel) => addLeftChild(d, sel.id) 
        },
        { 
          label: 'Add right child', 
          show: (d, sel) => sel?.kind === 'node' && !hasRight(d, sel.id), 
          run: (d, sel) => addRightChild(d, sel.id) 
        },
        { 
          label: 'Delete subtree', 
          show: (d, sel) => sel?.kind === 'node' && String(sel.id) !== String(rootId(d)), 
          run: (d, sel) => deleteTreeSubtree(d, sel.id) 
        },
      ],
      panel: { node: ['label'] }
    }
  },
  graph: {
    generic: {
      toolbar: genericNodeEdgeToolbar,
      panel: { node: ['label', 'value'], edge: ['weight', 'label'] }
    }
  },
  flowchart: {
    generic: {
      toolbar: genericNodeEdgeToolbar,
      panel: { node: ['label', 'kind'], edge: ['label'] }
    }
  },
  network: {
    generic: {
      toolbar: genericNodeEdgeToolbar,
      panel: { node: ['label', 'type'], edge: ['label', 'weight'] }
    }
  },
  architecture: {
    generic: {
      toolbar: genericNodeEdgeToolbar,
      panel: { node: ['label', 'sublabel'], edge: ['label'] }
    }
  },
  linked_list: {
    generic: {
      toolbar: genericNodeEdgeToolbar,
      panel: { node: ['label', 'value'], edge: ['label'] }
    }
  },
  doubly_linked_list: {
    generic: {
      toolbar: genericNodeEdgeToolbar,
      panel: { node: ['label', 'value'], edge: ['label'] }
    }
  },
  stack: {
    generic: {
      toolbar: genericNodeEdgeToolbar,
      panel: { node: ['label', 'value'] }
    }
  },
  queue: {
    generic: {
      toolbar: genericNodeEdgeToolbar,
      panel: { node: ['label', 'value'] }
    }
  }
};

// Aliases for tree subtypes
editorConfig.tree.bst = editorConfig.tree.generic;
editorConfig.tree.avl = editorConfig.tree.generic;
editorConfig.tree.heap = editorConfig.tree.generic;
editorConfig.tree.b_tree = editorConfig.tree.generic;
