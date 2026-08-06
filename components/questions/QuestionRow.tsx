import React from 'react';
import { Question } from '@/lib/types';
import { cleanQuestionText, getMarksColor } from '@/lib/utils';

interface QuestionRowProps {
  question: Question;
  index: number;
}

export function QuestionRow({ question, index }: QuestionRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#2E2E2C]">
      <span className={`text-[12px] font-medium w-6 flex-shrink-0 mt-0.5 ${getMarksColor(question.marks as number)}`}>
        Q{index}
      </span>
      <p className="flex-1 text-[14px] text-[#ECECEA] leading-relaxed">
        {cleanQuestionText(question.question_text || (question as any).text)}
      </p>
    </div>
  );
}
