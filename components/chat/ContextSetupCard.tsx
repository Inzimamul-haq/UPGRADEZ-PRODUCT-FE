"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  BookOpen,
  ChevronRight,
  Minus,
  Plus,
  Sparkles,
  Layers,
  LayoutGrid,
  Zap,
  List,
  ChevronDown,
  X,
  Loader2
} from "lucide-react";
import api from '@/lib/api';
import { QuestionPaperPatternType } from '@/lib/patternSchema';
import {
  TocEntry,
  PaperKind,
  DifficultyMode,
  ContextSetupConfig,
  QuestionDistribution,
} from "@/lib/types";



const DIFFICULTY_LABELS: Record<DifficultyMode, string> = {
  SIMPLE: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

interface CountStepperProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function CountStepper({ value, onChange, disabled }: CountStepperProps) {
  return (
    <div
      className={`flex items-center gap-0 rounded-lg overflow-hidden border border-[#3A3A38] ${disabled ? "opacity-40" : ""
        }`}
    >
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        className="w-7 h-7 flex items-center justify-center text-[#ECECEA] bg-[#2C2C2A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Decrease count"
      >
        <Minus size={11} />
      </button>
      <span className="w-8 text-center text-[13px] font-semibold text-[#ECECEA]  bg-[#2C2C2A] py-1 select-none">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(30, value + 1))}
        disabled={disabled}
        className="w-7 h-7 flex items-center justify-center text-[#ECECEA] bg-[#2C2C2A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Increase count"
      >
        <Plus size={11} />
      </button>
    </div>
  );
}



// ─── Main component ───────────────────────────────────────────────────────────

export interface ContextSetupCardProps {
  examType: string;
  paperKind: PaperKind;
  subjectName: string;
  syllabusEntries: TocEntry[];
  onGenerate: (config: ContextSetupConfig) => void;
  difficulty: DifficultyMode | '';
  onDifficultyChange: (mode: DifficultyMode) => void;
  onClose?: () => void;
  mode?: 'full' | 'topicsOnly';
  onSaveTopics?: (config: { chapters: number[]; topics: Record<number, string[]> }) => void;
  prefillTopicsConfig?: { chapters: number[]; topics: Record<number, string[]> } | null;
  regulation?: string;
}

