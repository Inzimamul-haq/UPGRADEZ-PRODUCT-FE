import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { DiagramRenderer } from '../ui/QuestionDiagram/DiagramRenderer';

interface QuestionPaperRendererProps {
  content: string;
}

interface ParsedQuestion {
  qNo: number;
  text: string;
  marks: number;
  meta: { co: string; rbt: string; po?: string };
  diagramSpec?: any;
  diagramType?: string;
  originalBlock: string;
}

export function QuestionPaperRenderer({ content }: QuestionPaperRendererProps) {
  const questions: ParsedQuestion[] = [];

  const questionRegex = /^\s*(\d+)\.\s+([\s\S]*?)\s*\(([\d\.]+)\s*Marks?\)([\s\S]*?)\[\[meta:(\{.*?\})\]\]/gmi;

  let match;
  while ((match = questionRegex.exec(content)) !== null) {
    const qNo = parseInt(match[1], 10);
    const text = match[2].trim();
    const marks = parseFloat(match[3]);
    const extraContent = match[4];
    const metaStr = match[5];

    let meta = { co: "", rbt: "", po: "" };
    try {
      const parsedMeta = JSON.parse(metaStr);
      meta = {
        co: parsedMeta.co || parsedMeta.CO || "",
        rbt: parsedMeta.rbt || parsedMeta.RBT || "",
        po: parsedMeta.po || parsedMeta.PO || ""
      };
    } catch (e) { }

    let diagramSpec = undefined;
    let diagramType = undefined;

    const DIAGRAM_PREFIX_RE = /\[\[(graph|tree|diagram|circuit|block|flowchart|architecture|network|structural|schematic|waveform|geometry):([\s\S]*?)\]\]/i;
    const diagMatch = extraContent.match(DIAGRAM_PREFIX_RE);
    if (diagMatch) {
      diagramType = diagMatch[1].toLowerCase();
      try {
        diagramSpec = JSON.parse(diagMatch[2]);
      } catch (e) { }
    }

    questions.push({
      qNo,
      text,
      marks,
      meta,
      diagramSpec,
      diagramType,
      originalBlock: match[0],
    });
  }

  // Fallback if no structured questions parsed
  if (questions.length === 0) {
    return (
      <div className="text-[14px] text-[#ECECEA] leading-relaxed max-w-none">
        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Group by marks dynamically
  const partA = questions.filter(q => q.marks === 2);
  const partB = questions.filter(q => q.marks === 13 || q.marks === 16);
  const partC = questions.filter(q => q.marks === 14 || q.marks === 15);
  const otherParts = questions.filter(q => q.marks !== 2 && q.marks !== 13 && q.marks !== 16 && q.marks !== 14 && q.marks !== 15);

  const groupQuestions = (arr: ParsedQuestion[]) => {
    const groups: { [key: number]: ParsedQuestion[] } = {};
    arr.forEach(q => {
      if (!groups[q.qNo]) groups[q.qNo] = [];
      groups[q.qNo].push(q);
    });
    return Object.values(groups);
  };

  const renderQuestionGroup = (group: ParsedQuestion[], groupIdx: number) => (
    <div key={groupIdx} className="flex flex-col py-3 border-b border-[#2E2E2C] last:border-b-0 break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      {group.map((q, qIdx) => (
        <React.Fragment key={qIdx}>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0 flex gap-2">
              <span className="text-[#ECECEA] font-medium text-[14.5px] mt-[1.5px]">{q.qNo}.</span>
              <div className="text-[#ECECEA] text-[14.5px] leading-relaxed break-words w-full prose-invert prose-p:my-0 prose-ul:my-1 prose-ol:my-1">
                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                  {q.text}
                </ReactMarkdown>

                {q.diagramSpec && (() => {
                  const diagType = q.diagramSpec.type || q.diagramSpec.format || q.diagramType || 'unknown';
                  const diagSubtype = q.diagramSpec.subtype || '';
                  return (
                    <div className="mt-5 mb-2 flex justify-start rounded-lg overflow-hidden border border-[#3A3A38] bg-[#1C1C1B] max-w-fit p-4 shadow-sm diagram-card-wrapper">
                      <DiagramRenderer type={diagType} subtype={diagSubtype} spec={q.diagramSpec} width={450} height={250} />
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right side: Clean alignment for marks & meta */}
            <div className="flex-shrink-0 flex flex-col items-end gap-1.5 text-[12px] text-[#A1A19A] tracking-wider whitespace-nowrap mt-1">
              <span className="font-medium text-[#ECECEA]">({q.marks} Marks)</span>
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase mt-0.5 opacity-80">
                {q.meta.co && <span>{q.meta.co}</span>}
                {q.meta.co && q.meta.rbt && <span>•</span>}
                {q.meta.rbt && <span>{q.meta.rbt}</span>}
              </div>
            </div>
          </div>

          {qIdx < group.length - 1 && (
            <div className="flex items-center gap-3 py-1 px-1 my-4">
              <div className="flex-1 border-t border-dashed border-[#3A3A38]" />
              <span className="text-[11px] font-semibold text-[#8C8C8A] tracking-widest">OR</span>
              <div className="flex-1 border-t border-dashed border-[#3A3A38]" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="max-w-none bg-transparent pt-2">
      {partA.length > 0 && (
        <div className="mb-10">
          <h3 className="text-center text-[16px] font-semibold text-[#ECECEA] mb-4 tracking-widest uppercase">
            Part - A
          </h3>
          <div className="flex flex-col">
            {groupQuestions(partA).map(renderQuestionGroup)}
          </div>
        </div>
      )}

      {partB.length > 0 && (
        <div className="mb-10">
          <h3 className="text-center text-[16px] font-semibold text-[#ECECEA] mb-4 tracking-widest uppercase">
            Part - B
          </h3>
          <div className="flex flex-col">
            {groupQuestions(partB).map(renderQuestionGroup)}
          </div>
        </div>
      )}

      {partC.length > 0 && (
        <div className="mb-10">
          <h3 className="text-center text-[16px] font-semibold text-[#ECECEA] mb-4 tracking-widest uppercase">
            Part - C
          </h3>
          <div className="flex flex-col">
            {groupQuestions(partC).map(renderQuestionGroup)}
          </div>
        </div>
      )}

      {otherParts.length > 0 && (
        <div className="mb-10">
          <h3 className="text-center text-[16px] font-semibold text-[#ECECEA] mb-4 tracking-widest uppercase">
            Other Questions
          </h3>
          <div className="flex flex-col">
            {groupQuestions(otherParts).map(renderQuestionGroup)}
          </div>
        </div>
      )}
    </div>
  );
}
