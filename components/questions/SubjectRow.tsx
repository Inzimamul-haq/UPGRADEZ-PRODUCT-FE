"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Subject } from '@/lib/types';
import { ChevronRight } from 'lucide-react';

interface SubjectRowProps {
  subject: Subject;
}

export function SubjectRow({ subject }: SubjectRowProps) {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(`/student/questions/${subject.id}`)}
      className="flex items-center justify-between bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-4 py-3 cursor-pointer hover:bg-[#333331] transition-colors duration-150"
    >
      <div>
        <p className="text-[14px] font-medium text-[#ECECEA]">{subject.name}</p>
        <p className="text-[12px] text-[#8C8C8A]">{subject.code}</p>
      </div>
      <ChevronRight size={16} className="text-[#5A5A58]" />
    </div>
  );
}
