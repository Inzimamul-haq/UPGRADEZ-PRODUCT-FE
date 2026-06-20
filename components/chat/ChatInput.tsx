"use client";

import React, { useState } from 'react';
import { ArrowUp, Mic } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
  questionsToday: number;
}

export function ChatInput({ onSend, disabled, questionsToday }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
  };

  const isLimitReached = questionsToday >= 10;

  return (
    <div className="bg-[#1C1C1B] mt-auto relative z-20 pb-4">
      <div className="max-w-3xl mx-auto px-4 w-full">
        <div className="flex items-center gap-2 bg-[#2C2C2A] border border-[#3A3A38] rounded-xl px-4 py-2 focus-within:border-[#4A4A48] focus-within:shadow-sm transition-all">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={disabled || isLimitReached}
            placeholder={
              isLimitReached
                ? "Daily limit reached — resets at midnight"
                : "Ask a question or name a topic..."
            }
            className="flex-1 bg-transparent text-[14px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed py-1.5"
          />
          <button
            className="text-[#5A5A58] hover:text-[#8C8C8A] transition-colors p-1 disabled:opacity-30"
            disabled={disabled || isLimitReached}
            title="Voice input"
          >
            <Mic size={17} />
          </button>
          <button
            onClick={handleSend}
            disabled={disabled || !input.trim() || isLimitReached}
            className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-lg hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp size={16} />
          </button>
        </div>
        <p className="text-[11px] text-[#5A5A58] text-center mt-3">
          {questionsToday} / 10 questions used today
        </p>
      </div>
    </div>
  );
}
