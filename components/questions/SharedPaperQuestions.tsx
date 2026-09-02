"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { decodeQPPrefix, stripQPPrefix, type DecodedQPPrefix, extractGraphPrefix, stripGraphPrefix } from '@/lib/qpParser';
import { getMarksColor } from '@/lib/utils';
import { GraphDisplay } from '@/components/ui/GraphDisplay';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawQuestion {
  id: string;
  questionText: string;
  marks?: number;
}

interface DecodedQuestion extends DecodedQPPrefix {
  id: string;
  marks?: number;
}

interface PartGroup {
  groupIndex: number;
  a: DecodedQuestion | null;
  b: DecodedQuestion | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodeQuestion(q: RawQuestion): DecodedQuestion {
  const raw = q.questionText ?? '';
  const decoded = decodeQPPrefix(raw);
  if (decoded) return { ...decoded, id: q.id, marks: q.marks };
  // Legacy question (no prefix) → flat Part A
  return { text: stripQPPrefix(raw), part: 'A', groupIndex: 1, subLabel: '', id: q.id, marks: q.marks };
}

function groupByIndex(questions: DecodedQuestion[]): PartGroup[] {
  const map = new Map<number, PartGroup>();
  for (const q of questions) {
    if (!map.has(q.groupIndex)) {
      map.set(q.groupIndex, { groupIndex: q.groupIndex, a: null, b: null });
    }
    const grp = map.get(q.groupIndex)!;
    if (q.subLabel === 'b') grp.b = q;
    else grp.a = q;
  }
  return Array.from(map.values()).sort((x, y) => x.groupIndex - y.groupIndex);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuestionBlock({
  question,
  label,
}: {
  question: DecodedQuestion;
  label: string;
}) {
  const graphDef = extractGraphPrefix(question.text);
  const cleanText = stripGraphPrefix(question.text);

  return (
    <div className="flex flex-col py-4 border-b border-[#2E2E2C] last:border-0">
      <div className="flex items-start gap-4">
        <span className={`text-[13px] font-medium w-10 flex-shrink-0 mt-0.5 ${getMarksColor(question.marks as number)}`}>
          {label}
        </span>
        <p className="flex-1 text-[15px] text-[#ECECEA] leading-relaxed">{cleanText}</p>
      </div>
      {graphDef && (
        <div className="mt-4 flex justify-center bg-[#1C1C1B] rounded-lg p-3 border border-[#3A3A38] ml-14">
          <GraphDisplay graph={graphDef} width={250} height={250} />
        </div>
      )}
    </div>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-4 py-2 px-1">
      <div className="flex-1 border-t border-dashed border-[#3A3A38]" />
      <span className="text-[11px] font-semibold text-[#6C6C6A] tracking-wider">OR</span>
      <div className="flex-1 border-t border-dashed border-[#3A3A38]" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SharedPaperQuestions({ subjectId, paperId }: { subjectId: string; paperId: string }) {
  const router = useRouter();
  const [rawQuestions, setRawQuestions] = useState<RawQuestion[]>([]);
  const [paper, setPaper] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/question-papers/${paperId}/questions`);
        setPaper(data.paper);
        setRawQuestions(data.paper?.questions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [paperId]);

  // Decode once — never re-parse raw text again after this point
  const decoded = rawQuestions.map(decodeQuestion);
  const partA = decoded.filter(q => q.part === 'A');
  const partB = decoded.filter(q => q.part === 'B');
  const partC = decoded.filter(q => q.part === 'C');

  // For legacy papers that have no part info, everything lands in A
  const hasStructure = decoded.some(q => q.part !== 'A') || decoded.some(q => q.subLabel !== '');

  const renderPartA = () => {
    if (partA.length === 0) return null;
    return (
      <section>
        <h2 className="text-[12px] font-semibold text-[#6C6C6A] uppercase tracking-wider mt-8 mb-3">Part A</h2>
        <div>
          {partA.map((q, i) => (
            <QuestionBlock key={q.id} question={q} label={`Q${i + 1}`} />
          ))}
        </div>
      </section>
    );
  };

  const renderAdvancedPart = (label: string, questions: DecodedQuestion[], startQNum: number) => {
    if (questions.length === 0) return null;
    const groups = groupByIndex(questions);
    return (
      <section>
        <h2 className="text-[12px] font-semibold text-[#6C6C6A] uppercase tracking-wider mt-8 mb-3">
          Part {label}
        </h2>
        <div>
          {groups.map((grp, idx) => {
            const qNum = startQNum + idx;
            return (
              <div key={grp.groupIndex}>
                {grp.a && (
                  <QuestionBlock
                    question={grp.a}
                    label={grp.b ? `${qNum}a` : `Q${qNum}`}
                  />
                )}
                {grp.b && (
                  <>
                    <OrDivider />
                    <QuestionBlock question={grp.b} label={`${qNum}b`} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const partBStartNum = partA.length > 0 ? 11 : 1;
  const partBGroups = groupByIndex(partB);
  const partCStartNum = partBStartNum + partBGroups.length;

  const handleStudyChat = () => {
    router.push(
      `/chat/new${paperId ? `?paperId=${paperId}&subjectId=${subjectId}` : `?subjectId=${subjectId}`}`
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-24 w-full">
      {/* Header - Fixed alignment */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center mt-8 sm:mt-0 gap-2">
          <button 
            onClick={() => router.back()}
            className="p-1.5 hover:bg-[#2E2E2C] rounded-lg transition-colors"
          >
            <ChevronLeft size={18} className="text-[#8C8C8A]" />
          </button>
          <span className="text-[12px] text-[#6C6C6A]">Papers</span>
        </div>

        {/* Study button - moved to top with proper alignment */}
        {role === 'student' && (
          <button
            onClick={handleStudyChat}
            className="flex items-center mt-6 gap-2 text-[13px] font-medium text-[#1C1C1B] bg-[#ECECEA] hover:bg-white rounded-lg px-4 py-2 transition-colors duration-150 shadow-sm hover:shadow whitespace-nowrap"
          >
            <MessageSquare size={16} />
            Study in Chat
          </button>
        )}
      </div>

      {/* Paper Info */}
      <div className="mb-6">
        <h1 className="text-[18px] font-semibold text-[#ECECEA]">
          {paper?.subject?.name || 'Subject'} — {paper?.examType} {paper?.academicYear}
        </h1>
        {paper?.creator?.name && (
          <p className="text-[13px] text-[#6C6C6A] mt-1">Assigned by {paper.creator.name}</p>
        )}

        {/* Marks legend */}
        {!loading && rawQuestions.length > 0 && (
          <div className="flex items-center gap-5 mt-4 text-[12px]">
            <span className="flex items-center gap-1.5 text-[#6C6C6A]">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> ≤ 5 Marks
            </span>
            <span className="flex items-center gap-1.5 text-[#6C6C6A]">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> ≤ 10 Marks
            </span>
            <span className="flex items-center gap-1.5 text-[#6C6C6A]">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> 11+ Marks
            </span>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="mt-2">
        {loading ? (
          <div className="py-12 text-[#5A5A58] text-[14px] text-center">Loading questions...</div>
        ) : rawQuestions.length === 0 ? (
          <p className="text-[14px] text-[#6C6C6A] mt-4">No questions found.</p>
        ) : hasStructure ? (
          <>
            {renderPartA()}
            {renderAdvancedPart('B', partB, partBStartNum)}
            {renderAdvancedPart('C', partC, partCStartNum)}
          </>
        ) : (
          // Legacy flat render for papers with no structured prefix
          <div>
            {decoded.map((q, i) => (
              <QuestionBlock key={q.id} question={q} label={`Q${i + 1}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}