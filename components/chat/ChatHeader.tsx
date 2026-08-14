import React from 'react';
import { ChatHeaderProps } from '@/lib/types';
import { FileText } from 'lucide-react';

interface ChatHeaderPropsExtended extends ChatHeaderProps {
  role?: string;
}

export function ChatHeader({ subjectName, examType, paperResolved, onOpenQuestions, role }: ChatHeaderPropsExtended) {
  return (
    <div className="flex items-center justify-between bg-[#1C1C1B] px-6 py-4 flex-shrink-0">
      <div className='ml-8'>
        <p className="text-[14px] font-medium text-[#ECECEA]">{subjectName}</p>
        <p className="text-[12px] text-[#8C8C8A]">{examType}</p>
      </div>
      {role === 'student' && (
        <button
          onClick={onOpenQuestions}
          disabled={!paperResolved}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${paperResolved
              ? "text-[#ECECEA] hover:bg-[#2A2A28]"
              : "text-[#5A5A58] cursor-not-allowed"
            }`}
          title={paperResolved ? "View Questions" : "No paper assigned"}
        >

          <FileText size={15} />
          <span className='text-[13px] text-[#ECECEA]'>View Q/P</span>

        </button>
      )}
    </div>
  );
}
