import React from 'react';

export function LoadingNext({ showEndOfList = false, hasMore = true }) {
  return (
    <div className="py-4 min-h-[48px] flex flex-col items-center justify-center w-full">
      {hasMore ? (
        <div className="flex items-center gap-2 text-[#8C8C8A]">
          <svg className="animate-spin motion-reduce:animate-none h-4 w-4 text-[#8C8C8A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-[12px]">Loading next...</span>
        </div>
      ) : showEndOfList ? (
        <div className="flex items-center w-full max-w-[200px] gap-3 opacity-60">
          <div className="flex-1 h-[1px] bg-[#3A3A38]"></div>
          <span className="text-[11px] text-[#5A5A58] font-medium whitespace-nowrap">You're all caught up (its over)</span>
          <div className="flex-1 h-[1px] bg-[#3A3A38]"></div>
        </div>
      ) : null}
    </div>
  );
}
