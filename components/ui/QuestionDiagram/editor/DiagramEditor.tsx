import React, { useState, useCallback } from 'react';
import { DiagramRenderer } from '../DiagramRenderer';
import { DiagramEditorToolbar } from './DiagramEditorToolbar';
import { DiagramEditorPanel } from './DiagramEditorPanel';
import { editorConfig, DiagramActionDef } from './diagramEditorConfig';

interface DiagramEditorProps {
  type: string;
  subtype?: string;
  initialSpec: any;
  onChange: (newSpec: any) => void;
  width?: number;
  height?: number;
}

export function DiagramEditor({ type, subtype, initialSpec, onChange, width = 400, height = 250 }: DiagramEditorProps) {
  // 1. History stack for undo/redo
  const [history, setHistory] = useState<any[]>([JSON.parse(JSON.stringify(initialSpec))]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const draft = history[historyIndex];

  // 2. Selection state
  const [selection, setSelection] = useState<{ kind: string; id: string | number } | null>(null);

  // 3. Find config for this type/subtype
  const typeConfig = editorConfig[type] || {};
  const config = typeConfig[subtype || 'generic'] || typeConfig['generic'];

  // 4. Handlers
  const pushDraft = useCallback((newDraft: any) => {
    const cloned = JSON.parse(JSON.stringify(newDraft));
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cloned);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onChange(cloned); // tell parent we have unsaved changes in draft
  }, [history, historyIndex, onChange]);

  const handleRunAction = useCallback((action: DiagramActionDef) => {
    const newDraft = JSON.parse(JSON.stringify(draft));
    action.run(newDraft, selection);
    pushDraft(newDraft);
  }, [draft, selection, pushDraft]);

  const handlePanelChange = useCallback((newDraft: any) => {
    // We want panel typing to replace the current history state if it's rapid,
    // but for simplicity, we'll just push a new state.
    // In a real app we might debounce history pushes for text inputs.
    pushDraft(newDraft);
  }, [pushDraft]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onChange(history[historyIndex - 1]);
    }
  }, [historyIndex, history, onChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onChange(history[historyIndex + 1]);
    }
  }, [historyIndex, history, onChange]);

  const handleReset = useCallback(() => {
    setHistory([JSON.parse(JSON.stringify(initialSpec))]);
    setHistoryIndex(0);
    setSelection(null);
    onChange(JSON.parse(JSON.stringify(initialSpec)));
  }, [initialSpec, onChange]);

  // Click handler on the rendering canvas wrapper
  // We'll simulate node selection for tree/graph layout testing if we can.
  // Actually, capturing clicks directly on SVG elements in DiagramRenderer is hard 
  // without modifying all renderers. For Phase 1, we can add an overlay or modify the 
  // TreeRenderer to accept an onClick, or we just rely on a simple selection dropdown 
  // for testing until we wire up SVG click handlers.
  // Let's add a quick hack: A dropdown to select which node to act on, 
  // because clicking SVG nodes requires passing onClick down into all Displays.

  return (
    <div className="flex flex-col rounded-lg border border-[#3A3A38] bg-[#1C1C1B] overflow-hidden">
      {/* Canvas Area */}
      <div className="flex relative">
        <div className="flex-1 bg-[#1A1A19] flex justify-center items-center relative overflow-hidden" style={{ minHeight: height }}>
          <DiagramRenderer type={type} subtype={subtype} spec={draft} width={width} height={height} />
          
          {/* Temporary Selection UI for Phase 1 testing since we haven't wired SVG clicks */}
          <div className="absolute top-2 left-2 flex items-center gap-2 bg-[#222221] p-1.5 rounded border border-[#3A3A38] shadow-md z-10">
            <span className="text-[10px] text-[#8C8C8A] uppercase font-semibold">Select:</span>
            <select 
              className="bg-[#161615] text-[#ECECEA] text-xs border border-[#4C4C4A] rounded px-1 py-0.5 outline-none"
              value={selection ? selection.id : ''}
              onChange={(e) => setSelection(e.target.value ? { kind: 'node', id: e.target.value } : null)}
            >
              <option value="">None</option>
              {(draft.nodes || []).map((n: any) => (
                <option key={n.id} value={n.id}>{n.label || n.id}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Properties Panel */}
        <div className="w-64 border-l border-[#3A3A38] bg-[#222221] shrink-0">
          <DiagramEditorPanel 
            config={config} 
            draft={draft} 
            selection={selection} 
            onChange={handlePanelChange} 
          />
        </div>
      </div>

      {/* Toolbar */}
      <DiagramEditorToolbar 
        config={config?.toolbar} 
        draft={draft} 
        selection={selection} 
        onRunAction={handleRunAction} 
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleReset}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
    </div>
  );
}
