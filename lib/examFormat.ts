import { decodeQPPrefix, stripQPPrefix, type DecodedQPPrefix } from './qpParser';

export type DecodedQuestion = DecodedQPPrefix & {
  id?: string;
  marks?: number;
  diagramSpec?: any;
  diagramType?: string;
  meta?: { co: string; rbt: string; po?: string; correctIndex?: number };
  stem?: string;
  options?: string[];
};

/** Helper to parse MCQ options from question body. */
export function parseStemAndOptions(text: string): { stem: string; options: string[] } {
  const lines = text.split('\n');
  const optionRegex = /^[A-Da-d][\.\)]\s+(.*)$/;
  const options: string[] = [];
  const stemLines: string[] = [];
  let inOptions = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(optionRegex);
    if (match) {
      inOptions = true;
      options.push(match[1].trim());
    } else if (!inOptions) {
      stemLines.push(line);
    } else {
      // Continuation of last option if any
      if (options.length > 0 && trimmed) {
        options[options.length - 1] += ' ' + trimmed;
      }
    }
  }

  return {
    stem: stemLines.join('\n').trim(),
    options,
  };
}

/** Decode a raw DB questionText into structured metadata + clean text. */
export function toDecoded(q: any): DecodedQuestion {
  const raw: string = q.questionText ?? q.text ?? '';
  let decoded = decodeQPPrefix(raw);

  if (!decoded) {
    // Legacy / PDF-uploaded question: no prefix → treat as flat Part A
    decoded = { text: stripQPPrefix(raw), part: 'A', groupIndex: 1, subLabel: '' };
  }

  const DIAGRAM_PREFIX_RE = /\[\[(graph|tree|diagram|circuit|block|flowchart|architecture|network|structural|schematic|waveform|geometry):([\s\S]*?)\]\]/i;
  const diagMatch = decoded.text.match(DIAGRAM_PREFIX_RE);
  let diagramSpec = undefined;
  let diagramType = undefined;

  if (diagMatch) {
    diagramType = diagMatch[1].toLowerCase();
    try {
      diagramSpec = JSON.parse(diagMatch[2]);
    } catch (e) { }
  }

  let meta: { co: string; rbt: string; po?: string; correctIndex?: number } | undefined = undefined;

  const META_PREFIX_RE = /\[\[meta:(\{.*?\})\]\]/i;
  const metaMatch = decoded.text.match(META_PREFIX_RE);
  if (metaMatch) {
    try {
      const parsed = JSON.parse(metaMatch[1]);
      meta = {
        co: parsed.co || parsed.CO || '',
        rbt: parsed.rbt || parsed.RBT || '',
        po: parsed.po || parsed.PO || '',
        correctIndex: typeof parsed.correctIndex === 'number' ? parsed.correctIndex : undefined,
      };
    } catch (e) { }
  }

  if (!meta && (q.co || q.rbt || q.po)) {
    meta = { co: q.co || '', rbt: q.rbt || '', po: q.po || '' };
  }

  // 1. Fallback or override correctIndex from plain Answer: line if present
  const answerLineMatch = decoded.text.match(/(?:^|\n)\s*(?:\*\*)?Answer:\s*(?:\*\*)?\s*([A-Da-d0-9\)])[^\n]*/i);
  if (answerLineMatch) {
    const rawLetter = answerLineMatch[1].replace(/[\)\.]/g, '').toUpperCase();
    const charCode = rawLetter.charCodeAt(0);
    let resolvedIndex: number | undefined = undefined;
    if (charCode >= 65 && charCode <= 90) {
      resolvedIndex = charCode - 65;
    } else if (!isNaN(parseInt(rawLetter, 10))) {
      const numVal = parseInt(rawLetter, 10);
      if (numVal >= 1 && numVal <= 10) resolvedIndex = numVal - 1;
    }
    if (resolvedIndex !== undefined) {
      meta = { ...(meta || { co: '', rbt: '' }), correctIndex: resolvedIndex };
    }
  }

  // Extract the true marks from the text before we strip it, in case the DB has a corrupted sum (e.g. 28 instead of 15)
  let displayMarks = q.marks;
  const trueMarksMatch = decoded.text.match(/[\(\[]\s*(\d+)\s*marks?\s*[\)\]](?:\s*\[\[(?:meta|diagram|graph|flagged).*?\]\])*\s*$/i);
  if (trueMarksMatch) {
    displayMarks = parseInt(trueMarksMatch[1], 10);
  }

  // Also strip the meta prefix, comments, and Answer line from text if they exist
  let cleanText = decoded.text
    .replace(/<!--QMETA[\s\S]*?-->/gi, '')
    .replace(/\[\[meta:(\{.*?\})\]\]/gi, '')
    .replace(/\[\[(?:graph|tree|diagram|circuit|block|flowchart|architecture|network|structural|schematic|waveform|geometry):([\s\S]*?)\]\]/gi, '')
    .replace(/\[\[flagged:.*?\]\]/gi, '')
    .replace(/(?:^|\n)\s*(?:\*\*)?Answer:\s*[^\n]*/gi, '')
    .replace(/[\s#*]*Part\s+[A-E]\b[^\n]{0,30}?marks?\.?[\s*]*/gi, '')
    .replace(/^\s*\**OR\**\s*$/gim, '')
    // Strip leaked instructional noise lines such as "Answer all the questions"
    .replace(/(?:^|\n)\s*(?:\*{1,2}|_{1,2})?\s*(?:\(?\s*)?Answer\s+(?:all|any|the\s+following|either)[^\n]*?(?:\s*\)?)?(?:\*{1,2}|_{1,2})?\s*(?:\n|$)/gi, '\n')
    // Strip trailing marks only at line boundaries so we never swallow subsequent newlines/options
    .replace(/[\(\[]\s*\d+\s*marks?\s*[\)\]]\s*$/gim, '')
    .trim();

  const { stem, options } = parseStemAndOptions(cleanText);

  decoded.text = cleanText;

  return {
    ...decoded,
    id: q.id,
    marks: displayMarks,
    diagramSpec,
    diagramType,
    meta,
    stem,
    options: options.length > 0 ? options : undefined,
  };
}

export interface GroupedQuestion {
  groupIndex: number;
  a: DecodedQuestion | null;
  b: DecodedQuestion | null;
}

/** Group Part B/C questions by groupIndex so OR-pairs render together. */
export function groupByIndex(questions: DecodedQuestion[]): GroupedQuestion[] {
  const map = new Map<number, GroupedQuestion>();
  for (const q of questions) {
    if (!map.has(q.groupIndex)) {
      map.set(q.groupIndex, { groupIndex: q.groupIndex, a: null, b: null });
    }
    const grp = map.get(q.groupIndex)!;
    if (q.subLabel === 'b') grp.b = q;
    else grp.a = q; // '' or 'a' both slot as the "a" side
  }
  return Array.from(map.values()).sort((x, y) => x.groupIndex - y.groupIndex);
}

/** Build marks formula string for the part header. */
export const formatPartMarks = (qs: DecodedQuestion[], defaultFormula: string) => {
  if (!qs || qs.length === 0) return defaultFormula;
  const groups = groupByIndex(qs);
  const numGroups = groups.length;
  const marksPerQ = qs[0]?.marks;
  if (marksPerQ && numGroups > 0) {
    return `${numGroups} x ${marksPerQ} = ${numGroups * marksPerQ}`;
  }
  return defaultFormula;
};
