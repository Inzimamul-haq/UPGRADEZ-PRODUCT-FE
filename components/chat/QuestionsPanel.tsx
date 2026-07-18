import React from 'react';
import { X } from 'lucide-react';

interface QuestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  questions: { id: string; text: string }[];
}

export function QuestionsPanel({ isOpen, onClose, questions }: QuestionsPanelProps) {
  return (
    <>
      {/* Backdrop for mobile mostly, but good for focus */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#1C1C1B] border-l border-[#3A3A38] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A3A38]">
          <h2 className="text-[15px] font-medium text-[#ECECEA]">Paper Questions</h2>
          <button 
            onClick={onClose}
            className="text-[#8C8C8A] hover:text-[#ECECEA] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {questions.length === 0 ? (
            <p className="text-[13px] text-[#8C8C8A] text-center mt-10">No questions available.</p>
          ) : (
            questions.map((q, i) => (
              <div key={q.id || i} className="bg-[#2C2C2A] p-4 rounded-xl border border-[#3A3A38]">
                <p className="text-[13px] text-[#ECECEA] leading-relaxed">
                  <span className="text-orange-500 font-medium mr-2">Q{i + 1}.</span>
                  {q.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
