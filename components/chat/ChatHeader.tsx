import React from 'react';
import { FileText, BookOpen } from 'lucide-react';
import { DifficultySelector } from './DifficultySelector';
import { DifficultyMode } from '@/lib/types';

interface ChatHeaderPropsExtended {
  subjectName: string;
  examType: string;
  paperResolved: boolean;
  onOpenQuestions: () => void;
  role?: string;
  showDifficulty?: boolean;
  difficultyValue?: DifficultyMode | '';
  difficultyConfirmed?: boolean;
  onDifficultyConfirm?: (mode: DifficultyMode) => void;
  onDifficultyEdit?: () => void;
  difficultyDisabled?: boolean;
  syllabusAvailable?: boolean;
  onOpenSyllabus?: () => void;
  canOpenIQPicker?: boolean;
  onOpenIQPicker?: () => void;
}

export function ChatHeader({
  subjectName,
  examType,
  paperResolved,
  onOpenQuestions,
  role,
  showDifficulty = false,
  difficultyValue = '',
  difficultyConfirmed = false,
  onDifficultyConfirm = () => {},
  onDifficultyEdit = () => {},
  difficultyDisabled = false,
  syllabusAvailable = false,
  onOpenSyllabus,
  canOpenIQPicker = false,
  onOpenIQPicker,
}: ChatHeaderPropsExtended) {
  return (
    <div className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-[#2E2E2C] bg-[#1C1C1B] px-2.5 py-2 sm:px-6 sm:py-3.5">
      <div className="hidden sm:block min-w-0 flex-1 ml-8">
        <p className="text-[13px] sm:text-[14px] font-medium text-[#ECECEA] truncate">
          {subjectName}
        </p>
        <p className="text-[11px] sm:text-[12px] text-[#8C8C8A] truncate">
          {examType}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 ml-auto sm:ml-3">
                <button
          onClick={onOpenSyllabus}
          id="chat-header-syllabus-btn"
          className="
            inline-flex items-center justify-center gap-1.5
            px-2 sm:px-3
            py-1.5 sm:py-2
            rounded-lg
            border
            transition-all duration-200
            flex-shrink-0
            text-[11px] sm:text-[12px]
            font-medium
            bg-[#2C2C2A]
            border-[#7A6A3A]/30
            text-[#B8A46A]
            hover:bg-[#332F22]
            hover:border-[#7A6A3A]/50
            hover:scale-[1.02]
          "
          title="View syllabus units"
          aria-label="View syllabus"
        >
          <BookOpen size={14} className="sm:w-[15px] sm:h-[15px]" />
          <span className="hidden xs:inline">Syllabus</span>
        </button>

        {showDifficulty && (
          <div
            className="
              flex-shrink-0
              [&_button]:px-2.5
              [&_button]:py-1.5
              [&_button]:text-[11px]
              [&_button]:sm:px-3
              [&_button]:sm:py-2
              [&_button]:sm:text-[12px]
              [&_button]:whitespace-nowrap
            "
          >
            <DifficultySelector
              value={difficultyValue}
              confirmed={difficultyConfirmed}
              onConfirm={onDifficultyConfirm}
              onEdit={onDifficultyEdit}
              disabled={difficultyDisabled}
            />
          </div>
        )}

        {role === 'student' && (
          <button
            onClick={onOpenQuestions}
            disabled={!paperResolved}
            className={`
              inline-flex items-center justify-center gap-1.5
              px-2 sm:px-3
              py-1.5 sm:py-2
              rounded-lg
              border
              transition-all duration-200
              flex-shrink-0
              text-[11px] sm:text-[12px]
              font-medium
              ${
                paperResolved
                  ? `
                    bg-[#2C2C2A]
                    border-[#BC676A]/30
                    text-[#BC676A]
                    hover:bg-[#332A2A]
                    hover:border-[#BC676A]/50
                    hover:scale-[1.02]
                  `
                  : `
                    bg-[#222221]
                    border-[#3A3A38]
                    text-[#5A5A58]
                    cursor-not-allowed
                  `
              }
            `}
            title={paperResolved ? 'View Questions' : 'No paper assigned'}
          >
            <FileText size={14} className="sm:w-[15px] sm:h-[15px]" />
            <span className="hidden xs:inline">View Questions</span>
            <span className="inline xs:hidden">Questions</span>
          </button>
        )}

        {(role === 'faculty' ||
          role === 'admin' ||
          role === 'super_admin' ||
          role === 'super-admin') &&
          canOpenIQPicker && (
            <button
              onClick={onOpenIQPicker}
              className="
                inline-flex items-center justify-center gap-1.5
                px-2 sm:px-3
                py-1.5 sm:py-2
                rounded-lg
                border
                transition-all duration-200
                flex-shrink-0
                text-[11px] sm:text-[12px]
                font-medium
                bg-green-600
                border-green-500
                text-white
                hover:bg-green-700
                hover:scale-[1.02]
              "
              title="Create Exam Paper from Important Questions"
            >
              <FileText size={14} className="sm:w-[15px] sm:h-[15px]" />
              <span className="hidden xs:inline">Create Exam Paper</span>
              <span className="inline xs:hidden">Create Exam</span>
            </button>
          )}
      </div>
    </div>
  );
}