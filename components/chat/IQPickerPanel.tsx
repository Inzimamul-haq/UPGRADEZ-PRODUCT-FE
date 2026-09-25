"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertCircle, FileDown, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { DiagramRenderer } from '../ui/QuestionDiagram/DiagramRenderer';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { extractDiagramTag } from '../ui/layoutUtils';

interface IQQuestion {
  id: string;
  number: number;
  text: string;
  marks: number | null;
  metadata?: Record<string, string>;
  diagramSpec?: any;
}

interface IQPickerPanelProps {
  paperId: string;
  examType: string;
  subjectName: string;
  onConfirm: (markdown: string) => void;
  onCancel: () => void;
}



export function IQPickerPanel({ paperId, examType, subjectName, onConfirm, onCancel }: IQPickerPanelProps) {
  const [questions, setQuestions] = useState<IQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Array of question IDs in the order they were selected
  const [selections, setSelections] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`/api/generate/iq-questions/${paperId}`);
        if (mounted && data.success) {
          const processedQuestions = data.questions.map((q: any) => {
            let text = q.text || '';
            let metadata: Record<string, string> = {};
            let diagramSpec = undefined;

            // 1. Extract diagram spec if present (either ```diagram...``` or [[diagram:{...}]])
            const diagMatch = extractDiagramTag(text, 0);
            if (diagMatch) {
              try {
                diagramSpec = JSON.parse(diagMatch.json);
                text = text.replace(diagMatch.tagMatch, '');
                // Also normalize 'diagram' to specific type if provided
                if (diagMatch.type.toLowerCase() !== 'diagram' && !diagramSpec.type) {
                  diagramSpec.type = diagMatch.type.toLowerCase();
                }
              } catch (e) {
                console.error("Failed to parse diagram JSON", e);
              }
            } else {
              // Legacy fallback for ```diagram...``` blocks
              const blockMatch = text.match(/```diagram\n([\s\S]*?)\n```/);
              if (blockMatch) {
                try {
                  diagramSpec = JSON.parse(blockMatch[1]);
                  text = text.replace(blockMatch[0], '');
                } catch (e) {
                  console.error("Failed to parse diagram block", e);
                }
              }
            }

            // 2. Extract [[meta:{...}]] if present
            const metaTagMatch = text.match(/\[\[meta:(\{.*?\})\]\]/i);
            if (metaTagMatch) {
              try {
                metadata = { ...metadata, ...JSON.parse(metaTagMatch[1]) };
              } catch (e) { }
            }

            // 3. Clean up bracket tags
            text = text.replace(/\[\[meta:.*?\]\]/gi, '');
            text = text.replace(/\[\[flagged:.*?\]\]/gi, '');

            // 3. Extract actual marks from text to override DB marks (e.g. (2 Marks))
            let extractedMarks = q.marks;
            const marksRegex = /\s*[\(\[]\s*(\d+)\s*[M|m]arks?\s*[\)\]]/g;
            let matchMarks;
            while ((matchMarks = marksRegex.exec(text)) !== null) {
              extractedMarks = parseInt(matchMarks[1], 10);
            }
            // Strip all marks text from the string
            text = text.replace(/\s*[\(\[]\s*\d+\s*[M|m]arks?\s*[\)\]]/g, '').trim();

            // 5. Extract JSON metadata if present (legacy fallback for bare {CO: "CO1"} without meta wrapper)
            const metaJsonMatch = text.match(/\{[^{}]*(?:CO|PO|RBT|Marks|marks)[^{}]*\}/i);
            if (metaJsonMatch) {
              try {
                const raw = metaJsonMatch[0].replace(/([a-zA-Z0-9_]+):/g, '"$1":').replace(/'/g, '"');
                metadata = { ...metadata, ...JSON.parse(raw) };
                text = text.replace(metaJsonMatch[0], '');
              } catch (e) { }
            }

            // 5. Extract trailing bare text tokens (CO3, PO2, L4)
            const coMatch = text.match(/\b(CO[1-6])\b/gi);
            if (coMatch) metadata['CO'] = Array.from(new Set(coMatch.map((s: string) => s.toUpperCase()))).join(', ');

            const poMatch = text.match(/\b(PO\d+)\b/gi);
            if (poMatch) metadata['PO'] = Array.from(new Set(poMatch.map((s: string) => s.toUpperCase()))).join(', ');

            const rbtMatch = text.match(/\b(L[1-6])\b/gi);
            if (rbtMatch) metadata['RBT'] = Array.from(new Set(rbtMatch.map((s: string) => s.toUpperCase()))).join(', ');

            // Remove the bare tokens from text to clean it up
            text = text.replace(/\b(CO[1-6]|PO\d+|L[1-6])\b/gi, '');
            // Clean up any lingering bullets or weird punctuation left behind at the end
            text = text.replace(/[•\s\-,]+$/g, '').trim();

            return {
              ...q,
              marks: extractedMarks,
              text,
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
              diagramSpec
            };
          });
          setQuestions(processedQuestions);
        }
      } catch (err: any) {
        if (mounted) {
          console.error("Failed to fetch IQ questions:", err);
          setError(err.response?.data?.message || err.message || "Failed to load questions");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchQuestions();
    return () => { mounted = false; };
  }, [paperId]);

  // Group questions by marks for display
  const groupedQuestions = useMemo(() => {
    const groups: Record<number, IQQuestion[]> = {};
    const noMarks: IQQuestion[] = [];

    questions.forEach(q => {
      if (q.marks !== null) {
        if (!groups[q.marks]) groups[q.marks] = [];
        groups[q.marks].push(q);
      } else {
        noMarks.push(q);
      }
    });

    const sortedMarkKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
    return { groups, sortedMarkKeys, noMarks };
  }, [questions]);

  // Compute stats overall (count only — marks total removed)
  const stats = useMemo(() => {
    return { count: selections.length };
  }, [selections]);

  const handleSelect = (qId: string) => {
    setSelections(prev => {
      if (prev.includes(qId)) {
        return prev.filter(id => id !== qId);
      }
      return [...prev, qId];
    });
  };

  const handleCompile = () => {
    // Preserve selection order!
    const selectedQs = selections.map(id => questions.find(q => q.id === id)!).filter(Boolean);

    // Group by marks ascending
    const uniqueMarks = Array.from(new Set(selectedQs.map(q => q.marks).filter(m => m !== null) as number[])).sort((a, b) => a - b);

    let markdown = '';
    let globalCounter = 1;
    const partLabels = ['A', 'B', 'C', 'D', 'E'];

    uniqueMarks.forEach((mark, index) => {
      const partQs = selectedQs.filter(q => q.marks === mark);
      const partLabel = partLabels[index] || `Part ${index + 1}`;

      markdown += `## Part ${partLabel} — ${mark} Marks\n\n`;

      if (mark >= 11) {
        // Group by 2 for a/b format
        for (let i = 0; i < partQs.length; i++) {
          const q = partQs[i];
          const isA = i % 2 === 0;
          let text = q.text.replace(/^\s*\d+[\.\)]\s*/, '');
          if (q.marks) {
            text += ` (${q.marks} Marks)`;
          }

          if (isA) {
            markdown += `${globalCounter}. a) ${text}\n\n`;
            if (q.diagramSpec) markdown += `[[diagram:${JSON.stringify(q.diagramSpec)}]]\n\n`;
            markdown += `[[meta:${JSON.stringify(q.metadata || {})}]]\n\n`;
            // If there's a next question for part 'b', insert OR
            if (i < partQs.length - 1) {
              markdown += `\n\n**OR**\n\n`;
            }
          } else {
            markdown += `${globalCounter}. b) ${text}\n\n`;
            if (q.diagramSpec) markdown += `[[diagram:${JSON.stringify(q.diagramSpec)}]]\n\n`;
            markdown += `[[meta:${JSON.stringify(q.metadata || {})}]]\n\n`;
          }

          if (!isA || i === partQs.length - 1) {
            globalCounter++;
          }
        }
      } else {
        // Normal sequential
        partQs.forEach(q => {
          let text = q.text.replace(/^\s*\d+[\.\)]\s*/, '');
          if (q.marks) {
            text += ` (${q.marks} Marks)`;
          }
          markdown += `${globalCounter}. ${text}\n\n`;
          if (q.diagramSpec) markdown += `[[diagram:${JSON.stringify(q.diagramSpec)}]]\n\n`;
          markdown += `[[meta:${JSON.stringify(q.metadata || {})}]]\n\n`;
          globalCounter++;
        });
      }
    });

    const noMarkQs = selectedQs.filter(q => q.marks === null);
    if (noMarkQs.length > 0) {
      markdown += `## Unmarked Questions\n\n`;
      noMarkQs.forEach(q => {
        let text = q.text.replace(/^\s*\d+[\.\)]\s*/, '');
        markdown += `${globalCounter}. ${text}\n\n`;
        if (q.diagramSpec) markdown += `[[diagram:${JSON.stringify(q.diagramSpec)}]]\n\n`;
        markdown += `[[meta:${JSON.stringify(q.metadata || {})}]]\n\n`;
        globalCounter++;
      });
    }

    onConfirm(markdown.trim());
  };

  const getDisplayLabel = (qId: string) => {
    const selIndex = selections.indexOf(qId);
    if (selIndex === -1) return null;

    const selectedQs = selections.map(id => questions.find(q => q.id === id)!).filter(Boolean);
    const uniqueMarks = Array.from(new Set(selectedQs.map(q => q.marks).filter(m => m !== null) as number[])).sort((a, b) => a - b);

    let globalCounter = 1;
    let label = '';

    uniqueMarks.forEach((mark) => {
      const partQs = selectedQs.filter(q => q.marks === mark);
      if (mark >= 11) {
        for (let i = 0; i < partQs.length; i++) {
          const isA = i % 2 === 0;
          if (partQs[i].id === qId) {
            label = `${globalCounter}${isA ? 'a' : 'b'}`;
          }
          if (!isA || i === partQs.length - 1) {
            globalCounter++;
          }
        }
      } else {
        partQs.forEach(q => {
          if (q.id === qId) label = `${globalCounter}`;
          globalCounter++;
        });
      }
    });

    const noMarkQs = selectedQs.filter(q => q.marks === null);
    noMarkQs.forEach(q => {
      if (q.id === qId) label = `${globalCounter}`;
      globalCounter++;
    });

    return label;
  };

  const hasSelections = selections.length > 0;

  if (loading) {
    return (
      <div className="p-6 bg-[#161615] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-6 h-6 text-[#A1A19A] animate-spin" />
        <p className="text-[14px] text-[#A1A19A]">Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#161615] flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-8 h-8 text-red-500/80" />
        <p className="text-[14px] text-red-400">{error}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-[13px] font-medium text-[#ECECEA] bg-[#1E1E1C] border border-[#3A3A38] rounded-md hover:bg-[#242422] hover:border-[#4A4A48] transition-colors">Cancel</button>
          <button onClick={() => window.location.reload()} className="px-4 py-2 text-[13px] font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 bg-[#161615] flex flex-col items-center justify-center space-y-4">
        <p className="text-[14px] text-[#A1A19A]">No questions available in this Important Questions set.</p>
        <button onClick={onCancel} className="px-4 py-2 text-[13px] font-medium text-[#ECECEA] bg-[#1E1E1C] border border-[#3A3A38] rounded-md hover:bg-[#242422] hover:border-[#4A4A48] transition-colors">Close</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#161615] text-[#ECECEA]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#2E2E2C] flex items-center justify-between sticky top-0 bg-[#161615] z-10">
        <div>
          <h3 className="text-[12px] sm:text-[15px] font-semibold text-[#ECECEA]">Compile Exam Paper</h3>
          <p className="text-[9px] sm:text-[13px] text-[#A1A19A] mt-1">Select questions from the IQ pool for {subjectName}</p>
        </div>

        {/* Stats summary */}
        <div className="flex gap-4 text-[8px] sm:text-[12px] font-medium">
          <div className={`px-3 py-1.5 rounded-md flex items-center gap-2 ${stats.count > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-[#242422] text-[#8C8C8A] border border-transparent'}`}>
            <span>Selected:</span>
            <span className="font-semibold">{stats.count} Qs</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        {groupedQuestions.sortedMarkKeys.map(markKey => (
          <div key={markKey} className="space-y-4">
            <h4 className="text-[14px] font-semibold text-[#ECECEA] flex items-center gap-2 border-b border-[#2E2E2C] pb-2">
              <span className="bg-[#242422] text-[#A1A19A] px-2 py-0.5 rounded text-[12px] font-mono">{markKey} Marks</span>
              <span className="text-[#8C8C8A] font-normal text-[13px]">{groupedQuestions.groups[markKey].length} questions available</span>
            </h4>

            <div className="space-y-2">
              {groupedQuestions.groups[markKey].map(q => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  displayLabel={getDisplayLabel(q.id)}
                  onSelect={() => handleSelect(q.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {groupedQuestions.noMarks.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[14px] font-semibold text-[#ECECEA] flex items-center gap-2 border-b border-[#2E2E2C] pb-2">
              <span className="bg-[#242422] text-[#A1A19A] px-2 py-0.5 rounded text-[12px]">Unmarked</span>
            </h4>
            <div className="space-y-2">
              {groupedQuestions.noMarks.map(q => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  displayLabel={getDisplayLabel(q.id)}
                  onSelect={() => handleSelect(q.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#2E2E2C] flex items-center justify-between sticky bottom-0 bg-[#161615] z-10">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-[13px] font-medium text-[#ECECEA] bg-[#1E1E1C] border border-[#3A3A38] rounded-md hover:bg-[#242422] hover:border-[#4A4A48] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCompile}
          disabled={!hasSelections}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all shadow-sm
            ${hasSelections
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-900/20'
              : 'bg-[#242422] text-[#6C6C6A] cursor-not-allowed'
            }`}
        >
          <FileDown size={16} />
          Compile Exam Paper
        </button>
      </div>
    </div>
  );
}

function QuestionRow({ question, displayLabel, onSelect }: { question: IQQuestion, displayLabel: string | null, onSelect: () => void }) {
  // Strip leading numbers for cleaner display
  const displayText = question.text.replace(/^\s*\d+[\.\)]\s*/, '');
  const isSelected = displayLabel !== null;

  return (
    <div
      onClick={onSelect}
      className={`flex items-start gap-4 p-3 rounded-lg border transition-colors cursor-pointer select-none ${isSelected ? 'bg-[#242422]/50 border-green-500/30' : 'bg-transparent border-[#2E2E2C] hover:bg-[#1E1E1C]'}`}
    >
      <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded border transition-colors">
        {isSelected ? (
          <div className="w-6 h-6 bg-green-500 rounded border border-green-500 flex items-center justify-center">
            <span className="text-[11px] font-bold text-white uppercase">{displayLabel}</span>
          </div>
        ) : (
          <div className="w-6 h-6 rounded border border-[#6C6C6A] group-hover:border-[#A1A19A]" />
        )}
      </div>
      <div className="flex-1 text-[13.5px] leading-relaxed text-[#D1D1C7] min-w-0">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
            {displayText}
          </ReactMarkdown>
        </div>

        {/* Render Metadata Badges */}
        {question.metadata && Object.keys(question.metadata).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(question.metadata).map(([key, value]) => (
              <span key={key} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#3A3A38] text-[#A1A19A] border border-[#4A4A48]">
                {key}: {value}
              </span>
            ))}
          </div>
        )}

        {/* Render Diagram */}
        {question.diagramSpec && (
          <div className="mt-3 p-2 bg-black/20 rounded-md border border-[#2E2E2C] flex justify-center">
            <DiagramRenderer
              type={question.diagramSpec.type || question.diagramSpec.diagramType || 'unknown'}
              spec={question.diagramSpec}
              width={300}
              height={200}
            />
          </div>
        )}
      </div>
    </div>
  );
}