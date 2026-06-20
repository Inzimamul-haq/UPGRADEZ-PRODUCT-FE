"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Subject } from '@/lib/types';

interface SubjectCardProps {
  subject: Subject;
  onClick?: () => void;
}

export function SubjectCard({ subject, onClick }: SubjectCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/student/questions/${subject.id}`);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-[#2C2C2A] border border-[#3A3A38] rounded-lg p-4 cursor-pointer hover:bg-[#333331] transition-colors duration-150"
    >
      <p className="text-[14px] font-medium text-[#ECECEA]">{subject.name}</p>
      <p className="text-[12px] text-[#8C8C8A] mt-0.5">{subject.code}</p>
      <p className="text-[12px] text-[#5A5A58] mt-0.5">{subject.department}</p>
    </div>
  );
}
