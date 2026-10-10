import { TableSolutionData } from '@/lib/types';
import { MathMarkdown } from '@/components/ui/MathMarkdown';
import { Table } from 'lucide-react';

export function TableSolution({
  data,
}: {
  data: TableSolutionData;
}) {
  return (
    <div className="flex flex-col gap-4 mt-4 mb-2">
      <div className="bg-[#1C1C1B] border border-[#3A3A38] rounded-xl p-4">
        {data.title && (
          <h3 className="text-[14px] font-bold text-[#ECECEA] mb-2 flex items-center gap-2">
            <Table size={16} className="text-[#818CF8]" />
            {data.title}
          </h3>
        )}
        
        {data.description && (
          <div className="text-[13px] text-[#A1A1AA] mb-4 prose prose-invert prose-p:my-1 max-w-none">
            <MathMarkdown>
              {data.description}
            </MathMarkdown>
          </div>
        )}

        {data.diagram && data.diagram.type && data.diagram.type.toLowerCase().includes('logic') && Array.isArray(data.diagram.inputs) && data.diagram.output && (
          <div className="mb-6 p-4 bg-[#252523] border border-[#3A3A38] rounded-lg overflow-x-auto flex flex-col items-center justify-center font-mono text-[13px] text-[#D1D1C7]">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-4 text-right">
                {data.diagram.inputs.map((input, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-bold text-[#F59E0B]">{input}</span>
                    <span className="text-[#71717A]">──┐</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-2 border-[#818CF8] rounded-md bg-[#2C2C2A] text-[#E5E5E5] font-bold tracking-widest shadow-[0_0_10px_rgba(129,140,248,0.2)]">
                {data.diagram.gate}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#71717A]">──</span>
                <span className="font-bold text-[#F59E0B]">{data.diagram.output}</span>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-[#A1A1AA] uppercase tracking-wider font-sans">
              Logic Gate Diagram
            </div>
          </div>
        )}

        <div className="overflow-x-auto border border-[#3A3A38] rounded-lg">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#2C2C2A]/60">
              <tr>
                {data.headers.map((header, i) => (
                  <th key={i} className="p-3 border-b border-[#3A3A38] border-r border-[#3A3A38] last:border-r-0 font-semibold text-[#E5E5E5] prose prose-invert prose-p:my-0 max-w-none">
                    <MathMarkdown>
                      {header}
                    </MathMarkdown>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-[#3A3A38] last:border-b-0 hover:bg-[#252523] transition-colors">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="p-3 border-r border-[#3A3A38] last:border-r-0 text-[#D1D1C7] prose prose-invert prose-p:my-0 max-w-none">
                      <MathMarkdown>
                        {cell}
                      </MathMarkdown>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.summary && (
          <div className="mt-4 p-3 bg-[#252523] rounded-lg border border-[#3A3A38]/50 border-l-[2px] border-l-[#F59E0B] text-[13px] text-[#D1D1C7] leading-relaxed prose prose-invert prose-p:my-1 max-w-none">
            <MathMarkdown>
              {data.summary}
            </MathMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
