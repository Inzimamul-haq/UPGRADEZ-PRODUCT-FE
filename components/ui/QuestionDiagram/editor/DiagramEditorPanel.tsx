import React from 'react';
import { DiagramEditorConfig } from './diagramEditorConfig';

interface DiagramEditorPanelProps {
  config?: DiagramEditorConfig;
  draft: any;
  selection: { kind: string; id: string | number } | null;
  onChange: (draft: any) => void;
}

export function DiagramEditorPanel({ config, draft, selection, onChange }: DiagramEditorPanelProps) {
  if (!selection) {
    return (
      <div className="p-4 text-center text-xs text-[#6C6C6A] italic">
        Select an item to edit its properties
      </div>
    );
  }

  const { kind, id } = selection;
  const fields = config?.panel?.[kind] || [];

  if (fields.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-[#6C6C6A] italic">
        No editable properties for this {kind}
      </div>
    );
  }

  // Find the actual item in the draft
  let itemsArray: any[] = [];
  if (kind === 'node') itemsArray = draft.nodes || [];
  else if (kind === 'edge') itemsArray = draft.edges || [];
  else if (kind === 'component') itemsArray = draft.components || [];
  else if (kind === 'connection') itemsArray = draft.connections || [];
  // (more arrays can be added as needed, e.g. rows/columns, supports/loads)

  const itemIndex = itemsArray.findIndex((i: any) => String(i.id || (i.from + '-' + i.to)) === String(id));
  if (itemIndex === -1) return null;
  
  const item = itemsArray[itemIndex];

  const handleFieldChange = (field: string, value: string | number) => {
    // We mutate the item directly and trigger onChange with a clone
    item[field] = value;
    onChange({ ...draft });
  };

  return (
    <div className="p-3 flex flex-col gap-3">
      <div className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider pb-1 border-b border-[#3A3A38]">
        {kind} Properties
      </div>
      {fields.map((field) => (
        <div key={field} className="flex flex-col gap-1">
          <label className="text-xs text-[#A1A1AA] capitalize">{field}</label>
          <input
            type="text"
            value={item[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full bg-[#161615] border border-[#3A3A38] text-[#ECECEA] text-xs rounded px-2 py-1.5 focus:outline-none focus:border-amber-500/50"
            placeholder={`Enter ${field}`}
          />
        </div>
      ))}
    </div>
  );
}
