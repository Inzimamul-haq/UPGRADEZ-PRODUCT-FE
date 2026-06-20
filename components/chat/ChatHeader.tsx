import React from 'react';

interface ChatHeaderProps {
  subjectName: string;
  examType: string;
  questionsToday: number;
}

export function ChatHeader({ subjectName, examType, questionsToday }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-[#1C1C1B] px-6 py-4 flex-shrink-0">
      <div>
        <p className="text-[14px] font-medium text-[#ECECEA]">{subjectName}</p>
        <p className="text-[12px] text-[#8C8C8A]">{examType}</p>
      </div>
      <p className="text-[12px] text-[#5A5A58]">
        {Math.max(0, 10 - questionsToday)} questions remaining
      </p>
    </div>
  );
}
