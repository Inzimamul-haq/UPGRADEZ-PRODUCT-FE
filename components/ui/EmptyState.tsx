import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  subtext?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, heading, subtext, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Icon size={28} className="text-[#3A3A38] mb-3" />
      <p className="text-[13px] text-[#8C8C8A] font-medium">{heading}</p>
      {subtext && (
        <p className="text-[12px] text-[#5A5A58] mt-1">{subtext}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
