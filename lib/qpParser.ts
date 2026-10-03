/**
 * qpParser.ts — Frontend parser for AI-generated question paper raw text.
 *
 * This is the single authoritative place where structure (part, OR-pairing,
 * sub-labels, question numbering) is derived from the AI's raw output.
 * It runs once at save-time (in AssignModal) and the result is sent to the
 * backend where it is encoded as a [[qp:...]] prefix in questionText.
 *
 * Consumers (pdfGenerator, SharedPaperQuestions, ChatContainer) all call
 * decodeQPPrefix / stripQPPrefix — they never re-parse raw text.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StructuredQuestion {
  /** Clean question text, no numbering prefix, no trailing marks string. */
  text: string;
  /** 'A' | 'B' | 'C' */
  part: string;
  /**
   * 1-based group index within the part.
   * Part A: each question gets its own group (1, 2, 3…).
   * Part B/C: an OR-pair (a + b) shares one group index.
   */
  groupIndex: number;
  /** 'a' | 'b' | '' (empty for Part A and standalone Part B/C questions) */
  subLabel: string;
  /** Marks extracted from trailing "(N Marks)" pattern, or undefined. */
  marks?: number;
}

// ─── Prefix codec ─────────────────────────────────────────────────────────────

const QP_PREFIX_RE = /^\[\[qp:([A-C]),g:(\d+),sub:([ab]*)\]\]/;

export interface DecodedQPPrefix {
  text: string;
  part: string;
  groupIndex: number;
  subLabel: string;
}

/**
 * Strips the [[qp:...]] prefix from a stored questionText.
 * Safe to call on strings that have no prefix (returns as-is).
 */
export function stripQPPrefix(raw: string): string {
  return raw.replace(QP_PREFIX_RE, '').trim();
}

/**
 * Regex that matches the [[graph:...]] algorithm definition prefix.
 */
const GRAPH_PREFIX_RE = /\[\[graph:([\s\S]*?)\]\]\s*/i;

/**
 * Strips the [[graph:...]] prefix from a stored questionText, returning only the
 * clean display text. Safe to call on strings that have no prefix.
 */
export function stripGraphPrefix(raw: string): string {
  return raw.replace(GRAPH_PREFIX_RE, '').trim();
}

/**
 * Strips the [[meta:...]] prefix from a stored questionText, returning only the
 * clean display text.
 */
export function stripMetaPrefix(raw: string): string {
  return raw.replace(/\[\[meta:.*?\]\]/gi, '').trim();
}

/**
 * Parses the [[graph:...]] prefix into a JSON object if present.
 */
export function extractGraphPrefix(raw: string): any | null {
  const m = raw.match(GRAPH_PREFIX_RE);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[1]);
    if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parses the [[qp:...]] prefix from a stored questionText.
 * Returns null if the string has no prefix (legacy / PDF-uploaded questions).
 */
export function decodeQPPrefix(raw: string): DecodedQPPrefix | null {
  const m = raw.match(QP_PREFIX_RE);
  if (!m) return null;
  return {
    text: raw.replace(QP_PREFIX_RE, '').trim(),
    part: m[1],
    groupIndex: Number(m[2]),
    subLabel: m[3],
  };
}

/**
 * Encodes a StructuredQuestion's metadata as a [[qp:...]] prefix
 * prepended to the clean question text. Used by the backend when saving.
 */
export function encodeQPPrefix(q: StructuredQuestion): string {
  return `[[qp:${q.part},g:${q.groupIndex},sub:${q.subLabel}]]${q.text}`;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

/** Extracts a marks value from trailing "(N Marks)" or "(N)" patterns. */
function extractMarks(text: string): { cleanText: string; marks: number | undefined } {
  // Allow optional [[meta:...]] tags at the very end
  const m = text.match(/[\(\[]\s*(\d+)\s*(?:marks?)?\s*[\)\]](?:\s*\[\[meta:.*?\]\])?\s*$/i);
  if (m) {
    // We just remove the exact marks string (e.g. "(13 Marks)"), leaving the meta tag intact if it was there
    const marksStrMatch = m[0].match(/[\(\[]\s*(\d+)\s*(?:marks?)?\s*[\)\]]/i);
    const marksStr = marksStrMatch ? marksStrMatch[0] : m[0];
    const cleanText = text.replace(marksStr, '').trim();
    return { cleanText, marks: parseInt(m[1], 10) };
  }
  return { cleanText: text, marks: undefined };
}

function extractTotalMarks(text: string): number | undefined {
  let total = 0;
  let found = false;
  // Require the word 'mark(s)' or 'm' to avoid matching arbitrary numbers like '(4)' in questions
  const regex = /[\(\[]\s*(\d+)\s+(?:marks?|m)\s*[\)\]]/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    total += parseInt(match[1], 10);
    found = true;
  }
  return found ? total : undefined;
}

/**
 * Parses the AI's raw question paper text into a flat array of
 * StructuredQuestion objects, each carrying { text, part, groupIndex, subLabel, marks }.
 *
 * Handles:
 *  - Part A / Part B / Part C headers (with or without mark totals in parentheses)
 *  - Numbered lines: "1. text", "11. a) text", "b) text" (following an OR line)
 *  - OR separators on their own line
 *  - Multi-line question continuation
 *  - Inline marks "(N Marks)" stripped from text but preserved in the marks field
 *
 * Called once at save-time; must never be called at render-time.
 */
