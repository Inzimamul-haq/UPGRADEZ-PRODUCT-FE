export interface MathExecutionLine {
  content: string;
  isImplies: boolean;
}

// ── Defensive repair for corrupted LaTeX macro escapes ──────────────────────
// If a raw "\<letter>..." LaTeX macro ever slips into a JSON string value
// unescaped, JSON.parse silently interprets the JSON-reserved escape
// letters ("n" "t" "r" "b" "f") as control characters, destroying the
// backslash and the first letter with no parse error — e.g. "\neq" becomes
// an actual newline followed by the literal text "eq".
//
// This is a best-effort, read-time repair for content generated before the
// backend fix (cached/persisted answers) or any residual edge case. It only
// reconstructs a small curated list of common macros and requires the
// leftover letters to exactly match a known suffix, to avoid mangling real
// prose newlines.
const ESCAPE_CHAR_MAP: Record<string, string> = {
  '\n': 'n', '\t': 't', '\r': 'r', '\b': 'b', '\f': 'f',
};

// Keyed by the JSON escape letter; each value is the macro name with its
// first letter (the one JSON consumed) stripped off.
const MACRO_SUFFIXES: Record<string, string[]> = {
  n: ['eq', 'abla', 'otin', 'less', 'gtr', 'mid', 'parallel', 'subseteq', 'supseteq', 'subset', 'supset', 'equiv', 'Rightarrow', 'Leftarrow'],
  t: ['imes', 'herefore', 'heta', 'ext', 'riangle', 'ilde', 'anh', 'extbf', 'extit', 'au'],
  r: ['ightarrow', 'ho', 'ight', 'angle'],
  b: ['eta', 'ar', 'inom', 'oxed', 'ullet', 'ig', 'mod', 'ackslash', 'oldsymbol'],
  f: ['orall', 'rac', 'lat'],
};

export function repairCorruptedMacroEscapes(text: string): string {
  if (!text) return text;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const escChar = ESCAPE_CHAR_MAP[ch];
    if (!escChar) { out += ch; continue; }

    const rest = text.slice(i + 1);
    const letterRun = rest.match(/^[a-zA-Z]+/)?.[0] ?? '';
    const suffixes = MACRO_SUFFIXES[escChar] ?? [];
    // Longest match wins (e.g. prefer "ightarrow" over any shorter overlap)
    const match = suffixes
      .filter(sfx => letterRun.startsWith(sfx))
      .sort((a, b) => b.length - a.length)[0];

    if (match) {
      out += '\\' + escChar + match;
      i += match.length; // skip the consumed letters
    } else {
      out += ch; // not a recognized macro — leave the control char alone
    }
  }
  return out;
}

/**
 * Returns true when the string looks like programming code rather than a
 * LaTeX/math expression. Used to short-circuit the KaTeX rendering path
 * and fall back to a <pre><code> display instead.
 */
