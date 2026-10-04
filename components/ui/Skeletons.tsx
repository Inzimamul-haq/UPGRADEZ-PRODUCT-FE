import React from 'react';

export function ChatRowSkeleton() {
  return (
    <div aria-hidden="true" className="w-full text-left px-4 py-3 min-h-[64px]">
      <div className="h-[20px] bg-[#2E2E2C] rounded w-[70%] mb-1 animate-pulse motion-reduce:animate-none"></div>
      <div className="flex items-center gap-2 mt-0.5">
        <div className="h-[18px] bg-[#2E2E2C] rounded w-[30%] animate-pulse motion-reduce:animate-none"></div>
        <div className="h-[14px] bg-[#2E2E2C] rounded w-[15%] animate-pulse motion-reduce:animate-none"></div>
      </div>
    </div>
  );
}

export function SubjectRowSkeleton() {
  return (
    <div aria-hidden="true" className="bg-[#242422] rounded-xl border border-[#3A3A38] overflow-hidden mb-3">
      <div className="w-full px-5 py-4 flex items-center justify-between">
        <div className="h-[24px] bg-[#2E2E2C] rounded w-[40%] animate-pulse motion-reduce:animate-none"></div>
        <div className="h-[20px] bg-[#2E2E2C] rounded w-[10%] animate-pulse motion-reduce:animate-none"></div>
      </div>
    </div>
  );
}

export function PaperCardSkeleton() {
  return (
    <div aria-hidden="true" className="bg-[#242422] rounded-xl border border-[#3A3A38] overflow-hidden p-5 flex flex-col min-h-[160px]">
      <div className="h-[24px] bg-[#2E2E2C] rounded w-[60%] mb-3 animate-pulse motion-reduce:animate-none"></div>
      <div className="h-[16px] bg-[#2E2E2C] rounded w-[40%] mb-4 animate-pulse motion-reduce:animate-none"></div>
      <div className="mt-auto flex justify-between items-center">
        <div className="h-[20px] bg-[#2E2E2C] rounded w-[25%] animate-pulse motion-reduce:animate-none"></div>
        <div className="h-[32px] bg-[#2E2E2C] rounded-lg w-[30%] animate-pulse motion-reduce:animate-none"></div>
      </div>
    </div>
  );
}

export function ActivityRowSkeleton() {
  return (
    <div aria-hidden="true" className="py-4 px-4 sm:px-6 flex gap-4 min-h-[72px]">
      <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-[#2E2E2C] animate-pulse motion-reduce:animate-none"></div>
      <div className="flex-1 min-w-0">
        <div className="h-[20px] bg-[#2E2E2C] rounded w-[80%] mb-2 animate-pulse motion-reduce:animate-none"></div>
        <div className="h-[16px] bg-[#2E2E2C] rounded w-[40%] mb-2 animate-pulse motion-reduce:animate-none"></div>
        <div className="h-[14px] bg-[#2E2E2C] rounded w-[20%] animate-pulse motion-reduce:animate-none"></div>
      </div>
    </div>
  );
}

export function QuestionModalSkeleton() {
  return (
    <div aria-hidden="true" className="p-6 space-y-4">
      <div className="h-[24px] bg-[#2E2E2C] rounded w-[80%] animate-pulse motion-reduce:animate-none"></div>
      <div className="h-[20px] bg-[#2E2E2C] rounded w-[60%] animate-pulse motion-reduce:animate-none"></div>
      <div className="h-[120px] bg-[#2E2E2C] rounded w-full animate-pulse motion-reduce:animate-none"></div>
      <div className="h-[40px] bg-[#2E2E2C] rounded-lg w-[30%] ml-auto animate-pulse motion-reduce:animate-none"></div>
    </div>
  );
}

export function SkeletonList({ count, Row }: { count: number; Row: React.ComponentType }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Row key={i} />
      ))}
    </>
  );
}

export const NotificationSkeleton = ActivityRowSkeleton;
export const GlobalSubjectSkeleton = SubjectRowSkeleton;
