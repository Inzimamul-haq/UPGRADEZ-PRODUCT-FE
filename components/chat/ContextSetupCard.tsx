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
} from "lucide-react";
import {
  TocEntry,
  PaperKind,
  DifficultyMode,
  ContextSetupConfig,
  QuestionDistribution,
} from "@/lib/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

function supportsPartC(examType: string): boolean {
  const upper = examType.toUpperCase();
  return upper.includes("MODEL") || upper.includes("UNIVERSITY");
}

function getMarksOptions(part: "B" | "C"): number[] {
  if (part === "B") return [13, 16];
  return [14, 15];
}

function buildDefaultDistribution(examType: string): QuestionDistribution {
  return {
    partA: { enabled: true, count: 10, marks: 2 },
    partB: { enabled: true, count: 5, marks: 13 },
    partC: { enabled: supportsPartC(examType), count: 2, marks: 15 },
  };
}

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
      className={`flex items-center gap-0 rounded-lg overflow-hidden border border-[#3A3A38] ${
        disabled ? "opacity-40" : ""
      }`}
    >
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        className="w-7 h-7 flex items-center justify-center text-[#8C8C8A] hover:text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Decrease count"
      >
        <Minus size={11} />
      </button>
      <span className="w-8 text-center text-[13px] font-semibold text-[#ECECEA] bg-[#242422] py-1 select-none">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(30, value + 1))}
        disabled={disabled}
        className="w-7 h-7 flex items-center justify-center text-[#8C8C8A] hover:text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Increase count"
      >
        <Plus size={11} />
      </button>
    </div>
  );
}

interface MarksButtonGroupProps {
  options: number[];
  selected: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function MarksButtonGroup({
  options,
  selected,
  onChange,
  disabled,
}: MarksButtonGroupProps) {
  return (
    <div
      className={`flex rounded-lg overflow-hidden border border-[#3A3A38] ${
        disabled ? "opacity-40" : ""
      }`}
    >
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => !disabled && onChange(opt)}
          disabled={disabled}
          className={`
            px-2.5 py-1 text-[12px] font-semibold transition-all duration-150
            ${i > 0 ? "border-l border-[#3A3A38]" : ""}
            ${
              selected === opt
                ? "bg-[#1A2A1A] text-[#7AC87A] border-[#3A6A3A]"
                : "bg-[#242422] text-[#6C6C6A] hover:text-[#ECECEA] hover:bg-[#2C2C2A]"
            }
          `}
          aria-pressed={selected === opt}
        >
          {opt}
        </button>
      ))}
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
}

