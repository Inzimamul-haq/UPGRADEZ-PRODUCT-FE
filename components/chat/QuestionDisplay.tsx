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
        <div className="qp-question-stem">
          <MathMarkdown>{stem}</MathMarkdown>
        </div>
      )}

      <div className="qp-options-list space-y-1 pl-3 text-sm">
        {options.map((opt, idx) => {
          const letter = optionLetters[idx] || String.fromCharCode(65 + idx);
          const isCorrect = showAnswer && correctIndex === idx;

          return (
            <div
              key={idx}
              className={`flex items-start gap-2 ${
                isCorrect ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''
              }`}
            >
              <span className="font-medium shrink-0">{letter})</span>
              <div className="flex-1">
                <MathMarkdown>{opt}</MathMarkdown>
              </div>
            </div>
          );
        })}
      </div>

      {showAnswer && typeof correctIndex === 'number' && options[correctIndex] !== undefined && (
        <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 pt-1">
          Answer: {optionLetters[correctIndex] || String.fromCharCode(65 + correctIndex)}) {options[correctIndex]}
        </div>
      )}
    </div>
  );
};
