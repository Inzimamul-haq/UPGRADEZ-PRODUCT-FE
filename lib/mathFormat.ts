export interface MathExecutionLine {
  content: string;
  isImplies: boolean;
}

// ── Defensive repair for LaTeX macros eaten by JSON escapes ─────────────────
const ESCAPE_CHAR_MAP: Record<string, string> = {
  '\n': 'n', '\t': 't', '\r': 'r', '\b': 'b', '\f': 'f',
};
const PROSE_SAFE = new Set(['b', 'f']);

const MACRO_SUFFIXES: Record<string, string[]> = {
  n: ['e', 'u', 'eq', 'abla', 'otin', 'less', 'gtr', 'mid', 'parallel', 'subseteq', 'supseteq', 'subset', 'supset', 'equiv', 'Rightarrow', 'Leftarrow', 'leq', 'geq', 'rightarrow'],
  t: ['o', 'an', 'au', 'anh', 'imes', 'herefore', 'heta', 'ext', 'extbf', 'extit', 'extrm', 'extsf', 'riangle', 'ilde', 'frac'],
  r: ['ho', 'ight', 'angle', 'floor', 'ceil', 'ightarrow', 'ightleftharpoons'],
  b: ['eta', 'ar', 'inom', 'oxed', 'ullet', 'ig', 'igg', 'mod', 'ackslash', 'oldsymbol', 'ecause', 'egin', 'ot'],
  f: ['rac', 'orall', 'lat'],
};

export function repairCorruptedMacroEscapes(text: string, scope: 'math' | 'prose' = 'math'): string {
  if (!text) return text;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const esc = ESCAPE_CHAR_MAP[ch];
    if (!esc || (scope === 'prose' && !PROSE_SAFE.has(esc))) { out += ch; continue; }

    const letterRun = text.slice(i + 1, i + 25).match(/^[a-zA-Z]+/)?.[0] ?? '';
    const suffixes = MACRO_SUFFIXES[esc] ?? [];
    let match: string | undefined;
    if (PROSE_SAFE.has(esc)) {
      match = suffixes.filter(s => letterRun.startsWith(s)).sort((a, b) => b.length - a.length)[0];
    } else {
      match = suffixes.includes(letterRun) ? letterRun : undefined;
    }
    if (match) { out += '\\' + esc + match; i += match.length; }
    else out += ch;
  }
  return out;
}

const MATH_SEGMENT_RE = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g;

export function repairMathSegments(text: string): string {
  if (!text) return text;
  return text.split(MATH_SEGMENT_RE).map((part, i) =>
    repairCorruptedMacroEscapes(part, i % 2 ? 'math' : 'prose')
  ).join('');
}

export function normalizeDelimiters(t: string): string {
  if (!t) return t;
  return t
    .replace(/(^|[^\\])\\\[([\s\S]+?)\\\]/g, (_, p, m) => `${p}\n\n$$\n${m.trim()}\n$$\n\n`)
    .replace(/(^|[^\\])\\\(([\s\S]+?)\\\)/g, (_, p, m) => `${p}$${m.trim()}$`);
}

export function toBareLatex(s: string): string {
  if (!s) return '';
  let t = repairCorruptedMacroEscapes(s.trim(), 'math');
  t = t.replace(/^\$\$([\s\S]*)\$\$$/, '$1')
       .replace(/^\$([\s\S]*)\$$/, '$1')
       .replace(/^\\\[([\s\S]*)\\\]$/, '$1')
       .replace(/^\\\(([\s\S]*)\\\)$/, '$1');
  return t.trim();
}