export function parseQPStructure(rawText: string): StructuredQuestion[] {
  const results: StructuredQuestion[] = [];

  let currentPart = 'A';
  let seenExplicitPartHeader = false;
  let partAGroupCounter = 0;
  let partBCGroupCounter = 0;

  // Buffer for the current question being assembled
  let bufferText = '';
  let bufferPart = 'A';
  let bufferGroupIndex = 0;
  let bufferSubLabel = '';
  let awaitingBSide = false; // true after an OR line, next question is subLabel 'b'
  let lastBSideGroup = 0;    // groupIndex of the 'a' side, reused for 'b'

  const flushBuffer = () => {
    if (!bufferText.trim()) return;
    const { cleanText, marks: endMarks } = extractMarks(bufferText.trim());
    const totalMarks = extractTotalMarks(bufferText) || endMarks;

    // Auto-transition to Part B/C if not explicit and marks indicate it
    if (!seenExplicitPartHeader) {
      let targetPart = bufferPart;
      
      if (totalMarks !== undefined) {
        if (totalMarks <= 4) targetPart = 'A';
        else if (totalMarks <= 13) targetPart = 'B';
        else targetPart = 'C';
      } else if (bufferSubLabel) {
        targetPart = 'B';
      }

      if (targetPart !== bufferPart && targetPart > bufferPart) {
        if (bufferPart === 'A') {
          partAGroupCounter = Math.max(0, partAGroupCounter - 1);
          partBCGroupCounter++;
          bufferGroupIndex = partBCGroupCounter;
        }
        currentPart = targetPart;
        bufferPart = targetPart;
      }
    }

    if (cleanText) {
      results.push({
        text: cleanText,
        part: bufferPart,
        groupIndex: bufferGroupIndex,
        subLabel: bufferSubLabel,
        marks: totalMarks, // store the aggregated total marks
      });
    }
    bufferText = '';
  };

  // Normalise: collapse Windows line-endings, split
  const lines = rawText.replace(/\r\n/g, '\n').split('\n');

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // ── Part header ──────────────────────────────────────────────────────────
    // Matches: "Part A", "Part B (2 x 13 = 26)", "**Part C**", etc.
    const partMatch = line.match(/^\*{0,2}Part\s+([ABC])(?:\s*[\(\-–].*)?$/i);
    if (partMatch) {
      flushBuffer();
      currentPart = partMatch[1].toUpperCase();
      seenExplicitPartHeader = true;
      awaitingBSide = false;
      continue;
    }

    // ── Strip instructional noise lines ──────────────────────────────────────
    if (
      /^Section\s+[A-Z]/i.test(line) ||
      /answer\s+(all|any|the\s+following)/i.test(line) ||
      /^Note:/i.test(line) ||
      /^Marks:/i.test(line) ||
      /^={3,}/.test(line) ||
      /^\*{3,}/.test(line) ||
      /swap or modify any other questions/i.test(line) ||
      /feel free to/i.test(line) ||
      /let me know/i.test(line)
    ) {
      continue;
    }

    // ── OR separator ─────────────────────────────────────────────────────────
    if (/^OR$/i.test(line)) {
      flushBuffer();
      awaitingBSide = true;
      lastBSideGroup = partBCGroupCounter; // will be reused for the 'b' question
      continue;
    }

    // ── Numbered question line: "11. a) text" or "1. text" ───────────────────
    // Regex: mandatory closing parenthesis for sub-labels to prevent false matches like "Briefly" -> "B"
    const numberedMatch = line.match(/^(\d+)\.\s*(?:([ab])\)\s*)?(.+)/i);
    if (numberedMatch) {
      flushBuffer();
      awaitingBSide = false;
      const subLabelRaw = (numberedMatch[2] || '').toLowerCase();

      if (currentPart === 'A') {
        partAGroupCounter++;
        bufferPart = 'A';
        bufferGroupIndex = partAGroupCounter;
        bufferSubLabel = '';
        bufferText = numberedMatch[3];
      } else {
        // Part B or C
        if (subLabelRaw === 'a' || (!subLabelRaw && !awaitingBSide)) {
          // Start of a new question group
          partBCGroupCounter++;
          bufferPart = currentPart;
          bufferGroupIndex = partBCGroupCounter;
          bufferSubLabel = subLabelRaw || '';
          bufferText = numberedMatch[3];
        } else if (subLabelRaw === 'b') {
          // Inline b) — shares groupIndex with the preceding a)
          bufferPart = currentPart;
          bufferGroupIndex = partBCGroupCounter;
          bufferSubLabel = 'b';
          bufferText = numberedMatch[3];
        } else {
          // No sub-label, standalone
          partBCGroupCounter++;
          bufferPart = currentPart;
          bufferGroupIndex = partBCGroupCounter;
          bufferSubLabel = '';
          bufferText = numberedMatch[3];
        }
      }
      continue;
    }

    // ── Unlabelled "b)" continuation after OR ────────────────────────────────
    // Matches: "b) text" at the start of a line (no leading number)
    const bSideMatch = line.match(/^b\)\s*(.+)/i);
    if (bSideMatch && awaitingBSide) {
      flushBuffer();
      bufferPart = currentPart;
      bufferGroupIndex = lastBSideGroup;
      bufferSubLabel = 'b';
      bufferText = bSideMatch[1];
      awaitingBSide = false;
      continue;
    }

    // ── Continuation line ────────────────────────────────────────────────────
    if (bufferText) {
      bufferText += '\n' + line;
    }
    // (If bufferText is empty and nothing matched, the line is noise — skip it)
  }

  // Flush the final question
  flushBuffer();

  // Filter out empty entries
  return results.filter(q => q.text.trim().length > 0);
}
