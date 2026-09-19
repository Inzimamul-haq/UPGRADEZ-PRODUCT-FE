"use client";

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { QuestionPaperRenderer } from '@/components/chat/QuestionPaperRenderer';

export default function PrintQP({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [content, setContent] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    // Inject print styles
    const style = document.createElement('style');
    style.innerHTML = `
      * { animation: none !important; transition: none !important; }
      body { background: white !important; color: black !important; }
      
      @media print {
        body { background: white !important; color: black !important; }
        * { color: black !important; border-color: #ccc !important; }
        .page-break-inside-avoid { break-inside: avoid; }
        
        /* Force any SVG or canvas diagrams to stay within max height on print */
        canvas, svg, img {
          max-height: 400px !important;
          object-fit: contain;
        }
      }
    `;
    document.head.appendChild(style);

    const fetchData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        
        // Use token in Authorization header
        const res = await fetch(`${backendUrl}/api/questionPapers/${id}/questions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch paper questions');
        }

        const data = await res.json();
        
        // Re-serialize the JSON array back into the raw text format QuestionPaperRenderer expects
        if (data.paper && data.paper.questions) {
          const serialized = data.paper.questions.map((q: any) => {
            let block = `${q.qNo}. ${q.questionText} (${q.marks} Marks)`;
            if (q.diagramSpec) {
              block += `\n[[${q.diagramType || 'diagram'}:${JSON.stringify(q.diagramSpec)}]]`;
            }
            block += `\n[[meta:{"co":"${q.co}","rbt":"${q.rbt}"${q.po ? `,"po":"${q.po}"` : ''}}]]`;
            return block;
          }).join('\n\n');
          setContent(serialized);
        } else {
          setContent('Error: No paper data found.');
        }
      } catch (err) {
        console.error(err);
        setContent('Error loading paper.');
      }
    };
    
    if (token) fetchData();
    else setContent('Error: Missing print token.');
  }, [id, token]);

  useEffect(() => {
    if (content) {
      // The crucial 100% accuracy lock: Wait for fonts, then wait a small delay for Canvas/SVG to draw
      Promise.all([document.fonts.ready]).then(() => {
        setTimeout(() => {
          (window as any).__PRINT_READY__ = true;
        }, 1500); // 1.5 seconds is plenty for client-side diagram renderers
      });
    }
  }, [content]);

  if (!content) {
    return <div className="p-10 text-black">Preparing Document for Print...</div>;
  }

  if (content.startsWith('Error')) {
    return <div className="p-10 text-red-500">{content}</div>;
  }

  return (
    <div className="bg-white text-black min-h-screen p-8 max-w-[800px] mx-auto page-break-inside-avoid">
      <QuestionPaperRenderer content={content} />
    </div>
  );
}
