import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { toBareLatex } from '@/lib/mathFormat';

export function MathBlock({ latex, display = true, className = '' }: { latex: string; display?: boolean; className?: string }) {
  const html = useMemo(() => {
    const src = toBareLatex(latex);
    try {
      return katex.renderToString(src, {
        displayMode: display, throwOnError: false, strict: 'ignore',
        trust: false, errorColor: '#f87171',
      });
    } catch {
      return null;
    }
  }, [latex, display]);

  if (!html) return <code className="text-red-300 text-[13px] break-words">{latex}</code>;
  return (
    <div
      className={`math-md ${display ? 'overflow-x-auto overflow-y-hidden py-1' : 'inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
