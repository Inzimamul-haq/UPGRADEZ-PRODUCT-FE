import React from 'react';
import { DiagramActionDef } from './diagramEditorConfig';

interface DiagramEditorToolbarProps {
  config?: DiagramActionDef[];
  draft: any;
  selection: any;
  onRunAction: (action: DiagramActionDef) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function DiagramEditorToolbar({
  config,
  draft,
  selection,
  onRunAction,
  onUndo,
  onRedo,
  onReset,
  canUndo,
  canRedo
}: DiagramEditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-[#222221] border-t border-[#3A3A38]">
      <div className="flex gap-1 border-r border-[#3A3A38] pr-2 mr-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-2 py-1 text-xs font-medium bg-[#1C1C1B] border border-[#3A3A38] rounded text-[#ECECEA] disabled:opacity-50 hover:bg-[#2E2E2C]"
        >
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-2 py-1 text-xs font-medium bg-[#1C1C1B] border border-[#3A3A38] rounded text-[#ECECEA] disabled:opacity-50 hover:bg-[#2E2E2C]"
        >
          Redo
        </button>
        <button
          onClick={onReset}
          className="px-2 py-1 text-xs font-medium bg-[#1C1C1B] border border-[#3A3A38] rounded text-[#ECECEA] hover:bg-red-900/50 hover:text-red-200"
        >
          Reset
        </button>
      </div>
      
      {config && config.map((action, idx) => {
        if (!action.show(draft, selection)) return null;
        return (
          <button
            key={idx}
            onClick={() => onRunAction(action)}
            className="px-2 py-1 text-xs font-medium bg-[#2C2C2A] border border-[#4C4C4A] rounded text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors"
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
