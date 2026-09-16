"use client";

import React, { useState } from "react";
import { X, SlidersHorizontal, Check } from "lucide-react";

const PROMPT_TYPE_OPTIONS = [
  { value: "THEORY", label: "Theory" },
  { value: "HYBRID_THEORY_PROBLEM", label: "Hybrid (Theory + Problem)" },
  { value: "PROBLEM_FOCUSED", label: "Problem Focused" },
  { value: "APPLIED_DESIGN", label: "Applied Design" },
  { value: "DIAGRAM_DRIVEN_PROBLEM", label: "Diagram Driven" },
] as const;

const DIAGRAM_TYPE_OPTIONS = [
  { value: "graph", label: "Graph" },
  { value: "tree", label: "Tree" },
  { value: "circuit", label: "Circuit" },
  { value: "structural", label: "Structural" },
  { value: "flowchart", label: "Flowchart" },
  { value: "network", label: "Network" },
  { value: "block", label: "Block" },
  { value: "schematic", label: "Schematic" },
  { value: "table", label: "Table" },
  { value: "geometry", label: "Geometry" },
  { value: "waveform", label: "Waveform" },
  { value: "architecture", label: "Architecture" },
  { value: "mech_structural", label: "Mech Structural" },
  { value: "engineering_drawing", label: "Engineering Drawing" },
] as const;

export type DiagramTypeValue = typeof DIAGRAM_TYPE_OPTIONS[number]["value"];
export type PromptTypeValue = typeof PROMPT_TYPE_OPTIONS[number]["value"];

interface SubjectConfigModalProps {
  open: boolean;
  subjectName: string;
  initialPromptType: string;
  initialDiagramTypes: string[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (promptType: string, diagramTypes: string[]) => Promise<void>;
}

export function SubjectConfigModal({
  open,
  subjectName,
  initialPromptType,
  initialDiagramTypes,
  isSaving,
  onClose,
  onSave,
}: SubjectConfigModalProps) {
  const [promptType, setPromptType] = useState(
    initialPromptType || "TECHNICAL_THEORY"
  );
  const [diagramTypes, setDiagramTypes] = useState<string[]>(
    initialDiagramTypes || []
  );

  // Reset state whenever modal opens with new subject values
  React.useEffect(() => {
    if (open) {
      setPromptType(initialPromptType || "TECHNICAL_THEORY");
      setDiagramTypes(initialDiagramTypes || []);
    }
  }, [open, initialPromptType, initialDiagramTypes]);

  const toggleDiagram = (val: string) => {
    setDiagramTypes((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val]
    );
  };

  const handleSave = async () => {
    await onSave(promptType, diagramTypes);
  };

  if (!open) return null;

  const selectedPromptLabel =
    PROMPT_TYPE_OPTIONS.find((o) => o.value === promptType)?.label ?? promptType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-[#3A3A38] bg-[#1F1F1E] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#3A3A38] px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <SlidersHorizontal size={14} className="text-[#8C8C8A] flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#ECECEA] truncate">AI Config</p>
              <p className="text-[11px] text-[#5A5A58] truncate">{subjectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="ml-3 flex-shrink-0 text-[#5A5A58] hover:text-[#ECECEA] transition-colors disabled:opacity-40"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-5">
          {/* Prompt Type */}
          <div>
            <label className="mb-1.5 block text-[11px] text-[#8C8C8A] font-medium tracking-wide uppercase">
              Subject Type
            </label>
            <select
              value={promptType}
              onChange={(e) => setPromptType(e.target.value)}
              disabled={isSaving}
              className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none transition-colors disabled:opacity-50 appearance-none cursor-pointer"
            >
              {PROMPT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-[#5A5A58]">
              Controls how AI structures question types and difficulty distribution.
            </p>
          </div>

          {/* Diagram Types */}
          <div>
            <label className="mb-1.5 block text-[11px] text-[#8C8C8A] font-medium tracking-wide uppercase">
              Allowed Diagram Types
              {diagramTypes.length > 0 && (
                <span className="ml-2 normal-case font-normal text-[#ECECEA]">
                  ({diagramTypes.length} selected)
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DIAGRAM_TYPE_OPTIONS.map((opt) => {
                const isSelected = diagramTypes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isSaving}
                    onClick={() => toggleDiagram(opt.value)}
                    className={`
                      inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-medium
                      transition-all duration-150 disabled:opacity-50 cursor-pointer
                      ${
                        isSelected
                          ? "border-[#4A4A48] bg-[#333331] text-[#ECECEA]"
                          : "border-[#2E2E2C] bg-[#1F1F1E] text-[#5A5A58] hover:border-[#3A3A38] hover:text-[#8C8C8A]"
                      }
                    `}
                  >
                    {isSelected && <Check size={10} strokeWidth={2.5} />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-[#5A5A58]">
              {diagramTypes.length === 0
                ? "No diagrams — AI will never generate diagrams for this subject."
                : `AI can generate: ${diagramTypes.join(", ")}.`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#3A3A38] px-4 py-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-[12px] text-[#5A5A58] hover:text-[#8C8C8A] transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-4 py-1.5 text-[12px] text-[#ECECEA] transition-colors hover:bg-[#333331] disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Config"}
          </button>
        </div>
      </div>
    </div>
  );
}
