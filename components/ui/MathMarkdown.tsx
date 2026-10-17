import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { normalizeDelimiters, repairMathSegments } from '@/lib/mathFormat';

const KATEX_OPTS = {
  throwOnError: false,
  strict: false as const,           
  errorColor: '#f87171',
  trust: false,
  macros: {
    '\\R':    '\\mathbb{R}',
    '\\N':    '\\mathbb{N}',
    '\\Z':    '\\mathbb{Z}',
    '\\Q':    '\\mathbb{Q}',
    '\\C':    '\\mathbb{C}',
    // Set notation helper — \set{a,b,c} → {a,b,c}
    '\\set':  '\\{#1\\}',
  },
};

/**
 * Prepare text for rendering:
 * 1. Repair corrupted macro escapes (JSON-serialised text)
 * 2. Normalise legacy delimiters  \(...\)  →  $...$  and  \[...\]  →  $$...$$
 */
function wrapBareMath(s: string) {
  const parts = s.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);
  return parts.map((p, i) => i % 2 ? p :
    p.replace(/(\b[A-Za-z]\w*(?:_\{[^}]*\}|\^\{[^}]*\}|_\w|\^\w)+|\\[A-Za-z]+(?:\{[^}]*\})*)/g, '$$$1$$')
  ).join('');
}

function prepare(raw: string): string {
  if (!raw) return '';
  const repaired = repairMathSegments(raw);
  const normalized = normalizeDelimiters(repaired);
  return wrapBareMath(normalized);
}

/**
 * MathMarkdown — universal renderer for prose + LaTeX.
 *
 * Handles:
 *  - $...$ inline math
 *  - $$...$$ display/block math (incl. matrices, fractions, cases)
 *  - Legacy \(...\) and \[...\] from old stored data
 *  - GFM tables and lists
 *  - Long equations scrolling horizontally without breaking layout
 */
export function MathMarkdown({
  children,
  className = '',
}: {
  children: string;
  className?: string;
}) {
  const text = useMemo(() => prepare(children ?? ''), [children]);

  return (
    <div className={`math-md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, KATEX_OPTS]]}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
