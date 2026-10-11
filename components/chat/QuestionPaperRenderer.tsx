import React from 'react';
import { MathMarkdown } from '../ui/MathMarkdown';
import { DiagramRenderer } from '../ui/QuestionDiagram/DiagramRenderer';
import { extractDiagramTag } from '../ui/layoutUtils';

interface QuestionPaperRendererProps {
  content: string;
}

interface ParsedQuestion {
  qNo: number;  
  text: string;
  marks: number;
  meta: { co: string; rbt: string; po?: string; part?: string };
  diagramSpec?: any;
  diagramType?: string;
  originalBlock: string;
}

export function QuestionPaperRenderer({ content }: QuestionPaperRendererProps) {
  const questions: ParsedQuestion[] = [];

  const questionRegex = /^\s*(\d+)\.\s+([\s\S]*?)\[\[meta:(\{.*?\})\]\]/gmi;

  let match;
  while ((match = questionRegex.exec(content)) !== null) {
    const qNo = parseInt(match[1], 10);
    let body = match[2];
    const metaStr = match[3];

    let meta = { co: "", rbt: "", po: "", part: "" };
    try {
      const parsedMeta = JSON.parse(metaStr);
      meta = {
        co: parsedMeta.co || parsedMeta.CO || "",
        rbt: parsedMeta.rbt || parsedMeta.RBT || "",
        po: parsedMeta.po || parsedMeta.PO || "",
        part: parsedMeta.part || parsedMeta.Part || ""
      };
    } catch (e) { }

    if (!meta.part && match) {
      const contentBefore = content.substring(0, match.index);
      const headerMatches = Array.from(contentBefore.matchAll(/(?:^|\n)\s*(?:#+\s*)?(?:\*{0,2})Part\s*[-–—:]?\s*([A-E])/gi));
      if (headerMatches.length > 0) {
        meta.part = `Part ${headerMatches[headerMatches.length - 1][1].toUpperCase()}`;
      }
    }

    let marks = 0;
    const marksRegex = /\(([\d\.]+)\s*Marks?\)/i;
    const marksMatch = body.match(marksRegex);
    if (marksMatch) {
      marks = parseFloat(marksMatch[1]);
      body = body.replace(marksMatch[0], '');
    }

    let diagramSpec = undefined;
    let diagramType = undefined;
    const diagMatch = extractDiagramTag(body, 0);
    if (diagMatch) {
      diagramType = diagMatch.type.toLowerCase();
      try {
        diagramSpec = JSON.parse(diagMatch.json);
      } catch (e) { }
      body = body.substring(0, diagMatch.startIndex) + body.substring(diagMatch.endIndex);
    }

    const text = body.trim();

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
        <MathMarkdown>
          {content}
        </MathMarkdown>
      </div>
    );
  }

  // Group by authoritative part (meta/header), with safe fallback
  const getPartLetter = (q: ParsedQuestion): 'A' | 'B' | 'C' | 'other' => {
    const p = (q.meta?.part || '').trim();
    const pMatch = p.match(/Part\s*[-–—:]?\s*([A-E])/i) || p.match(/^([A-E])$/i);
    if (pMatch) {
      const letter = pMatch[1].toUpperCase();
      if (letter === 'A') return 'A';
      if (letter === 'B') return 'B';
      if (letter === 'C') return 'C';
      return 'other';
    }
    if (q.marks === 1 || q.marks === 2) return 'A';
    return 'other';
  };

  const partA = questions.filter(q => getPartLetter(q) === 'A');
  const partB = questions.filter(q => getPartLetter(q) === 'B');
  const partC = questions.filter(q => getPartLetter(q) === 'C');
  const otherParts = questions.filter(q => getPartLetter(q) === 'other');

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
              <div className="text-[#ECECEA] text-[14.5px] qp-question-text break-words w-full prose-invert prose-p:my-0 prose-ul:my-1 prose-ol:my-1">
                <MathMarkdown>
                  {q.text}
                </MathMarkdown>

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
