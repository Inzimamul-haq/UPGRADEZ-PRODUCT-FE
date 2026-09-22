import { decodeQPPrefix, stripQPPrefix, type DecodedQPPrefix } from './qpParser';

export type DecodedQuestion = DecodedQPPrefix & { 
  id?: string;
  marks?: number;
  diagramSpec?: any;
  diagramType?: string;
  meta?: { co: string; rbt: string; po?: string };
};

/** Decode a raw DB questionText into structured metadata + clean text. */
export function toDecoded(q: any): DecodedQuestion {
  const raw: string = q.questionText ?? q.text ?? '';
  let decoded = decodeQPPrefix(raw);
  
  if (!decoded) {
    // Legacy / PDF-uploaded question: no prefix → treat as flat Part A
    decoded = { text: stripQPPrefix(raw), part: 'A', groupIndex: 1, subLabel: '' };
  }

  const DIAGRAM_PREFIX_RE = /\[\[(graph|tree|diagram|circuit|block|flowchart|architecture|network|structural|schematic|waveform|geometry|mech_structural|engineering_drawing|linked_list|doubly_linked_list|logic_gate|free_body|table):([\s\S]*?)\]\]/i;
  const diagMatch = decoded.text.match(DIAGRAM_PREFIX_RE);
  let diagramSpec = undefined;
  let diagramType = undefined;

  if (diagMatch) {
    diagramType = diagMatch[1].toLowerCase();
    try {
      diagramSpec = JSON.parse(diagMatch[2]);
    } catch (e) {}
  }

  let meta = q.co || q.rbt || q.po 
    ? { co: q.co || '', rbt: q.rbt || '', po: q.po || '' } 
    : undefined;

  if (!meta) {
    const META_PREFIX_RE = /\[\[meta:(\{.*?\})\]\]/i;
    const metaMatch = decoded.text.match(META_PREFIX_RE);
    if (metaMatch) {
      try {
        const parsed = JSON.parse(metaMatch[1]);
        meta = {
          co: parsed.co || parsed.CO || '',
          rbt: parsed.rbt || parsed.RBT || '',
          po: parsed.po || parsed.PO || ''
        };
      } catch (e) {}
    }
  }

  // Extract the true marks from the text before we strip it, in case the DB has a corrupted sum (e.g. 28 instead of 15)
  let displayMarks = q.marks;
  const trueMarksMatch = decoded.text.match(/[\(\[]\s*(\d+)\s*marks?\s*[\)\]](?:\s*\[\[(?:meta|diagram|graph|flagged).*?\]\])*\s*$/i);
  if (trueMarksMatch) {
    displayMarks = parseInt(trueMarksMatch[1], 10);
  }

  // Also strip the meta prefix from text if it exists
  let cleanText = decoded.text
    .replace(/\[\[meta:(\{.*?\})\]\]/gi, '')
    .replace(/\[\[(?:graph|tree|diagram|circuit|block|flowchart|architecture|network|structural|schematic|waveform|geometry|mech_structural|engineering_drawing|linked_list|doubly_linked_list|logic_gate|free_body|table):([\s\S]*?)\]\]/gi, '')
    .replace(/\[\[flagged:.*?\]\]/gi, '')
    .replace(/\(\s*\d+\s*marks?\s*\)\s*$/i, '')
    .replace(/\[\s*\d+\s*marks?\s*\]\s*$/i, '')
    .trim();

  decoded.text = cleanText;

  return { ...decoded, id: q.id, marks: displayMarks, diagramSpec, diagramType, meta };
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