export function ContextSetupCard({
  examType,
  paperKind,
  subjectName,
  syllabusEntries,
  onGenerate,
  difficulty,
  onDifficultyChange,
}: ContextSetupCardProps) {
  const hasChapters = syllabusEntries.length > 0;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // ── Chapter state ─────────────────────────────────────────────────────────
  const [allChapters, setAllChapters] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());

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

  // ── Topic state ───────────────────────────────────────────────────────────
  // chapter -> { all: boolean, selected: Set<string>, customText: string }
  const [topicStates, setTopicStates] = useState<
    Record<number, { all: boolean; selected: Set<string>; customText: string }>
  >({});

  // Initialize topic state for any newly selected chapters
  useEffect(() => {
    setTopicStates((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const ch of Array.from(selectedChapters)) {
        if (!next[ch]) {
          next[ch] = { all: true, selected: new Set(), customText: "" };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selectedChapters]);

  const updateTopicState = (ch: number, patch: Partial<{ all: boolean; selected: Set<string>; customText: string }>) => {
    setTopicStates((prev) => ({
      ...prev,
      [ch]: { ...(prev[ch] || { all: true, selected: new Set(), customText: "" }), ...patch },
    }));
  };

  // ── Distribution state ────────────────────────────────────────────────────
  const [dist, setDist] = useState<QuestionDistribution>(
    buildDefaultDistribution(examType)
  );

  const setPart = (
    part: "partA" | "partB" | "partC",
    patch: Partial<(typeof dist)[typeof part]>
  ) => {
    setDist((prev) => ({
      ...prev,
      [part]: { ...prev[part], ...patch },
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
    const isAllTopics = Array.from(selectedChapters).every(ch => topicStates[ch]?.all !== false);
    summaryParts.push(isAllTopics ? "All Topics" : "Specific Topics");
  }

  if (step > 2) {
    if (dist.partA.enabled) summaryParts.push(`${dist.partA.count}×2A`);
    if (dist.partB.enabled) summaryParts.push(`${dist.partB.count}×${dist.partB.marks}B`);
    if (dist.partC.enabled) summaryParts.push(`${dist.partC.count}×${dist.partC.marks}C`);
  }
  
  if (step > 3 && difficulty) {
    summaryParts.push(DIFFICULTY_LABELS[difficulty]);
  }
  
  const summaryLine = summaryParts.join(" · ");

  // ── Validation ────────────────────────────────────────────────────────────
  const hasChapterSelection = !hasChapters || allChapters || selectedChapters.size > 0;
  
  // Topic validation: if a chapter has 'all: false', it must have customText or selected pills
  const hasValidTopics = Array.from(selectedChapters).every(ch => {
    const ts = topicStates[ch];
    if (!ts || ts.all) return true;
    return ts.selected.size > 0 || ts.customText.trim().length > 0;
  });

  const hasAtLeastOnePart = dist.partA.enabled || dist.partB.enabled || dist.partC.enabled;
  const canGenerate = hasChapterSelection && hasValidTopics && hasAtLeastOnePart && !!difficulty;

  // ── Handle generate ───────────────────────────────────────────────────────
  const handleGenerate = () => {
    if (!canGenerate || !difficulty) return;
    const chapters =
      !hasChapters || allChapters
        ? []
        : Array.from(selectedChapters).sort((a, b) => a - b);

    const topics: Record<number, string[]> = {};
    chapters.forEach((c) => {
      const ts = topicStates[c];
      if (!ts || ts.all) {
        topics[c] = ["all"];
      } else {
        const customTopics = ts.customText.split(',').map(t => t.trim()).filter(Boolean);
        topics[c] = [...Array.from(ts.selected), ...customTopics];
      }
    });

    // If 'all chapters' selected, but no chapters exist in syllabus, send empty topics
    if (chapters.length === 0 && selectedChapters.size > 0) {
       Array.from(selectedChapters).forEach((c) => {
         const ts = topicStates[c];
         if (!ts || ts.all) {
           topics[c] = ["all"];
         } else {
           const customTopics = ts.customText.split(',').map(t => t.trim()).filter(Boolean);
           topics[c] = [...Array.from(ts.selected), ...customTopics];
         }
       });
    }

    onGenerate({
      chapters,
      topics,
      questionDistribution: dist,
      difficulty,
    });
  };

  const kindLabel =
    paperKind === "IMPORTANT_QUESTIONS" ? "Important Questions" : "Exam Paper";

  return (
    <div className="mx-auto w-full max-w-2xl px-3 sm:px-4 py-3">
      <div
        className="
          relative overflow-hidden rounded-2xl
          border border-[#2E2E2C]
          bg-gradient-to-b from-[#222220] to-[#1E1E1C]
          shadow-xl shadow-black/30
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
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleAllChapters}
                    className={`
                      flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium
                      border transition-all duration-150 w-full text-left
                      ${
                        allChapters
                          ? "bg-[#1A2A1A] border-[#3A6A3A]/60 text-[#7AC87A]"
                          : "bg-[#242422] border-[#3A3A38] text-[#6C6C6A] hover:border-[#4A4A48] hover:text-[#ECECEA]"
                      }
                    `}
                    aria-pressed={allChapters}
                  >
                    <LayoutGrid size={14} className="flex-shrink-0" />
                    All Chapters
                  </button>

                  <div className="w-full flex items-center gap-2 my-1">
                    <div className="flex-1 h-px bg-[#2A2A28]" />
                    <span className="text-[10px] text-[#4A4A48] uppercase">Or select specific</span>
                    <div className="flex-1 h-px bg-[#2A2A28]" />
                  </div>

                  <div className="flex flex-col gap-2">
                    {syllabusEntries.map((entry) => {
                      const isSelected = allChapters || selectedChapters.has(entry.chapter);
                      return (
                        <button
                          key={entry.chapter}
                          onClick={() => toggleChapter(entry.chapter)}
                          className={`
                            flex items-start gap-3 px-4 py-3 rounded-xl text-[13px] font-medium
                            border transition-all duration-150 text-left
                            ${
                              isSelected
                                ? "bg-[#1A2A1A] border-[#3A6A3A]/60 text-[#7AC87A]"
                                : "bg-[#242422] border-[#3A3A38] text-[#6C6C6A] hover:border-[#4A4A48] hover:text-[#ECECEA]"
                            }
                          `}
                          aria-pressed={isSelected}
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded bg-black/20 flex items-center justify-center text-[11px] font-bold opacity-80 mt-0.5">
                            {entry.chapter}
                          </span>
                          <span className="leading-snug">{entry.title}</span>
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
                  {Array.from(selectedChapters).sort((a,b) => a - b).map(ch => {
                    const entry = syllabusEntries.find(e => e.chapter === ch);
                    if (!entry) return null;
                    const ts = topicStates[ch] || { all: true, selected: new Set(), customText: "" };
                    const hasPills = entry.topics && entry.topics.length > 0;

                    return (
                      <div key={ch} className="bg-[#242422] border border-[#2E2E2C] rounded-xl overflow-hidden">
                        {/* Header for chapter */}
                        <div className="flex items-center justify-between px-3 py-2 bg-[#2C2C2A] border-b border-[#3A3A38]">
                          <span className="text-[12px] font-semibold text-[#ECECEA] truncate mr-2">
                            Ch {entry.chapter}: {entry.title}
                          </span>
                          
                          <button
                            onClick={() => updateTopicState(ch, { all: !ts.all })}
                            className={`flex-shrink-0 text-[11px] font-semibold px-2 py-1 rounded transition-colors ${
                              ts.all ? "bg-[#1A2A1A] text-[#7AC87A]" : "bg-[#1C1C1B] text-[#6C6C6A] hover:text-[#ECECEA]"
                            }`}
                          >
                            All Topics
                          </button>
                        </div>
                        
                        {/* Topic selection body */}
                        {!ts.all && (
                          <div className="p-3 animate-in fade-in duration-200">
                            {hasPills && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {entry.topics!.map(t => {
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
                                      className={`px-2 py-1 rounded-md text-[11px] border transition-colors ${
                                        selected ? "bg-[#1A2A1A] border-[#3A6A3A]/60 text-[#7AC87A]" : "bg-[#1C1C1B] border-[#3A3A38] text-[#8C8C8A] hover:border-[#4A4A48] hover:text-[#ECECEA]"
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
              <div className="flex items-center gap-2 mb-3">
                <Layers size={12} className="text-[#7A6A5A] flex-shrink-0" />
                <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider">
                  Step 3: Question Distribution
                </span>
              </div>

              <div className="rounded-xl border border-[#2E2E2C] overflow-hidden divide-y divide-[#2A2A28]">
                <PartRow
                  label="Part A"
                  marksLabel="2 marks"
                  marksFixed
                  enabled={dist.partA.enabled}
                  count={dist.partA.count}
                  onToggle={(v) => setPart("partA", { enabled: v })}
                  onCountChange={(v) => setPart("partA", { count: v })}
                />

                <PartRow
                  label="Part B"
                  marksLabel={null}
                  marksOptions={getMarksOptions("B")}
                  selectedMarks={dist.partB.marks}
                  onMarksChange={(v) => setPart("partB", { marks: v })}
                  enabled={dist.partB.enabled}
                  count={dist.partB.count}
                  onToggle={(v) => setPart("partB", { enabled: v })}
                  onCountChange={(v) => setPart("partB", { count: v })}
                />

                <PartRow
                  label="Part C"
                  marksLabel={null}
                  marksOptions={getMarksOptions("C")}
                  selectedMarks={dist.partC.marks}
                  onMarksChange={(v) => setPart("partC", { marks: v })}
                  enabled={dist.partC.enabled}
                  count={dist.partC.count}
                  onToggle={(v) => setPart("partC", { enabled: v })}
                  onCountChange={(v) => setPart("partC", { count: v })}
                />
              </div>
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
                      ${
                        difficulty === d
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
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#242422] border border-[#2E2E2C] mt-2">
            <p
              className="text-[11px] text-[#6C6C6A] truncate flex-1"
              title={summaryLine}
            >
              {summaryLine}
            </p>
          </div>

          {/* ── Action buttons ───────────────────────────────────────────── */}
          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
                className="px-4 py-3 rounded-xl text-[13px] font-semibold bg-[#242422] border border-[#3A3A38] text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors"
              >
                Back
              </button>
            )}

            {step < 4 ? (
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
                  ${
                    ((step === 1 && hasChapterSelection) || (step === 2 && hasValidTopics) || (step === 3 && hasAtLeastOnePart))
                      ? "bg-[#ECECEA] border-[#ECECEA] text-[#1A1710] hover:bg-white shadow-lg"
                      : "bg-[#242422] border-[#3A3A38] text-[#4A4A48] cursor-not-allowed"
                  }
                `}
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                id="context-setup-generate-btn"
                className={`
                  flex-1 flex items-center justify-center gap-2
                  py-3 rounded-xl text-[14px] font-semibold
                  border transition-all duration-200
                  ${
                    canGenerate
                      ? "bg-[#7AC87A] border-[#7AC87A] text-[#1A1710] hover:bg-[#8CD88C] hover:border-[#8CD88C] hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#7AC87A]/10"
                      : "bg-[#242422] border-[#3A3A38] text-[#4A4A48] cursor-not-allowed"
                  }
                `}
              >
                Generate Questions
                <Sparkles size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PartRow ──────────────────────────────────────────────────────────────────

interface PartRowProps {
  label: string;
  marksLabel: string | null;
  marksFixed?: boolean;
  marksOptions?: number[];
  selectedMarks?: number;
  onMarksChange?: (v: number) => void;
  enabled: boolean;
  count: number;
  onToggle: (v: boolean) => void;
  onCountChange: (v: number) => void;
}

function PartRow({
  label,
  marksLabel,
  marksFixed,
  marksOptions,
  selectedMarks,
  onMarksChange,
  enabled,
  count,
  onToggle,
  onCountChange,
}: PartRowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-[#1E1E1C] transition-opacity duration-150 ${
        !enabled ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={() => onToggle(!enabled)}
        className={`
          flex-shrink-0 w-9 h-5 rounded-full border transition-all duration-200 relative
          ${
            enabled
              ? "bg-[#7AC87A]/20 border-[#7AC87A]/50"
              : "bg-[#2C2C2A] border-[#3A3A38]"
          }
        `}
        aria-checked={enabled}
        role="switch"
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`
            absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200
            ${enabled ? "left-4 bg-[#7AC87A]" : "left-0.5 bg-[#4A4A48]"}
          `}
        />
      </button>

      <span className="w-12 text-[12px] font-semibold text-[#ECECEA] flex-shrink-0">
        {label}
      </span>

      <div className="flex-1 flex items-center">
        {marksFixed ? (
          <span className="text-[12px] text-[#6C6C6A] bg-[#242422] border border-[#3A3A38] rounded-lg px-2.5 py-1">
            2 marks
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <MarksButtonGroup
              options={marksOptions ?? []}
              selected={selectedMarks ?? 0}
              onChange={onMarksChange ?? (() => {})}
              disabled={!enabled}
            />
            <span className="text-[11px] text-[#4A4A48]">marks</span>
          </div>
        )}
      </div>

      <CountStepper
        value={count}
        onChange={onCountChange}
        disabled={!enabled}
      />
    </div>
  );
}
