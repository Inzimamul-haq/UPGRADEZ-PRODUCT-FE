import React, { useState, useEffect, useRef } from 'react';
import { DiagramRenderer } from '../ui/QuestionDiagram/DiagramRenderer';
import { DiagramImageEditor } from '../ui/QuestionDiagram/DiagramImageEditor';
import { Plus, X, Pencil } from 'lucide-react';
import { extractDiagramTag } from '../ui/layoutUtils';
import api from '@/lib/api';

interface QuestionPaperEditorProps {
  initialContent: string;
  onCancel: () => void;
  onSave: (newContent: string) => Promise<void>;
  isSaving: boolean;
}

interface EditableQuestion {
  id: string;
  qNo: number;
  text: string;
  marks: number;
  meta: { co: string; rbt: string; po?: string };
  diagramSpec?: any;
  diagramType?: string;
  selected?: boolean;
}

const CO_OPTIONS = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6'];
const RBT_OPTIONS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
// const PO_OPTIONS = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12'];
const MARKS_OPTIONS = [2, 13, 14, 15, 16];

export function QuestionPaperEditor({ initialContent, onCancel, onSave, isSaving }: QuestionPaperEditorProps) {
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingDiagramFor, setEditingDiagramFor] = useState<string | null>(null);
  const [newQuestionId, setNewQuestionId] = useState<string | null>(null);
  const questionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Helper to extract all storage paths from initial content
  const parseImageStoragePathsFromContent = (content: string): string[] => {
    const paths: string[] = [];
    const imageTagRegex = /\[\[diagram:\s*(\{.*?["']type["']\s*:\s*["']image["'].*?\})\s*\]\]/gmi;
    let match;
    while ((match = imageTagRegex.exec(content)) !== null) {
      try {
        const spec = JSON.parse(match[1]);
        if (spec.storagePath) paths.push(spec.storagePath);
      } catch (e) {}
    }
    return paths;
  };

  useEffect(() => {
    const parsedQuestions: EditableQuestion[] = [];
    const questionRegex = /^\s*(\d+)\.\s+([\s\S]*?)\[\[meta:(\{.*?\})\]\]/gmi;

    let match;
    while ((match = questionRegex.exec(initialContent)) !== null) {
      const qNo = parseInt(match[1], 10);
      let body = match[2];
      const metaStr = match[3];

      let meta = { co: "", rbt: "", po: "" };
      try {
        const parsedMeta = JSON.parse(metaStr);
        meta = {
          co: parsedMeta.co || parsedMeta.CO || "",
          rbt: parsedMeta.rbt || parsedMeta.RBT || "",
          po: parsedMeta.po || parsedMeta.PO || ""
        };
      } catch (e) { }

      let marks = 0;
      const marksRegex = /\(([\d\.]+)\s*Marks?\)/i;
      const marksMatch = body.match(marksRegex);
      if (marksMatch) {
        marks = parseFloat(marksMatch[1]);
        body = body.replace(marksMatch[0], '');
      }

      let diagramSpec = undefined;
      let diagramType = undefined;
      const diagMatch = extractDiagramTag(body, 0);
      if (diagMatch) {
        diagramType = diagMatch.type.toLowerCase();
        try {
          diagramSpec = JSON.parse(diagMatch.json);
        } catch (e) { }
        body = body.substring(0, diagMatch.startIndex) + body.substring(diagMatch.endIndex);
      }

      const text = body.trim();

      parsedQuestions.push({
        id: Math.random().toString(36).substring(7),
        qNo,
        text,
        marks,
        meta,
        diagramSpec,
        diagramType,
        selected: false,
      });
    }
    setQuestions(parsedQuestions);
  }, [initialContent]);

  useEffect(() => {
    if (!newQuestionId) return;
    const el = questionRefs.current.get(newQuestionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setNewQuestionId(null);
    }
  }, [questions, newQuestionId]);

  const handleUpdate = (id: string, field: keyof EditableQuestion, value: any) => {
    setHasChanges(true);
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleMetaUpdate = (id: string, metaField: 'co' | 'rbt' | 'po', value: string) => {
    setHasChanges(true);
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, meta: { ...q.meta, [metaField]: value } } : q));
  };

  const handleToggleSelection = (id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, selected: !q.selected } : q));
  };

  const renumberQuestions = (qs: EditableQuestion[]) => {
    return qs.map((q, idx) => ({ ...q, qNo: idx + 1 }));
  };

  const handleDelete = (id: string) => {
    setHasChanges(true);
    setQuestions(prev => renumberQuestions(prev.filter(q => q.id !== id)));
  };

  const handleBulkDelete = () => {
    setHasChanges(true);
    setQuestions(prev => renumberQuestions(prev.filter(q => !q.selected)));
  };

  const handleKeepOnlySelected = () => {
    setHasChanges(true);
    setQuestions(prev => renumberQuestions(prev.filter(q => q.selected).map(q => ({ ...q, selected: false }))));
  };

  const handleAddQuestion = (part: 'A' | 'B' | 'C' | 'D' | 'E', marks: number) => {
    const newQuestion: EditableQuestion = {
      id: Math.random().toString(36).substring(7),
      qNo: 0,
      text: '',
      marks,
      meta: { co: 'CO1', rbt: 'L1' },
      selected: false,
    };
    setHasChanges(true);
    setQuestions(prev => {
      let lastIndexInPart = -1;
      if (part === 'A') {
        lastIndexInPart = prev.findLastIndex(q => q.marks === 2);
      } else if (part === 'B') {
        lastIndexInPart = prev.findLastIndex(q => q.marks === 13 || q.marks === 16);
      } else if (part === 'C') {
        lastIndexInPart = prev.findLastIndex(q => q.marks === 14 || q.marks === 15);
      }

      let idxToInsert = prev.length;
      if (lastIndexInPart !== -1) {
        idxToInsert = lastIndexInPart + 1;
      } else {
        if (part === 'C') {
          const lastB = prev.findLastIndex(q => q.marks === 13 || q.marks === 16);
          if (lastB !== -1) idxToInsert = lastB + 1;
          else {
            const lastA = prev.findLastIndex(q => q.marks === 2);
            idxToInsert = lastA !== -1 ? lastA + 1 : 0;
          }
        } else if (part === 'B') {
          const lastA = prev.findLastIndex(q => q.marks === 2);
          idxToInsert = lastA !== -1 ? lastA + 1 : 0;
        } else {
          idxToInsert = 0;
        }
      }

      const newArray = [...prev.slice(0, idxToInsert), newQuestion, ...prev.slice(idxToInsert)];

      setNewQuestionId(newQuestion.id);

      return renumberQuestions(newArray);
    });
  };

  const handleSave = async () => {
    if (hasChanges && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    const serialized = questions.map(q => {
      let block = `${q.qNo}. ${q.text.trim()}`;
      if (q.marks > 0) {
        block += ` (${q.marks} Marks)`;
      }
      if (q.diagramSpec) {
        block += `\n[[${q.diagramType || 'diagram'}:${JSON.stringify(q.diagramSpec)}]]`;
      }
      block += `\n[[meta:${JSON.stringify(q.meta)}]]`;
      return block;
    }).join('\n\n');

    const oldStoragePaths = parseImageStoragePathsFromContent(initialContent);
    const newStoragePaths = questions
      .map(q => q.diagramSpec?.storagePath)
      .filter(Boolean);
    const toDelete = oldStoragePaths.filter(p => !newStoragePaths.includes(p));

    await onSave(serialized);

    // Fire and forget deletions for replaced/removed images
    toDelete.forEach(storagePath => {
      api.delete('/api/diagrams/storage', { data: { storagePath } }).catch(console.error);
    });
  };

  const anySelected = questions.some(q => q.selected);

  if (questions.length === 0) {
    return (
      <div className="p-4 text-center text-[#8C8C8A] text-[13px]">
        No structured questions found to edit.
      </div>
    );
  }

  const partA = questions.filter(q => q.marks === 2);
  const partB = questions.filter(q => q.marks === 13 || q.marks === 16);
  const partC = questions.filter(q => q.marks === 14 || q.marks === 15);
  const otherParts = questions.filter(q => q.marks !== 2 && q.marks !== 13 && q.marks !== 16 && q.marks !== 14 && q.marks !== 15);

  const renderQuestion = (q: EditableQuestion) => (
    <div
      id={`question-${q.id}`}
      key={q.id}
      ref={(el) => {
        if (el) questionRefs.current.set(q.id, el);
        else questionRefs.current.delete(q.id);
      }}
      className={`flex flex-col mt-4 py-6  border-[#2C2C2A] last:border-b-0 transition-colors bg-[#2C2C2A]/40 rounded-lg -mx-4 px-4 ${q.selected ? 'bg-[#1C1C1B]/80 ring-1 ring-amber-500/30' : ''}`}
    >
      <div className="flex flex-col gap-4">

        {/* Top Row: Checkbox, Question Number and Text Area */}
        <div className="flex gap-3 items-start">
          <input
            type="checkbox"
            checked={!!q.selected}
            onChange={() => handleToggleSelection(q.id)}
            className="mt-3 cursor-pointer w-4 h-4 rounded border-[#3A3A38] bg-[#161615] text-amber-500 focus:ring-amber-500/50"
          />
          <span className="text-[#ECECEA] font-medium text-[14.5px] mt-2.5 flex-shrink-0 min-w-[10px]">{q.qNo}.</span>
          <div className="w-full">
            <textarea
              ref={el => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }
              }}
              value={q.text}
              onChange={(e) => handleUpdate(q.id, 'text', e.target.value)}
              disabled={isSaving}
              className="w-full bg-transparent border-b border-[#3A3A38] text-[#ECECEA] text-[14.5px] rounded-none py-3 px-1 min-h-[100px] resize-none overflow-hidden focus:outline-none focus:border-white/50 transition-colors leading-relaxed"
              placeholder="Enter question text here..."
            />
          </div>
        </div>

        {/* Diagram area */}
        {q.diagramSpec ? (
          (() => {
            const diagType = q.diagramSpec.type || q.diagramSpec.format || q.diagramType || 'unknown';
            const diagSubtype = q.diagramSpec.subtype || '';
            return (
              <div className="flex justify-center w-full relative mb-2 group">
                <div className="w-full max-w-[360px] aspect-video relative rounded-lg overflow-hidden border border-[#3A3A38] bg-[#1C1C1B] p-2 flex items-center justify-center diagram-card-wrapper transition-all duration-300">
                  <DiagramRenderer type={diagType} subtype={diagSubtype} spec={q.diagramSpec} width={340} height={180} />
                  
                  {/* Overlay for editing image diagrams */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                    <button
                      onClick={() => setEditingDiagramFor(q.id)}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-3 py-1.5 bg-black/80 text-white rounded-md hover:bg-black transition-colors text-xs font-medium border border-[#3A3A38]"
                    >
                      <Pencil size={14} /> Replace Diagram
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="ml-10 mb-3 mt-1">
            <button
              onClick={() => setEditingDiagramFor(q.id)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#8C8C8A] text-amber-400 border border-dashed border-[#3A3A38] border-amber-500/40 rounded-md transition-colors"
            >
              <Plus size={13} />
              Add Diagram
            </button>
          </div>
        )}

        {/* Bottom Row: Metadata Edit Controls */}
        <div className="flex flex-wrap items-center gap-6 ml-10 mt-1">

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#8C8C8A] uppercase tracking-wider font-semibold">Marks</span>
            <select
              value={q.marks}
              onChange={(e) => handleUpdate(q.id, 'marks', parseInt(e.target.value, 10))}
              disabled={isSaving}
              className="bg-transparent  text-[#ECECEA] text-[13px] px-0 py-1  cursor-pointer"
            >
              <option className="bg-[#1C1C1B]" value={q.marks}>{q.marks} Marks</option>
              {MARKS_OPTIONS.filter(m => m !== q.marks).map(m => (
                <option className="bg-[#1C1C1B]" key={m} value={m}>{m} Marks</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#8C8C8A] uppercase tracking-wider font-semibold">CO</span>
            <select
              value={q.meta.co}
              onChange={(e) => handleMetaUpdate(q.id, 'co', e.target.value)}
              disabled={isSaving}
              className="bg-transparent  text-[#ECECEA] text-[13px] px-0 py-1  cursor-pointer"
            >
              <option className="bg-[#1C1C1B]" value={q.meta.co}>{q.meta.co}</option>
              {CO_OPTIONS.filter(co => co !== q.meta.co).map(co => (
                <option className="bg-[#1C1C1B]" key={co} value={co}>{co}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-[#8C8C8A] uppercase tracking-wider font-semibold">RBT</span>
            <select
              value={q.meta.rbt}
              onChange={(e) => handleMetaUpdate(q.id, 'rbt', e.target.value)}
              disabled={isSaving}
              className="bg-transparent  text-[#ECECEA] text-[13px] px-0 py-1 cursor-pointer"
            >
              <option className="bg-[#1C1C1B]" value={q.meta.rbt}>{q.meta.rbt}</option>
              {RBT_OPTIONS.filter(rbt => rbt !== q.meta.rbt).map(rbt => (
                <option className="bg-[#1C1C1B]" key={rbt} value={rbt}>{rbt}</option>
              ))}
            </select>
          </div>

          <div className="flex-1" />

          {/* <button
            onClick={() => handleDelete(q.id)}
            className="flex items-center gap-1.5 p-2 text-[#8C8C8A] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors mt-3"
            title="Remove question"
          >
            <X size={15} />
            <span className="text-[12px] font-medium hidden sm:inline">Remove</span>
          </button> */}
        </div>

          {/* <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#8C8C8A] uppercase tracking-wider font-semibold">PO</span>
            <select
              value={q.meta.po || ""}
              onChange={(e) => handleMetaUpdate(q.id, 'po', e.target.value)}
              disabled={isSaving}
              className="bg-[#242422] border border-[#3A3A38] text-[#ECECEA] text-[12px] rounded-md px-2 py-1.5 focus:outline-none focus:border-amber-500/50"
            >
              {!q.meta.po && <option value="">Select PO</option>}
              {q.meta.po && <option value={q.meta.po}>{q.meta.po}</option>}
              {PO_OPTIONS.filter(po => po !== q.meta.po).map(po => (
                <option key={po} value={po}>{po}</option>
              ))}
            </select>
          </div> */}
        </div>

    </div>
  );

  return (
    <div className="flex flex-col relative bg-[#1C1C1B]/50 rounded-xl border border-[#3A3A38] w-[90vw] sm:w-[500px] md:w-[700px] lg:w-[850px] max-w-full my-4">

      {/* Editor Body */}
      <div className="flex flex-col px-6 pt-6 pb-2">
        {partA.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#3A3A38]">
              <h3 className="text-[16px] font-semibold text-[#ECECEA] tracking-widest uppercase">Part - A</h3>
              <button onClick={() => handleAddQuestion('A', 2)} className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors text-[11px] font-semibold uppercase tracking-wide">
                <Plus size={14} /> Add Question to Part A
              </button>
            </div>
            <div className="flex flex-col">{partA.map(renderQuestion)}</div>
          </div>
        )}
        {partB.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#3A3A38]">
              <h3 className="text-[16px] font-semibold text-[#ECECEA] tracking-widest uppercase">Part - B</h3>
              <button onClick={() => handleAddQuestion('B', 13)} className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors text-[11px] font-semibold uppercase tracking-wide">
                <Plus size={14} /> Add Question to Part B
              </button>
            </div>
            <div className="flex flex-col">{partB.map(renderQuestion)}</div>
          </div>
        )}
        {partC.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#3A3A38]">
              <h3 className="text-[16px] font-semibold text-[#ECECEA] tracking-widest uppercase">Part - C</h3>
              <button onClick={() => handleAddQuestion('C', 14)} className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors text-[11px] font-semibold uppercase tracking-wide">
                <Plus size={14} /> Add Question to Part C
              </button>
            </div>
            <div className="flex flex-col">{partC.map(renderQuestion)}</div>
          </div>
        )}
        {otherParts.length > 0 && (
          <div className="mb-10">
            <h3 className="text-center text-[16px] font-semibold text-[#ECECEA] mb-4 tracking-widest uppercase">Other Questions</h3>
            <div className="flex flex-col">{otherParts.map(renderQuestion)}</div>
          </div>
        )}
      </div>

      {/* Bulk Action Bar (Only visible if something is selected) */}
      {anySelected && (
        <div className="flex items-center justify-between px-4 py-3 bg-amber-500/10 border-t border-amber-500/20 backdrop-blur-md sticky bottom-[60px] z-30 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)]">
          <span className="text-[12px] text-amber-500 font-medium">
            {questions.filter(q => q.selected).length} question(s) selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleBulkDelete}
              disabled={isSaving}
              className="px-3 py-1.5 text-[11px] font-semibold text-red-400 bg-red-400/10 border border-red-400/20 rounded hover:bg-red-400/20 transition-colors"
            >
              Delete Selected
            </button>
            <button
              onClick={handleKeepOnlySelected}
              disabled={isSaving}
              className="px-3 py-1.5 text-[11px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded hover:bg-amber-500/20 transition-colors"
            >
              Keep Only Selected
            </button>
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#2E2E2C] sticky bottom-0 z-40 bg-[#1C1C1A] backdrop-blur-md">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-5 py-2 text-[12px] font-semibold text-[#8C8C8A] hover:text-[#ECECEA] transition-colors rounded-lg hover:bg-[#333331]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 text-[12px] font-semibold bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg shadow-lg hover:shadow-amber-500/20 hover:from-amber-500 hover:to-amber-400 transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Confirmation Modal Overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-6 w-[350px] shadow-2xl flex flex-col gap-4 mx-4">
            <h4 className="text-[15px] font-semibold text-[#ECECEA]">Save Changes?</h4>
            <p className="text-[13px] text-[#8C8C8A] leading-relaxed">
              You have made modifications to this question paper. Are you sure you want to save and overwrite the original?
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-[12px] font-medium text-[#8C8C8A] hover:text-[#ECECEA] transition-colors rounded-lg hover:bg-[#333331]"
              >
                Go Back
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-[12px] font-semibold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors flex items-center"
              >
                {isSaving ? 'Saving...' : 'Yes, Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diagram Image Editor Modal */}
      {editingDiagramFor && (
        <DiagramImageEditor
          currentSpec={questions.find(q => q.id === editingDiagramFor)?.diagramSpec}
          onCancel={() => setEditingDiagramFor(null)}
          onConfirm={({ url, storagePath }) => {
            handleUpdate(editingDiagramFor, 'diagramSpec', { type: 'image', url, storagePath });
            handleUpdate(editingDiagramFor, 'diagramType', 'diagram');
            setEditingDiagramFor(null);
          }}
        />
      )}

    </div>
  );
}
