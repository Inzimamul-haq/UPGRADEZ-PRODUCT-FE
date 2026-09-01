"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertCircle, FileDown, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

interface IQQuestion {
  id: string;
  number: number;
  text: string;
  marks: number | null;
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
  
  // Mapping from question ID to selected (boolean)
  const [selections, setSelections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`/api/generate/iq-questions/${paperId}`);
        if (mounted && data.success) {
          setQuestions(data.questions);
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

  // Compute stats overall
  const stats = useMemo(() => {
    let count = 0;
    let marks = 0;
    
    Object.entries(selections).forEach(([qId, isSelected]) => {
      if (isSelected) {
        count += 1;
        const q = questions.find(x => x.id === qId);
        if (q && q.marks) {
          marks += q.marks;
        }
      }
    });
    
    return { count, marks };
  }, [selections, questions]);

  const handleSelect = (qId: string) => {
    setSelections(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleCompile = () => {
    const selectedQs = questions.filter(q => selections[q.id]);
    
    // Group by marks ascending
    const uniqueMarks = Array.from(new Set(selectedQs.map(q => q.marks).filter(m => m !== null) as number[])).sort((a, b) => a - b);
    
    let markdown = '';
    let globalCounter = 1;
    const partLabels = ['A', 'B', 'C', 'D', 'E'];

    uniqueMarks.forEach((mark, index) => {
      const partQs = selectedQs.filter(q => q.marks === mark);
      const partLabel = partLabels[index] || `Part ${index + 1}`;
      
      markdown += `Part ${partLabel}\n\n`;
      partQs.forEach(q => {
        let text = q.text;
        text = text.replace(/^\s*\d+[\.\)]\s*/, '');
        const marksMatch = /\\(\\d+\\s*marks?\\)/i.test(text);
        if (!marksMatch && q.marks) {
          text += ` (${q.marks} Marks)`;
        }
        markdown += `${globalCounter}. ${text}\n`;
        globalCounter++;
      });
      markdown += '\n';
    });

    const noMarkQs = selectedQs.filter(q => q.marks === null);
    if (noMarkQs.length > 0) {
      markdown += `Unmarked Questions\n\n`;
      noMarkQs.forEach(q => {
        let text = q.text;
        text = text.replace(/^\s*\d+[\.\)]\s*/, '');
        markdown += `${globalCounter}. ${text}\n`;
        globalCounter++;
      });
      markdown += '\n';
    }

    onConfirm(markdown.trim());
  };

  const hasSelections = Object.values(selections).some(v => v);

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
          <button onClick={onCancel} className="px-4 py-2 text-[13px] font-medium text-[#A1A19A] bg-[#242422] rounded-md hover:bg-[#2C2C2A] transition-colors">Cancel</button>
          <button onClick={() => window.location.reload()} className="px-4 py-2 text-[13px] font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 bg-[#161615] flex flex-col items-center justify-center space-y-4">
        <p className="text-[14px] text-[#A1A19A]">No questions available in this Important Questions set.</p>
        <button onClick={onCancel} className="px-4 py-2 text-[13px] font-medium text-[#ECECEA] bg-[#242422] rounded-md hover:bg-[#2C2C2A] transition-colors">Close</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#161615] text-[#ECECEA]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#2E2E2C] flex items-center justify-between sticky top-0 bg-[#161615] z-10">
        <div>
          <h3 className="text-[15px] font-semibold text-[#ECECEA]">Compile Exam Paper</h3>
          <p className="text-[13px] text-[#A1A19A] mt-1">Select questions from the IQ pool for {subjectName}</p>
        </div>
        
        {/* Stats summary */}
        <div className="flex gap-4 text-[12px] font-medium">
          <div className={`px-3 py-1.5 rounded-md flex items-center gap-2 ${stats.count > 0 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-[#242422] text-[#8C8C8A] border border-transparent'}`}>
            <span>Selected:</span>
            <span className="font-semibold">{stats.count} Qs</span>
            <span className="opacity-50">•</span>
            <span>{stats.marks} M</span>
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
                  selected={selections[q.id]} 
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
                  selected={selections[q.id]} 
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
          className="px-4 py-2 text-[13px] font-medium text-[#A1A19A] hover:text-[#ECECEA] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCompile}
          disabled={!hasSelections}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all shadow-sm
            ${hasSelections 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20' 
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

function QuestionRow({ question, selected, onSelect }: { question: IQQuestion, selected: boolean, onSelect: () => void }) {
  // Strip leading numbers for cleaner display
  const displayText = question.text.replace(/^\s*\d+[\.\)]\s*/, '');

  return (
    <div 
      onClick={onSelect}
      className={`flex items-start gap-4 p-3 rounded-lg border transition-colors cursor-pointer select-none ${selected ? 'bg-[#242422]/50 border-blue-500/30' : 'bg-transparent border-[#2E2E2C] hover:bg-[#1E1E1C]'}`}
    >
      <div className="flex items-center justify-center shrink-0 w-5 h-5 rounded border mt-0.5 transition-colors">
        {selected ? (
          <div className="w-5 h-5 bg-blue-500 rounded border border-blue-500 flex items-center justify-center">
            <CheckCircle2 size={14} className="text-white" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded border border-[#6C6C6A] group-hover:border-[#A1A19A]" />
        )}
      </div>
      <div className="flex-1 text-[13.5px] leading-relaxed text-[#D1D1C7]">
        {displayText}
      </div>
    </div>
  );
}
