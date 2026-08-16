import React from 'react';
import { ChatHeaderProps } from '@/lib/types';
import { FileText } from 'lucide-react';

interface ChatHeaderPropsExtended extends ChatHeaderProps {
  role?: string;
}

export function ChatHeader({
  subjectName,
  examType,
  paperResolved,
  onOpenQuestions,
  role,
}: ChatHeaderPropsExtended) {
  return (
    <div className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-[#2E2E2C] bg-[#1C1C1B] px-3 py-3 sm:px-6 sm:py-4">
      {/* Subject / Exam */}
      <div className="ml-8  min-w-0">
        <p className="text-[13px] sm:text-[14px] font-medium text-[#ECECEA] truncate">
          {subjectName}
        </p>

        <p className="text-[11px] sm:text-[12px] text-[#8C8C8A] truncate">
          {examType}
        </p>
      </div>

      {/* View Questions */}
      {role === 'student' && (
        <button
          onClick={onOpenQuestions}
          disabled={!paperResolved}
          className={`
            inline-flex items-center gap-1.5
            px-2 sm:px-2.5
            py-1 sm:py-1.5
            rounded-md
            border
            transition-colors
            flex-shrink-0
            ${
              paperResolved
                ? `
                  bg-[#2C2C2A]
                  border-[#BC676A]/30
                  text-[#BC676A]
                  hover:bg-[#332A2A]
                  hover:border-[#BC676A]/50
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
          <FileText
            size={13}
            className="sm:w-[14px] sm:h-[14px]"
          />

          <span className="text-[11px] sm:text-[12px] font-medium whitespace-nowrap">
            View Questions
          </span>
        </button>
      )}
    </div>
  );
}