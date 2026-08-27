export interface MathExecutionLine {
  content: string;
  isImplies: boolean;
}

export function parseMathLines(raw: string): MathExecutionLine[] {
  if (!raw) return [];
  
  // Split on delimiters: \implies, \Rightarrow, ⇒, ;, \n, ,, and :
  const tokens = raw.split(/(\\implies|\\Rightarrow|⇒|;|\n|,|:)/g);
  
  const lines: MathExecutionLine[] = [];
  let currentContent = '';
  let currentIsImplies = false;
  let envDepth = 0;
  let parenDepth = 0;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Track environment depth to avoid splitting inside matrices, etc.
    const begins = (token.match(/\\begin\{[^}]+\}/g) || []).length;
    const ends = (token.match(/\\end\{[^}]+\}/g) || []).length;
    envDepth += (begins - ends);
    if (envDepth < 0) envDepth = 0;
    
    // Track parenthesis/bracket depth to avoid splitting inside (x, y), [0, 1], \text{...}
    const openParens = (token.match(/[\(\[\{]/g) || []).length;
    const closeParens = (token.match(/[\)\]\}]/g) || []).length;
    parenDepth += (openParens - closeParens);
    if (parenDepth < 0) parenDepth = 0;
    
    const isDelimiter = token.match(/^(\\implies|\\Rightarrow|⇒|;|\n|,|:)$/);
    
    if (isDelimiter && envDepth === 0 && parenDepth === 0) {
      if (currentContent.trim()) {
        lines.push({ content: currentContent.trim(), isImplies: currentIsImplies });
        currentContent = '';
      }
      
      if (token === '\\implies' || token === '\\Rightarrow' || token === '⇒') {
        currentIsImplies = true;
      } else {
        currentIsImplies = false;
      }
    } else {
      currentContent += token;
    }
  }
  
  if (currentContent.trim()) {
    lines.push({ content: currentContent.trim(), isImplies: currentIsImplies });
  }
  
  return lines;
}

export function ensureBoxedIsMath(text: string): string {
  if (!text) return text;
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
