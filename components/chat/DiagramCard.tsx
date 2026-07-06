import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { DiagramCardProps } from '@/lib/types';

export function DiagramCard({ diagramName, pageNumber, url }: DiagramCardProps) {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 mt-2 bg-[#2C2C2A] border border-[#3A3A38] rounded px-3 py-2 w-fit hover:bg-[#333331] transition-colors duration-150"
    >
      <FileText size={13} className="text-[#8C8C8A]" />
      <span className="text-[12px] text-[#8C8C8A]">
        Refer: {diagramName}, Page {pageNumber}
      </span>
      <ExternalLink size={11} className="text-[#5A5A58]" />
    </a>
  );
}
