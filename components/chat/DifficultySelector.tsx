"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { DifficultyMode } from '@/lib/types';

const OPTIONS: { value: DifficultyMode; label: string; hint: string }[] = [
  { value: 'SIMPLE', label: 'Simple', hint: 'Mostly direct syllabus questions' },
  { value: 'MEDIUM', label: 'Medium', hint: 'Direct + application-based questions' },
  { value: 'HARD', label: 'Hard', hint: 'Deeper concepts + problems + scenarios' },
];

const MODE_LABELS: Record<DifficultyMode, string> = {
  SIMPLE: 'Simple',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

interface DifficultySelectorProps {
  value: DifficultyMode;
  confirmed: boolean;
  onConfirm: (mode: DifficultyMode) => void;
  onEdit: () => void;
  disabled?: boolean;
}

export function DifficultySelector({
  value,
  confirmed,
  onConfirm,
  onEdit,
  disabled,
}: DifficultySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<DifficultyMode>(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (confirmed) setDraft(value);
  }, [value, confirmed]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (mode: DifficultyMode) => {
    setDraft(mode);
    onConfirm(mode);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!confirmed) onEdit();
    }
  };

  // Get color based on difficulty
  const getDifficultyColor = (mode: DifficultyMode) => {
    switch (mode) {
      case 'SIMPLE': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HARD': return 'text-red-400';
      default: return 'text-orange-400';
    }
  };

  const getDifficultyBg = (mode: DifficultyMode) => {
    switch (mode) {
      case 'SIMPLE': return 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20';
      case 'HARD': return 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20';
      default: return 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20';
    }
  };

  const getOptionBg = (mode: DifficultyMode, isSelected: boolean) => {
    if (!isSelected) return 'hover:bg-[#2C2C2A]';
    switch (mode) {
      case 'SIMPLE': return 'bg-green-500/10 border-green-500/30';
      case 'MEDIUM': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'HARD': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-orange-500/10 border-orange-500/30';
    }
  };

  const getOptionDot = (mode: DifficultyMode) => {
    switch (mode) {
      case 'SIMPLE': return 'bg-green-400';
      case 'MEDIUM': return 'bg-yellow-400';
      case 'HARD': return 'bg-red-400';
      default: return 'bg-orange-400';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
          ${confirmed ? getDifficultyBg(value) : 'bg-[#2C2C2A] border-[#3A3A38] hover:border-orange-500/30'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          text-sm font-medium text-[#ECECEA]
        `}
      >
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${confirmed ? getOptionDot(value) : 'bg-[#5A5A58]'}`} />
          <span>
            {confirmed ? (
              <span className={getDifficultyColor(value)}>{MODE_LABELS[value]}</span>
            ) : (
              <span className="text-[#8C8C8A]">Select Difficulty</span>
            )}
          </span>
        </span>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${confirmed ? 'text-[#8C8C8A]' : 'text-[#5A5A58]'}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#1C1C1B] border border-[#3A3A38] rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-1.5">
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#5A5A58]">
                Difficulty Level
              </p>
            </div>
            {OPTIONS.map((opt) => {
              const isSelected = draft === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
                    ${isSelected ? getOptionBg(opt.value, true) : 'hover:bg-[#2C2C2A]'}
                    border ${isSelected ? 'border-opacity-50' : 'border-transparent'}
                    text-left
                  `}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${getOptionDot(opt.value)} ${isSelected ? 'ring-2 ring-offset-2 ring-offset-[#1C1C1B] ring-' + getOptionDot(opt.value).replace('bg-', '') : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isSelected ? getDifficultyColor(opt.value) : 'text-[#ECECEA]'}`}>
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check size={14} className={getDifficultyColor(opt.value)} />
                      )}
                    </div>
                    <span className="text-[11px] text-[#8C8C8A] block mt-0.5">
                      {opt.hint}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}