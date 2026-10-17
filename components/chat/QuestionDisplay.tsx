import React from 'react';
import { MathMarkdown } from '../ui/MathMarkdown';

interface QuestionDisplayProps {
  stem?: string;
  options?: string[];
  fallbackText?: string;
  showAnswer?: boolean;
  correctIndex?: number;
  className?: string;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  stem,
  options,
  fallbackText,
  showAnswer = false,
  correctIndex,
  className = '',
}) => {
  // If no parsed options, render fallbackText or stem directly with MathMarkdown
  if (!options || options.length === 0) {
    return (
      <div className={`qp-question-text ${className}`}>
        <MathMarkdown>{stem || fallbackText || ''}</MathMarkdown>
      </div>
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className={`qp-question-display space-y-2 ${className}`}>
      {stem && (
        <div className="qp-question-stem font-bold">
          <MathMarkdown>{stem}</MathMarkdown>
        </div>
      )}

      <div className="qp-options-list flex flex-wrap items-center gap-x-8 gap-y-1.5 pl-2 text-[13.5px] font-normal">
        {options.map((opt, idx) => {
          const letter = optionLetters[idx] || String.fromCharCode(65 + idx);
          const isCorrect = showAnswer && correctIndex === idx;

          return (
            <div
              key={idx}
              className={`inline-flex items-center gap-1.5 ${
                isCorrect ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''
              }`}
            >
              <span className="font-semibold shrink-0">{letter})</span>
              <div className="inline [&_p]:inline font-normal">
                <MathMarkdown>{opt}</MathMarkdown>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