export function isCodeContent(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const t = text.trim();

  if (/^```/.test(t)) return true;

  if (/<\/?(?:html|head|body|div|span|script|style|link|meta|a|br|img|table|tr|td|th|ul|ol|li|input|form|button|h[1-6])(?:\s+[\w-]+\s*=|\s*\/?>)|<\/?p>|<!DOCTYPE/i.test(t)) return true;

  if (/\\n(?![a-zA-Z])/.test(t)) return true;

  if (/\\"/.test(t)) return true;

  if (/#include|System\.out|console\.log|printf\s*\(|scanf\s*\(|\bdef\s+\w+\s*\(|\bfunction\s*\w*\s*\(|\b(?:public|private)\s+(?:static\s+)?\w+|\bclass\s+\w+\s*[{:(]|^import\s+[\w.{*]+/m.test(t)) return true;

  if (/[\w.#-]+\s*\{[^}]*:[^}]*;[^}]*\}/.test(t)) return true;

  if (/https?:\/\/|www\./.test(t)) return true;

  return false;
}

export function isMarkdownTable(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  return /\|[\s]*[-:]+[\s]*\|/.test(text);
}

export function isPlainText(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  if (isMarkdownTable(text)) return true;
  if (/\\[a-zA-Z]+/.test(text)) return false;
  if (/[=\+\*\^\_\{\}\<\>\|]/.test(text)) return false;
  if (/\b[a-zA-Z]{2,}\s+[a-zA-Z]{2,}\s+[a-zA-Z]{2,}\b/.test(text)) return true;
  if (/\s/.test(text) && !/[+\-*/=<>^_{}\\]/.test(text)) return true;
  return false;
}

export function parseMathLines(raw: string): MathExecutionLine[] {
  if (!raw) return [];
  raw = repairCorruptedMacroEscapes(raw, 'math');

  const hasEnv = /\\begin\{/.test(raw);

  let normalized = raw;
  if (!hasEnv) {
    normalized = normalized
      .replace(/\\\s*\n\s*([a-zA-Zµ°Ω]{1,4})\b/g, ' $1')
      .replace(/\\\\(?=\s*\n|\s*$)/g, '\n')
      .replace(/\\(?=\s*\n|\s*$)/g, '');
  }

  normalized = normalized.replace(/(\d),(?=\d)/g, '$1{,}');

  const tokens = normalized.split(/(\\implies|\\Rightarrow|⇒|;|\n|,|:|=)/g);

  const lines: MathExecutionLine[] = [];
  let currentContent = '';
  let currentIsImplies = false;
  let envDepth = 0;
  let parenDepth = 0;
  let equalsSeenAtTopLevel = 0;

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
      if (equalsSeenAtTopLevel === 1) { currentContent += token; continue; }
      if (currentContent.trim()) lines.push({ content: currentContent.trim(), isImplies: currentIsImplies });
      currentContent = '= ';
      currentIsImplies = false;
      continue;
    }

    const isDelimiter = /^(\\implies|\\Rightarrow|⇒|;|\n|,|:)$/.test(token);
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

  if (currentContent.trim()) lines.push({ content: currentContent.trim(), isImplies: currentIsImplies });

  const UNIT_ONLY = /^[a-zA-Zµ°Ω]{1,4}$/;
  const merged: MathExecutionLine[] = [];
  for (const line of lines) {
    if (merged.length > 0 && UNIT_ONLY.test(line.content)) {
      merged[merged.length - 1].content += ' \\, \\mathrm{' + line.content + '}';
    } else {
      merged.push(line);
    }
  }
  return merged;
}

export function ensureBoxedIsMath(text: string): string {
  if (!text) return text;
  text = repairCorruptedMacroEscapes(text, 'prose');
  if (text.includes('$\\boxed') || text.includes('$$\\boxed')) return text;

  const idx = text.indexOf('\\boxed{');
  if (idx === -1) return text;

  let openCount = 0;
  let closeIdx = -1;
  for (let i = idx; i < text.length; i++) {
    if (text[i] === '{') openCount++;
    if (text[i] === '}') {
      openCount--;
      if (openCount === 0) { closeIdx = i; break; }
    }
  }

  if (closeIdx !== -1) {
    const before = text.substring(0, idx);
    const boxed = text.substring(idx, closeIdx + 1);
    const innerContent = text.substring(idx + 7, closeIdx);
    const after = text.substring(closeIdx + 1);

    if (isMarkdownTable(innerContent) || isPlainText(innerContent) || isCodeContent(innerContent)) {
      return before + '\n\n' + innerContent + '\n\n' + ensureBoxedIsMath(after);
    }
    return before + '$$' + boxed + '$$' + ensureBoxedIsMath(after);
  }
  return text;
}

const KNOWN_MATH_WORDS = new Set([
  'sin','cos','tan','cot','sec','csc','sinh','cosh','tanh','arcsin','arccos','arctan',
  'log','ln','exp','lim','max','min','sup','inf','det','dim','gcd','mod','arg','deg','ker',
  'dx','dy','dz','dt','du','dv','dw',
]);

const MIXED_TOKEN_RE = new RegExp(
  [
    String.raw`\\(?:begin|end)\{[^}]*\}`,
    String.raw`\\(?:text|textbf|textit|textrm|textsf|mathrm|mathbf|mathit|mathtt|mathbb|mathcal|mathsf|operatorname)\{[^{}]*\}`,
    String.raw`\\[a-zA-Z]+`,
    String.raw`[A-Za-z0-9_]+`,
  ].join('|'),
  'g'
);

export function formatMixedMath(content: string, isBlock: boolean = false): string {
  if (!content) return '';
  content = repairCorruptedMacroEscapes(content, 'math');

  if (content.includes('$')) return content;
  if (content.includes('\\[') || content.includes('\\(')) return normalizeDelimiters(content);

  if (isCodeContent(content)) return content;

  let hadText = false;
  let mathStr = content.replace(MIXED_TOKEN_RE, (m) => {
    if (m.startsWith('\\')) return m;
    if (/^[A-Za-z]{2,}$/.test(m) && !KNOWN_MATH_WORDS.has(m)) { hadText = true; return `\\text{${m}}`; }
    return m;
  });

  if (hadText) {
    mathStr = mathStr.split(/(\\text\{[^{}]*\}|\\(?:begin|end)\{[^}]*\})/g)
      .map((p, i) => (i % 2 ? p : p.replace(/ /g, '\\ ')))
      .join('');
  }

  return isBlock ? `$$${mathStr}$$` : `$${mathStr}$`;
}

export function fixFlattenedMarkdown(text: string): string {
  if (!text) return text;
  if (/\|[\s]*[-:]+[\s]*\|/.test(text)) {
    const fixed = text.replace(/\|\|/g, '|\n|');
    const lines = fixed.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/\|[\s]*[-:]+[\s]*\|/.test(lines[i]) && i > 0) {
        const headerLine = lines[i - 1];
        const firstPipeIdx = headerLine.indexOf('|');
        if (firstPipeIdx > 0 && headerLine.substring(0, firstPipeIdx).trim().length > 0) {
          lines[i - 1] = headerLine.substring(0, firstPipeIdx) + '\n\n' + headerLine.substring(firstPipeIdx);
        }
      }
    }
    return lines.join('\n');
  }
  return text;
}