export function isCodeContent(text: string): boolean {
  if (!text || text.trim().length === 0) return false;

  // Fenced code block markers
  if (/^```/.test(text.trim())) return true;

  // HTML / XML tags  e.g.  <!DOCTYPE  <html  <div  </body>
  if (/<[!/a-zA-Z][^>]{0,80}>/.test(text)) return true;

  // Literal \n escape sequences inside the string (not actual newline chars)
  // LLMs often write  \n<head>...  in code equations
  if (/\\n/.test(text)) return true;

  // Escaped quotes that appear in HTML attributes:  \"stylesheet\"
  if (/\\"/. test(text)) return true;

  // Programming language keywords that would never appear in a math formula
  if (/\b(function|class|const|let|var|import|export|return|if\s*\(|for\s*\(|while\s*\(|def |public |private |static |void |int |String |#include|printf|scanf|System\.out|cout|cin)\b/.test(text)) return true;

  // CSS property patterns:  property: value;  or  selector { ... }
  if (/[a-z-]{2,}:\s*[a-z#0-9"'(]{1,}/.test(text) && text.includes(';')) return true;

  // URL-like content
  if (/https?:\/\/|www\./.test(text)) return true;

  return false;
}

/**
 * Returns true when the string is likely a plain English sentence or phrase,
 * rather than a math expression. Used to prevent KaTeX from eating spaces
 * and rendering text as cursive math variables.
 */
export function isPlainText(text: string): boolean {
  if (!text || text.trim().length === 0) return false;

  // If it contains LaTeX macros (e.g. \frac, \text, \implies)
  if (/\\[a-zA-Z]+/.test(text)) return false;

  // If it contains typical math operators (equal, plus, asterisk, caret, etc)
  if (/[=\+\*\^\_\{\}\<\>\|]/.test(text)) return false;

  // If it has a sequence of 3 normal words (length 2+), it's almost certainly a sentence
  if (/\b[a-zA-Z]{2,}\s+[a-zA-Z]{2,}\s+[a-zA-Z]{2,}\b/.test(text)) return true;

  // If it has spaces but no math symbols at all
  if (/\s/.test(text) && !/[+\-*/=<>^_{}\\]/.test(text)) return true;

  return false;
}

export function parseMathLines(raw: string): MathExecutionLine[] {
  if (!raw) return [];
  raw = repairCorruptedMacroEscapes(raw);

  // Normalize line-break artifacts BEFORE splitting:
  // - a real LaTeX line break "\\" right before a newline/end -> becomes an actual \n
  // - a stray single trailing "\" (not a real LaTeX command) -> strip it so it
  //   can't glue onto the next segment (this was the "m = 2.4\" + "mm" -> "mmmm" bug)
  const normalized = raw
  // "\<newline>unit" where "unit" is a short unit token (mm, cm, m, kg, N, Ω, °C...)
  // -> not a real line break, just glue it back: "2.4\<nl>mm" -> "2.4 mm"
  // (this is what was producing the "mmmm" orphan-line duplication)
  .replace(/\\\s*\n\s*([a-zA-Zµ°Ω]{1,4})\b/g, ' $1')
  // real LaTeX line break "\\" before newline/end -> actual newline
  .replace(/\\\\(?=\s*\n|\s*$)/g, '\n')
  // any remaining stray single trailing backslash -> strip
  .replace(/\\(?=\s*\n|\s*$)/g, '');

  // Added '=' to the delimiter set so chained computations break into steps.
  const tokens = normalized.split(/(\\implies|\\Rightarrow|⇒|;|\n|,|:|=)/g);

  const lines: MathExecutionLine[] = [];
  let currentContent = '';
  let currentIsImplies = false;
  let envDepth = 0;
  let parenDepth = 0;
  let equalsSeenAtTopLevel = 0; // keep "lhs = firstStep" together, break on every '=' after that

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    const begins = (token.match(/\\begin\{[^}]+\}/g) || []).length;
    const ends = (token.match(/\\end\{[^}]+\}/g) || []).length;
    envDepth += (begins - ends);
    if (envDepth < 0) envDepth = 0;

    const openParens = (token.match(/[\(\[\{]/g) || []).length;
    const closeParens = (token.match(/[\)\]\}]/g) || []).length;
    parenDepth += (openParens - closeParens);
    if (parenDepth < 0) parenDepth = 0;

    const isEquals = token === '=' && envDepth === 0 && parenDepth === 0;

    if (isEquals) {
      equalsSeenAtTopLevel++;
      if (equalsSeenAtTopLevel === 1) {
        currentContent += token; // "x1 = ..." stays on one line
        continue;
      }
      if (currentContent.trim()) {
        lines.push({ content: currentContent.trim(), isImplies: currentIsImplies });
      }
      currentContent = '= '; // continuation lines keep the '=' for readability
      currentIsImplies = false;
      continue;
    }

    const isDelimiter = token.match(/^(\\implies|\\Rightarrow|⇒|;|\n|,|:)$/);
    if (isDelimiter && envDepth === 0 && parenDepth === 0) {
      if (currentContent.trim()) {
        lines.push({ content: currentContent.trim(), isImplies: currentIsImplies });
        currentContent = '';
      }
      currentIsImplies = token === '\\implies' || token === '\\Rightarrow' || token === '⇒';
    } else {
      currentContent += token;
    }
  }

  if (currentContent.trim()) {
    lines.push({ content: currentContent.trim(), isImplies: currentIsImplies });
  }

  // After building `lines`, merge a short unit-only line (e.g. "mm", "m", "cm", "N", "kg")
  // into the previous line instead of leaving it as its own centered block.
  const UNIT_ONLY = /^[a-zA-Zµ°Ω]{1,4}$/;
  const merged: MathExecutionLine[] = [];
  for (const line of lines) {
    if (merged.length > 0 && UNIT_ONLY.test(line.content)) {
      merged[merged.length - 1].content += ' \\, ' + line.content;
    } else {
      merged.push(line);
    }
  }
  return merged;
}

export function ensureBoxedIsMath(text: string): string {
  if (!text) return text;
  text = repairCorruptedMacroEscapes(text);
  // If \boxed is already inside math delimiters (naive check), ignore
  if (text.includes('$\\boxed') || text.includes('$$\\boxed')) {
    return text;
  }
  
  const idx = text.indexOf('\\boxed{');
  if (idx === -1) return text;
  
  let openCount = 0;
  let closeIdx = -1;
  for (let i = idx; i < text.length; i++) {
    if (text[i] === '{') openCount++;
    if (text[i] === '}') {
      openCount--;
      if (openCount === 0) {
        closeIdx = i;
        break;
      }
    }
  }
  
  if (closeIdx !== -1) {
    const before = text.substring(0, idx);
    const boxed = text.substring(idx, closeIdx + 1);
    const after = text.substring(closeIdx + 1);
    return before + '$$' + boxed + '$$' + ensureBoxedIsMath(after);
  }
  
  return text;
}

/**
 * Intelligently wraps English text words inside math mode with \text{} so KaTeX renders them correctly with spacing.
 */
export function formatMixedMath(content: string, isBlock: boolean = false): string {
  if (!content) return '';
  content = repairCorruptedMacroEscapes(content);
  if (content.includes('$') || content.includes('\\[') || content.includes('\\(')) {
    return isBlock ? (content.startsWith('$$') ? content : `$$${content}$$`) : (content.startsWith('$') ? content : `$${content}$`);
  }
  
  if (isCodeContent(content)) {
    return content;
  }

  let mathStr = content.replace(/(?<!\\)\b(?!sin\b|cos\b|tan\b|log\b|ln\b|exp\b|lim\b|max\b|min\b|dx\b|dy\b|dt\b|du\b|dv\b|dw\b|dz\b)[a-zA-Z]{2,}\b/g, '\\text{$&}');
  mathStr = mathStr.replace(/ /g, '\\ ');

  return isBlock ? `$$${mathStr}$$` : `$${mathStr}$`;
}