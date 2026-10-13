import React from 'react';
import { X } from 'lucide-react';
import { cleanQuestionText } from '@/lib/utils';
import { toDecoded, type DecodedQuestion } from '@/lib/examFormat';
import { DiagramRenderer } from '@/components/ui/QuestionDiagram/DiagramRenderer';
import { QuestionDisplay } from '@/components/chat/QuestionDisplay';

interface QuestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  questions: { id: string; text: string; marks?: number }[];
}

export function QuestionsPanel({ isOpen, onClose, questions }: QuestionsPanelProps) {
  const decodedQuestions = questions.map(toDecoded);

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
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#1C1C1B] border-l border-[#3A3A38] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A3A38]">
          <div>
            <h2 className="text-[15px] font-medium text-[#ECECEA]">Paper Questions</h2>
            {questions.length > 0 && (
              <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                <span className="flex items-center gap-1.5 text-[#8C8C8A]"><div className="w-2 h-2 rounded-full bg-green-500"></div> &le; 5 Marks</span>
                <span className="flex items-center gap-1.5 text-[#8C8C8A]"><div className="w-2 h-2 rounded-full bg-orange-500"></div> &le; 10 Marks</span>
                <span className="flex items-center gap-1.5 text-[#8C8C8A]"><div className="w-2 h-2 rounded-full bg-red-500"></div> 11+ Marks</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#8C8C8A] hover:text-[#ECECEA] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {decodedQuestions.length === 0 ? (
            <p className="text-[13px] text-[#8C8C8A] text-center mt-10">No questions available.</p>
          ) : (
            decodedQuestions.map((q, i) => {
              // Format label properly if it has part/group/sub info, else fallback to Q(i+1)
              const hasQpPrefix = q.part && q.groupIndex;
              // For simplicity in the panel, just numbering them sequentially or using subLabel
              const label = hasQpPrefix && q.subLabel ? `${q.groupIndex}${q.subLabel}` : `Q${i + 1}`;


              return (
                <div key={q.id || i} className="bg-[#2C2C2A] p-4 rounded-xl border border-[#3A3A38] flex flex-col gap-3">
                  {/* Header: Number & Marks & Badges */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px] text-[#ECECEA]">{label}.</span>
                      {q.meta && (
                        <div className="flex gap-1.5">
                          {q.meta.co && (
                            <span className="px-1.5 py-0.5 rounded bg-[#1C1C1B] text-[#8C8C8A] text-[10px] font-medium border border-[#3A3A38]">
                              {q.meta.co.toUpperCase()}
                            </span>
                          )}
                          {q.meta.rbt && (
                            <span className="px-1.5 py-0.5 rounded bg-[#1C1C1B] text-[#8C8C8A] text-[10px] font-medium border border-[#3A3A38]">
                              {q.meta.rbt.toUpperCase()}
                            </span>
                          )}
                          {q.meta.po && (
                            <span className="px-1.5 py-0.5 rounded bg-[#1C1C1B] text-[#8C8C8A] text-[10px] font-medium border border-[#3A3A38]">
                              {q.meta.po.toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {q.marks && (
                      <span className="text-[12px] font-medium text-[#8C8C8A]">
                        ({q.marks} Marks)
                      </span>
                    )}
                  </div>

                  {/* Question Text */}
                  <div className="text-[13px] text-[#ECECEA] leading-relaxed">
                    <QuestionDisplay
                      stem={q.stem}
                      options={q.options}
                      fallbackText={cleanQuestionText(q.text)}
                      showAnswer={false}
                    />
                  </div>

                  {/* Diagram */}
                  {q.diagramSpec && (
                    <div className="mt-2 flex justify-center bg-[#1C1C1B] rounded-lg p-2 border border-[#3A3A38]">
                      <DiagramRenderer
                        type={q.diagramSpec.type || q.diagramType || 'unknown'}
                        spec={q.diagramSpec}
                        width={280}
                        height={200}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
