import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

function humanize(str: string) {
  return str
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function RecursiveRender({ data }: { data: any }) {
  if (data === null || data === undefined) return null;

  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    const content = String(data);
    const isText = content.includes('\n') || content.includes('\\n') || content.includes('$') || content.split(/\s+/).filter(w => /^[a-zA-Z]{3,}$/.test(w)).length >= 3;
    const displayContent = isText ? content.replace(/\\n/g, '\n\n').replace(/\n/g, '\n\n').replace(/\n\n\n\n/g, '\n\n') : `$$${content}$$`;

    return (
      <div className={`w-full py-2 px-3 overflow-x-auto text-[13px] text-[#D1D1C7] ${isText ? 'text-left whitespace-pre-wrap leading-relaxed flex flex-col gap-2' : 'flex justify-center'}`}>
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {displayContent}
        </ReactMarkdown>
      </div>
    );
  }

  if (Array.isArray(data)) {
    return (
      <div className="flex flex-col gap-3 w-full">
        {data.map((item, idx) => (
          <div key={idx} className="bg-[#252523] border border-[#3A3A38]/50 rounded-lg p-3">
            <div className="text-[#818CF8] font-bold text-[11px] uppercase tracking-wider mb-2">Item {idx + 1}</div>
            <RecursiveRender data={item} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === 'object') {
    return (
      <div className="flex flex-col gap-3 w-full">
        {Object.entries(data).map(([key, value], idx) => {
          if (value === null || value === undefined || value === '') return null;
          return (
            <div key={idx} className="flex flex-col gap-1.5 w-full">
              <div className="text-[12px] font-semibold text-[#8C8C8A] uppercase tracking-wide">
                {humanize(key)}
              </div>
              <div className="bg-[#1C1C1B] rounded-lg border border-[#3A3A38] p-3 w-full hover:border-[#4A4A48] transition-colors">
                <RecursiveRender data={value} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

export function FallbackSolution({ data }: { data: any }) {
  return (
    <div className="flex flex-col gap-4 mt-4 mb-2 w-full max-w-full">
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <span className="text-[13px] font-semibold text-amber-500">Solution (Fallback Layout)</span>
      </div>
      
      <div className="flex flex-col gap-3 relative border-l-2 border-amber-500/30 ml-3 pl-5 w-full max-w-full">
        <RecursiveRender data={data} />
      </div>
    </div>
  );
}