export function ContextSetupCard({
  examType,
  paperKind,
  subjectName,
  syllabusEntries,
  onGenerate,
  difficulty,
  onDifficultyChange,
  onClose,
  mode = 'full',
  onSaveTopics,
  prefillTopicsConfig,
  regulation,
}: ContextSetupCardProps) {
  const hasChapters = syllabusEntries.length > 0;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [pattern, setPattern] = useState<QuestionPaperPatternType | null>(null);
  const [patternLoading, setPatternLoading] = useState(false);
  const [patternError, setPatternError] = useState(false);
  const [slotConfigs, setSlotConfigs] = useState<{ slotId: string; count: number; marks: number; }[]>([]);

  useEffect(() => {
    if (
      mode !== 'full' ||
      !regulation
    ) {
      setPattern(null);
      setSlotConfigs([]);
      setPatternLoading(false);
      setPatternError(false);
      return;
    }

    setPattern(null);
    setSlotConfigs([]);
    setPatternError(false);
    setPatternLoading(true);

    const abortController = new AbortController();

    api.get('/api/patterns/resolve', {
      params: { regulation, examType },
      signal: abortController.signal,
    })
      .then(res => {
        const resolvedPattern = res.data.pattern;

        if (!resolvedPattern) {
          setPattern(null);
          setSlotConfigs([]);
          setPatternError(true);
          return;
        }

        setPattern(resolvedPattern);

        setSlotConfigs(
          resolvedPattern.parts.flatMap((part: any) =>
            part.slots.map((slot: any) => ({
              slotId: slot.id,
              count: slot.defaultCount ?? 1,
              marks: slot.marks ?? 0,
            }))
          )
        );
      })
      .catch((err) => {
        if (err.name === 'CanceledError') return;
        setPattern(null);
        setSlotConfigs([]);
        setPatternError(true);
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setPatternLoading(false);
        }
      });

    return () => abortController.abort();
  }, [mode, paperKind, regulation, examType]);

  // ── Chapter state ─────────────────────────────────────────────────────────
  const [allChapters, setAllChapters] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());

  // ── Topic state ───────────────────────────────────────────────────────────
  // chapter -> { all: boolean, selected: Set<string>, customText: string, expanded: boolean }
  const [topicStates, setTopicStates] = useState<
    Record<number, { all: boolean; selected: Set<string>; customText: string; expanded?: boolean }>
  >({});

  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefillTopicsConfig && syllabusEntries.length > 0 && !prefilled && mode !== 'topicsOnly') {
      const isAll = prefillTopicsConfig.chapters.length === 0;
      const chToSelect = isAll ? syllabusEntries.map(e => e.chapter) : prefillTopicsConfig.chapters;

      setAllChapters(isAll);
      setSelectedChapters(new Set(chToSelect));

      const newTopicStates: Record<number, { all: boolean; selected: Set<string>; customText: string; expanded?: boolean }> = {};

      Object.entries(prefillTopicsConfig.topics).forEach(([chStr, topics]) => {
        const ch = parseInt(chStr);
        if (topics.includes('all')) {
          const syllabusCh = syllabusEntries.find(e => e.chapter === ch);
          const chTopics = syllabusCh?.topics || [];
          newTopicStates[ch] = { all: true, selected: new Set(chTopics), customText: "", expanded: false };
        } else {
          const syllabusCh = syllabusEntries.find(e => e.chapter === ch);
          const chTopics = syllabusCh?.topics || [];
          const selectedSet = new Set<string>();
          const customList: string[] = [];

          topics.forEach(t => {
            if (chTopics.includes(t)) selectedSet.add(t);
            else customList.push(t);
          });

          newTopicStates[ch] = { all: false, selected: selectedSet, customText: customList.join(', '), expanded: true };
        }
      });

      setTopicStates(newTopicStates);
      setStep(3);
      setPrefilled(true);
    }
  }, [prefillTopicsConfig, syllabusEntries, prefilled, mode]);

  const toggleChapter = (ch: number) => {
    setAllChapters(false);
    setSelectedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) {
        next.delete(ch);
      } else {
        next.add(ch);
      }
      if (next.size === syllabusEntries.length && syllabusEntries.length > 0) {
        setAllChapters(true);
      }
      return next;
    });
  };

  const handleAllChapters = () => {
    setAllChapters(true);
    setSelectedChapters(new Set(syllabusEntries.map((e) => e.chapter)));
  };


  // Initialize topic state for any newly selected chapters
  useEffect(() => {
    if (prefillTopicsConfig && !prefilled) return; // Wait for prefill

    setTopicStates((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const ch of Array.from(selectedChapters)) {
        if (!next[ch]) {
          const entry = syllabusEntries.find(e => e.chapter === ch);
          const chTopics = entry?.topics || [];
          next[ch] = { all: true, selected: new Set(chTopics), customText: "", expanded: false };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selectedChapters, prefillTopicsConfig, prefilled, syllabusEntries]);

  const updateTopicState = (ch: number, patch: Partial<{ all: boolean; selected: Set<string>; customText: string; expanded: boolean }>) => {
    setTopicStates((prev) => ({
      ...prev,
      [ch]: { ...(prev[ch] || { all: true, selected: new Set(), customText: "", expanded: true }), ...patch },
    }));
  };


  // ── Derived labels for summary ────────────────────────────────────────────
  const chapterLabel = useMemo(() => {
    if (!hasChapters) return "All Chapters";
    if (allChapters) return "All Chapters";
    const sorted = Array.from(selectedChapters).sort((a, b) => a - b);
    if (sorted.length === 0) return "No chapters";
    return sorted.map((c) => `Ch ${c}`).join(", ");
  }, [allChapters, selectedChapters, hasChapters]);

  // ── Summary strip ─────────────────────────────────────────────────────────
  const summaryParts: string[] = [];
  summaryParts.push(chapterLabel);

  if (step > 1) {
    const isAllTopics = Array.from(selectedChapters).every(ch => {
      const ts = topicStates[ch];
      const entry = syllabusEntries.find(e => e.chapter === ch);
      const chTopics = entry?.topics || [];
      if (!ts) return true;
      if (chTopics.length === 0) return true;
      return chTopics.every(t => ts.selected.has(t));
    });
    summaryParts.push(isAllTopics ? "All Topics" : "Specific Topics");
  }

  if (mode === 'full' && step > 2) {
    if (pattern) {
      const patternSummary = pattern.parts.flatMap((part: any) =>
        part.slots
          .map((slot: any) => {
            const config = slotConfigs.find(
              sc => sc.slotId === slot.id
            );

            if (!config || config.count <= 0) return null;

            return `${config.count}×${config.marks} (${part.partName.replace('Part ', '')})`;
          })
          .filter(Boolean)
      );

      summaryParts.push(...patternSummary);
    }
  }

  if (mode === 'full' && step > 3 && difficulty) {
    summaryParts.push(DIFFICULTY_LABELS[difficulty]);
  }

  const summaryLine = summaryParts.join(" · ");

  // ── Validation ────────────────────────────────────────────────────────────
  const hasChapterSelection = !hasChapters || allChapters || selectedChapters.size > 0;

  // Topic validation: if a chapter has 'all: false', it must have customText or selected pills
  const hasValidTopics = Array.from(selectedChapters).every(ch => {
    const ts = topicStates[ch];
    if (!ts) return true;
    const entry = syllabusEntries.find(e => e.chapter === ch);
    const chTopics = entry?.topics || [];
    const allTopicsSelected = chTopics.length > 0 ? chTopics.every(t => ts.selected.has(t)) : true;
    
    if (allTopicsSelected) return true;
    return ts.selected.size > 0 || ts.customText.trim().length > 0;
  });

  const canSaveTopics = hasChapterSelection && hasValidTopics;

  const hasAtLeastOnePart = pattern !== null;
  const canGenerate = hasChapterSelection && hasValidTopics && hasAtLeastOnePart && !!difficulty;

  // ── Helpers ───────────────────────────────────────────────────────
  const extractTopicsConfig = () => {
    const chapters =
      !hasChapters || allChapters
        ? []
        : Array.from(selectedChapters).sort((a, b) => a - b);

    const topics: Record<number, string[]> = {};
    const chaptersToProcess = chapters.length === 0 && selectedChapters.size > 0
      ? Array.from(selectedChapters)
      : chapters;

    chaptersToProcess.forEach((c) => {
      const ts = topicStates[c];
      const entry = syllabusEntries.find(e => e.chapter === c);
      const chTopics = entry?.topics || [];
      const allTopicsSelected = ts && chTopics.length > 0 ? chTopics.every(t => ts.selected.has(t)) : (!ts || ts.selected.size === 0 && ts.customText === "");

      if (!ts || allTopicsSelected) {
        topics[c] = ["all"];
      } else {
        const customTopics = ts.customText.split(',').map(t => t.trim()).filter(Boolean);
        topics[c] = [...Array.from(ts.selected), ...customTopics];
      }
    });

    return { chapters, topics };
  };

  // ── Handle generate ───────────────────────────────────────────────────────
  const handleGenerate = () => {
    if (!canGenerate || !difficulty) return;
    const { chapters, topics } = extractTopicsConfig();

    onGenerate({
      chapters,
      topics,
      questionDistribution: undefined,
      slots: pattern ? slotConfigs : undefined,
      difficulty,
    });
  };

  const handleSaveTopics = () => {
    if (!canSaveTopics || !onSaveTopics) return;
    const { chapters, topics } = extractTopicsConfig();
    onSaveTopics({ chapters, topics });
  };

  const kindLabel =
    paperKind === "IMPORTANT_QUESTIONS" ? "Important Questions" : "Exam Paper";

  return (
    <div className="mx-auto w-full max-w-2xl px-3 sm:px-4 py-3">
      <div
        className="
          relative overflow-hidden rounded-2xl
          border border-[#3A3A38]
          bg-[#242422]
          shadow-xl shadow-black/40
        "
      >
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#3A6A3A]/60 to-transparent" />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#2A2A28]">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#2C2C2A] border border-[#3A3A38] flex items-center justify-center">
            <Sparkles size={14} className="text-[#7AC87A]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-[#ECECEA] leading-tight">
              Let&apos;s set the context
            </p>
            <p className="text-[11px] text-[#6C6C6A] mt-0.5 truncate">
              {subjectName} · {kindLabel}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[#6C6C6A] hover:text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="px-5 py-4 flex flex-col gap-5">
          {/* ── Step 1: Chapters ───────────────────────────────────────── */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={12} className="text-[#7A6A5A] flex-shrink-0" />
                <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Step 1: Chapters
                </span>
              </div>

              {!hasChapters ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#2C2C2A] border border-[#3A3A38]">
                  <span className="text-[12px] text-[#6C6C6A]">
                    No syllabus uploaded — all chapters will be used. Click continue.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={handleAllChapters}
                    className={`
                      flex items-center gap-3 px-3 py-1.5 rounded-lg text-[12px] font-medium
                      transition-all duration-150 w-full text-left
                      ${allChapters
                        ? "bg-[#343432] text-[#ECECEA]"
                        : "bg-transparent text-[#8C8C8A] hover:bg-[#2A2A28] hover:text-[#ECECEA]"
                      }
                    `}
                    aria-pressed={allChapters}
                  >
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${allChapters ? 'bg-[#ECECEA] text-black' : 'bg-[#3A3A38] text-[#ECECEA]'}`}>
                      <LayoutGrid size={10} />
                    </span>
                    All Chapters
                  </button>

                  <div className="w-full flex items-center gap-2 my-1">
                    <div className="flex-1 h-px bg-[#2A2A28]" />
                    <span className="text-[10px] text-[#4A4A48] uppercase">Or select specific</span>
                    <div className="flex-1 h-px bg-[#2A2A28]" />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {syllabusEntries.map((entry) => {
                      const isSelected = allChapters || selectedChapters.has(entry.chapter);
                      return (
                        <button
                          key={entry.chapter}
                          onClick={() => toggleChapter(entry.chapter)}
                          className={`
                            flex items-center gap-3 px-3 py-1.5 rounded-lg text-[12px] font-medium
                            transition-all duration-150 text-left w-full
                            ${isSelected
                              ? "bg-[#343432] text-[#ECECEA]"
                              : "bg-transparent text-[#8C8C8A] hover:bg-[#2A2A28] hover:text-[#ECECEA]"
                            }
                          `}
                          aria-pressed={isSelected}
                        >
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-[#ECECEA] text-black' : 'bg-[#3A3A38] text-[#ECECEA]'}`}>
                            {entry.chapter}
                          </span>
                          <span className="leading-snug truncate flex-1">{entry.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Topics ───────────────────────────────────────── */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <List size={12} className="text-[#7A6A5A] flex-shrink-0" />
                <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Step 2: Topics
                </span>
              </div>

              {(!hasChapters || selectedChapters.size === 0) ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#2C2C2A] border border-[#3A3A38]">
                  <span className="text-[12px] text-[#6C6C6A]">
                    All topics will be used. Click continue.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {Array.from(selectedChapters).sort((a, b) => a - b).map(ch => {
                    const entry = syllabusEntries.find(e => e.chapter === ch);
                    if (!entry) return null;
                    const ts = topicStates[ch] || { all: true, selected: new Set(), customText: "" };
                    const hasPills = entry.topics && entry.topics.length > 0;

                    return (
                      <div key={ch} className="bg-[#242422] border border-[#2E2E2C] rounded-xl overflow-hidden">
                        {/* Header for chapter */}
                        <div
                          className="flex items-center justify-between px-3 py-2 bg-[#2C2C2A] border-b border-[#3A3A38] cursor-pointer hover:bg-[#343432] transition-colors"
                          onClick={() => updateTopicState(ch, { expanded: !ts.expanded })}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ChevronDown
                              size={16}
                              className={`text-[#8C8C8A] transition-transform duration-200 ${!ts.expanded ? "-rotate-90" : ""}`}
                            />
                            <span className="text-[12px] font-semibold text-[#ECECEA] truncate">
                              Ch {entry.chapter}: {entry.title}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const hasTopics = entry.topics && entry.topics.length > 0;
                              if (!hasTopics) return;
                              
                              const allSelected = entry.topics.every(t => ts.selected.has(t));
                              if (allSelected) {
                                // Deselect all
                                updateTopicState(ch, { selected: new Set() });
                              } else {
                                // Select all
                                updateTopicState(ch, { selected: new Set(entry.topics) });
                              }
                            }}
                            className={`flex-shrink-0 text-[11px] font-semibold px-2 py-1 rounded transition-colors ml-2 ${(entry.topics && entry.topics.length > 0 && entry.topics.every(t => ts.selected.has(t))) || (!entry.topics || entry.topics.length === 0) ? "bg-[#1A2A1A] text-[#7AC87A]" : "bg-[#1C1C1B] text-[#6C6C6A] hover:text-[#ECECEA]"
                              }`}
                          >
                            All Topics
                          </button>
                        </div>

                        {/* Topic selection body */}
                        {ts.expanded !== false && (
                          <div className="p-3 animate-in fade-in duration-200">
                            {hasPills && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {entry.topics.map(t => {
                                  const selected = ts.selected.has(t);
                                  return (
                                    <button
                                      key={t}
                                      onClick={() => {
                                        const nextSet = new Set(ts.selected);
                                        if (selected) nextSet.delete(t);
                                        else nextSet.add(t);
                                        updateTopicState(ch, { selected: nextSet });
                                      }}
                                      className={`px-2 py-1 rounded-md text-[11px] border transition-colors ${selected ? "bg-[#1A2A1A] border-[#3A6A3A]/60 text-[#7AC87A]" : "bg-[#1C1C1B] border-[#3A3A38] text-[#8C8C8A] hover:border-[#4A4A48] hover:text-[#ECECEA]"
                                        }`}
                                    >
                                      {t}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            <input
                              type="text"
                              value={ts.customText}
                              onChange={(e) => updateTopicState(ch, { customText: e.target.value })}
                              placeholder="Type specific topics, separated by commas..."
                              className="w-full bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-[12px] text-[#ECECEA] placeholder-[#6C6C6A] focus:outline-none focus:border-[#3A6A3A]"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Question Distribution ─────────────────────────── */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={12} className="text-[#7A6A5A] flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                    Step 3: Question Distribution
                  </span>
                </div>
                {prefillTopicsConfig && (
                  <span className="text-[10px] font-medium text-[#7AC87A] bg-[#7AC87A]/10 px-2 py-0.5 rounded-full border border-[#7AC87A]/20">
                    Important topics pre-filled
                  </span>
                )}
              </div>

              {patternLoading ? (
                 <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#8C8C8A]" size={24} /></div>
              ) : pattern ? (
                 <div className="rounded-xl border border-[#2E2E2C] overflow-hidden divide-y divide-[#222220]">
                    {pattern.parts.map((p: any) => (
                       <div key={p.id} className="p-4 bg-[#242422]">
                          <div className="flex items-center justify-between mb-3">
                             <div className="text-[14px] font-semibold text-[#ECECEA]">{p.partName}</div>
                             {p.hasChoice && <div className="text-[11px] text-[#8C8C8A] px-2 py-1 rounded bg-[#2C2C2A] border border-[#3A3A38]">Internal Choice (OR)</div>}
                          </div>
                          <div className="space-y-3">
                            {p.slots.map((s: any, sIdx: number) => {
                               const conf = slotConfigs.find(sc => sc.slotId === s.id);
                               return (
                                  <div key={s.id} className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
                                     <span className="text-[13px] text-[#8C8C8A] font-medium">Question {sIdx + 1} {s.isMcq ? '(MCQ)' : ''}</span>
                                     <div className="flex items-center gap-4 self-end sm:self-auto">
                                        <div className="text-[13px] text-[#ECECEA] flex items-center gap-2 bg-[#2C2C2A] px-2 py-1 rounded-lg border border-[#3A3A38]">
                                           {s.marks} marks
                                        </div>
                                        <CountStepper 
                                          value={conf?.count || 1}
                                          onChange={v => setSlotConfigs(prev => prev.map(sc => sc.slotId === s.id ? {...sc, count: v} : sc))}
                                        />
                                     </div>
                                  </div>
                               )
                            })}
                          </div>
                       </div>
                    ))}
                    <div className="p-4 bg-[#1C1C1B] flex justify-between items-center border-t border-[#3A3A38]">
                      <span className="text-[13px] text-[#8C8C8A] font-semibold uppercase tracking-wider">Total Marks</span>
                      <span className="text-[16px] font-bold text-[#ECECEA]">
                         {slotConfigs.reduce((total, sc) => total + (sc.count * sc.marks), 0)}
                      </span>
                    </div>
                 </div>
              ) : patternError ? (
                <div className="flex flex-col items-center justify-center p-8 bg-[#2A2020] border border-rose-900/50 rounded-xl">
                  <p className="text-rose-400 text-[13px] font-medium text-center">No question paper pattern configured for this exam type and regulation.</p>
                  <p className="text-rose-400/70 text-[12px] text-center mt-2">Please configure the pattern in Admin Settings first.</p>
                </div>
              ) : null}
            </div>
          )}

          {/* ── Step 4: Difficulty ─────────────────────────────────────── */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={12} className="text-[#7A6A5A] flex-shrink-0" />
                <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Step 4: Difficulty
                </span>
              </div>

              <div className="flex gap-2">
                {(["SIMPLE", "MEDIUM", "HARD"] as DifficultyMode[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => onDifficultyChange(d)}
                    className={`
                      flex-1 py-4 flex flex-col items-center justify-center gap-1 rounded-xl text-[13px] font-semibold border transition-all duration-150
                      ${difficulty === d
                        ? d === "SIMPLE"
                          ? "bg-[#1A2A1A] border-[#3A6A3A]/60 text-[#7AC87A]"
                          : d === "MEDIUM"
                            ? "bg-[#1A2A1A] border-[#3A6A3A]/60 text-[#7AC87A]"
                            : "bg-[#1A2A1A] border-[#3A6A3A]/60 text-[#7AC87A]"
                        : "bg-[#242422] border-[#3A3A38] text-[#6C6C6A] hover:border-[#4A4A48] hover:text-[#ECECEA]"
                      }
                    `}
                    aria-pressed={difficulty === d}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Summary strip ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#242422] border border-[#2E2E2C] mb-4">
            <p
              className="text-[11px] text-[#6C6C6A] truncate flex-1"
              title={summaryLine}
            >
              {summaryLine}
            </p>
          </div>
        </div>

        {/* ── Action buttons ───────────────────────────────────────────── */}
        <div className="sticky bottom-0 z-10 px-5 py-4 bg-[#222220] border-t border-[#2E2E2C] flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
              className="px-4 py-3 rounded-xl text-[13px] font-semibold bg-[#242422] border border-[#3A3A38] text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors shadow-sm"
            >
              Back
            </button>
          )}

          {step < 4 && !(mode === 'topicsOnly' && step === 2) ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
              disabled={
                (step === 1 && !hasChapterSelection) ||
                (step === 2 && !hasValidTopics) ||
                (step === 3 && !hasAtLeastOnePart)
              }
              className={`
                flex-1 flex items-center justify-center gap-2
                py-3 rounded-xl text-[14px] font-semibold
                border transition-all duration-200
                ${((step === 1 && hasChapterSelection) || (step === 2 && hasValidTopics) || (step === 3 && hasAtLeastOnePart))
                  ? "bg-[#ECECEA] border-[#ECECEA] text-[#1A1710] hover:bg-white shadow-lg shadow-black/20"
                  : "bg-[#242422] border-[#3A3A38] text-[#4A4A48] cursor-not-allowed"
                }
              `}
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : mode === 'topicsOnly' && step === 2 ? (
            <button
              onClick={handleSaveTopics}
              disabled={!canSaveTopics}
              className={`
                flex-1 flex items-center justify-center gap-2
                py-2.5 sm:py-3 rounded-xl text-[13px] font-semibold
                border transition-all duration-200
                ${canSaveTopics
                  ? "bg-[#7AC87A] border-[#7AC87A] text-[#1A1710] hover:bg-[#8CD88C] hover:border-[#8CD88C] hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#7AC87A]/20"
                  : "bg-[#242422] border-[#3A3A38] text-[#4A4A48] cursor-not-allowed"
                }
              `}
            >
              Assign Topics to Students
              <Sparkles size={14} />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              id="context-setup-generate-btn"
              className={`
                flex-1 flex items-center justify-center gap-2
                py-2.5 sm:py-3 rounded-xl text-[13px] font-semibold
                border transition-all duration-200
                ${canGenerate
                  ? "bg-[#7AC87A] border-[#7AC87A] text-[#1A1710] hover:bg-[#8CD88C] hover:border-[#8CD88C] hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#7AC87A]/20"
                  : "bg-[#242422] border-[#3A3A38] text-[#4A4A48] cursor-not-allowed"
                }
              `}
            >
              Compile Exam Paper
              <Sparkles size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PartRow ──────────────────────────────────────────────────────────────────


