"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, BookOpen, ChevronDown, ChevronRight, Check } from "lucide-react";
import { TocEntry } from "@/lib/types";

interface SyllabusPanelProps {
  open: boolean;
  onClose: () => void;
  subjectName: string;
  entries: TocEntry[];
}

export function SyllabusPanel({ open, onClose, subjectName, entries }: SyllabusPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(() => new Set(entries.map((e) => e.chapter)));

  useEffect(() => {
    setExpandedChapters(new Set(entries.map((e) => e.chapter)));
  }, [entries]);

  const toggleChapter = (chapter: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapter)) next.delete(chapter);
      else next.add(chapter);
      return next;
    });
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when panel is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]
          transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Subject Syllabus"
        className={`
          fixed z-50
          bg-[#1C1C1B] border-[#2E2E2C]
          bottom-0 left-0 right-0 rounded-t-2xl border-t border-x
          max-h-[70vh]
          sm:bottom-0 sm:top-0 sm:left-auto sm:right-0 sm:rounded-none sm:rounded-l-xl
          sm:border-t-0 sm:border-l sm:border-y-0 sm:border-r-0
          sm:w-[400px] sm:max-h-full
          flex flex-col
          shadow-2xl shadow-black/40
          transition-transform duration-300 ease-in-out
          ${open
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-y-0 sm:translate-x-full"
          }
        `}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#3A3A38]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2E2E2C] flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#2C2C2A] border border-[#3A3A38] flex items-center justify-center">
              <BookOpen size={14} className="text-[#8C8C8A]" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#ECECEA] leading-tight">Syllabus</p>
              <p className="text-[11px] text-[#6C6C6A] truncate leading-tight mt-0.5">{subjectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close syllabus panel"
            className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[#6C6C6A] hover:text-[#ECECEA] hover:bg-[#2C2C2A] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 px-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#242422] border border-[#2E2E2C] flex items-center justify-center mb-3">
                <BookOpen size={18} className="text-[#4A4A48]" />
              </div>
              <p className="text-[12px] text-[#6C6C6A] leading-relaxed">
                No syllabus uploaded for this subject yet.
              </p>
            </div>
          ) : (
            <ul className="p-3 flex flex-col gap-1.5">
              {entries.map((entry) => {
                const isExpanded = expandedChapters.has(entry.chapter);
                const hasTopics = entry.topics && entry.topics.length > 0;
                
                return (
                  <li
                    key={entry.chapter}
                    className="flex flex-col gap-1 px-3 py-2.5 rounded-lg hover:bg-[#242422] transition-colors duration-150"
                  >
                    <div 
                      className={`flex items-start gap-3 ${hasTopics ? "cursor-pointer group" : ""}`}
                      onClick={() => hasTopics && toggleChapter(entry.chapter)}
                    >
                      {/* Chapter badge */}
                      <span className="flex-shrink-0 w-6 h-6 rounded-md bg-[#2C2C2A] border border-[#3A3A38] flex items-center justify-center mt-0.5">
                        <span className="text-[10px] font-semibold text-[#8C8C8A] leading-none">
                          {entry.chapter}
                        </span>
                      </span>

                      {/* Title & Topic Count */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12px] sm:text-[13px] text-[#C4C4C2] leading-snug group-hover:text-[#ECECEA] transition-colors">
                            {entry.title}
                          </p>
                          {hasTopics && (
                            <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                              <span className="text-[10px] text-[#6C6C6A] bg-[#1C1C1B] px-1.5 py-0.5 rounded border border-[#2E2E2C]">
                                {entry.topics.length} topics
                              </span>
                              {isExpanded ? (
                                <ChevronDown size={14} className="text-[#6C6C6A]" />
                              ) : (
                                <ChevronRight size={14} className="text-[#6C6C6A]" />
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-[#4A4A48] mt-0.5 leading-none">
                          Unit {entry.chapter}
                        </p>
                      </div>
                    </div>
                    
                    {/* Expandable Topics List */}
                    {isExpanded && hasTopics && (
                      <div className="mt-2 pl-9 pr-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <ul className="flex flex-col gap-1.5">
                          {entry.topics.map((topic, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[11px] text-[#8C8C8A]">
                              <Check size={12} className="text-[#4A4A48] mt-0.5 flex-shrink-0" />
                              <span className="leading-snug">{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div className="flex-shrink-0 px-4 py-2.5 border-t border-[#2E2E2C]">
            <p className="text-[10px] text-[#4A4A48] text-center">
              {entries.length} unit{entries.length !== 1 ? "s" : ""} · Extracted from syllabus
            </p>
          </div>
        )}
      </div>
    </>
  );
}
