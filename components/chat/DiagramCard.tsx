import React from 'react';
import { ImageIcon, ExternalLink } from 'lucide-react';
import { DiagramCardProps } from '@/lib/types';

export function DiagramCard({ diagramName, pageNumber, url }: DiagramCardProps) {
  return (
    <div className="flex flex-col mt-3 bg-[#1C1C1B] border border-[#333331] rounded-lg overflow-hidden w-full max-w-xl">
      <div className="px-3 py-2 bg-[#252523] border-b border-[#333331] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-[#8C8C8A]" />
          <span className="text-[13px] font-medium text-[#E0E0E0]">
            {diagramName || "Diagram"}
          </span>
        </div>
        <span className="text-[11px] font-medium text-[#8C8C8A] bg-[#1C1C1B] px-2 py-0.5 rounded-full border border-[#333331]">
          Page {pageNumber}
        </span>
      </div>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block relative w-full bg-[#141413] p-4 hover:opacity-90 transition-opacity group"
      >
        <img 
          src={url} 
          alt={diagramName || "Diagram"} 
          className="w-full h-auto max-h-[400px] object-contain rounded"
          loading="lazy"
        />
        <div className="absolute top-4 right-4 bg-black/50 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink size={14} className="text-white" />
        </div>
      </a>
    </div>
  );
}
