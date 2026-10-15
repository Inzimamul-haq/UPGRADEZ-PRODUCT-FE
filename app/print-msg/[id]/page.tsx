"use client";

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { QuestionPaperRenderer } from '@/components/chat/QuestionPaperRenderer';
import { parseQPStructure, encodeQPPrefix } from '@/lib/qpParser';
import { CATLayout } from '@/app/print-qp/[id]/CATLayout';
import { UniversityLayout } from '@/app/print-qp/[id]/UniversityLayout';

export default function PrintMsg({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [content, setContent] = useState<string | null>(null);
  const [messageData, setMessageData] = useState<any>(null);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const examType = searchParams.get('examType');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        
        // Use token in Authorization header
        const res = await fetch(`${backendUrl}/api/chats/messages/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch message');
        }

        const data = await res.json();
        
        if (data.data && data.data.content) {
          setContent(data.data.content);
          setMessageData(data.data);
        } else {
          setContent('No content found');
        }
      } catch (err) {
        console.error('Error fetching message:', err);
        setContent('Error loading content.');
      }
    };

    fetchData();
  }, [id, token]);

  useEffect(() => {
    if (content) {
      const waitForImages = () => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const imagePromises = imgs.map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>(resolve => { img.onload = () => resolve(); img.onerror = () => resolve(); })
        );
        return Promise.all(imagePromises);
      };

      Promise.all([document.fonts.ready, waitForImages()]).then(() => {
        setTimeout(() => {
          (window as any).__PRINT_READY__ = true;
        }, 300);
      });
    }
  }, [content]);

  if (!content) {
    return <div className="p-8 text-center text-gray-500">Loading paper content...</div>;
  }

  let renderContent: React.ReactNode = null;
  if (examType && content) {
    try {
      const structuredQs = parseQPStructure(content);
      const questionsForLayout = structuredQs.map((q, index) => ({
        id: `draft-${index}`,
        text: encodeQPPrefix(q),
        marks: q.marks
      }));

      const calculatedMarks = questionsForLayout.reduce((acc, q) => acc + (q.marks || 0), 0);
      const chat = messageData?.chat || {};
      const subject = chat.subject || {};
      const college = subject.college || { name: 'Draft Preview', logoUrl: '' };
      const department = subject.subjectDepartments?.[0]?.department || { name: 'Draft Department', branch: 'Draft Branch' };

      const mockPaper = {
        examType: chat.examType || examType,
        academicYear: chat.academicYear || '2024-2025',
        subject: { 
          name: subject.name || 'AI Generated Draft', 
          code: subject.code || 'DRAFT', 
          regulation: subject.regulation || 'R2021',
          college: college,
          subjectDepartments: [{ department }]
        },
        examDate: new Date(),
        durationMinutes: ['CAT1', 'CAT2', 'CAT3'].includes(chat.examType || examType) ? 90 : 180,
        totalMarks: calculatedMarks || (['CAT1', 'CAT2', 'CAT3'].includes(chat.examType || examType) ? 50 : 100),
        questionDistribution: chat.questionDistribution || {
          partA: { count: 5, marks: 1 },
          partB: { count: 1, marks: 15 },
          partC: { count: 1, marks: 30 },
        },
      };

      if (['CAT1', 'CAT2', 'CAT3'].includes(mockPaper.examType)) {
        renderContent = <CATLayout paper={mockPaper} questions={questionsForLayout} />;
      } else {
        renderContent = <UniversityLayout paper={mockPaper} questions={questionsForLayout} />;
      }
    } catch (e) {
      console.warn('Failed to parse QP structure, falling back to markdown', e);
    }
  }

  if (!renderContent) {
    renderContent = <QuestionPaperRenderer content={content} />;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { animation: none !important; transition: none !important; }
        body { background: white !important; color: black !important; }
        
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .qp-layout table, .qp-layout th, .qp-layout td { border-color: #bbb !important; }
          tr { break-inside: avoid; page-break-inside: avoid; }
          td { overflow: visible !important; }
          .math-md p { margin: 0 !important; }
          .math-md p + p { margin-top: 4px !important; }
          
          .qp-layout, .qp-layout *:not(.katex *) { color: black !important; }

          /* diagram-only styling */
          .diagram-card-wrapper { background: white !important; border: none !important; box-shadow: none !important; padding: 4px 0 !important; }
          .diagram-card-wrapper svg > *:not(defs) circle,
          .diagram-card-wrapper svg > *:not(defs) ellipse,
          .diagram-card-wrapper svg > *:not(defs) rect,
          .diagram-card-wrapper svg > *:not(defs) polygon,
          .diagram-card-wrapper svg > *:not(defs) path,
          .diagram-card-wrapper svg > *:not(defs) polyline { fill: white !important; stroke: black !important; }
          .diagram-card-wrapper svg marker polygon,
          .diagram-card-wrapper svg marker path { fill: black !important; stroke: black !important; }
          .diagram-card-wrapper svg text, .diagram-card-wrapper svg tspan { fill: black !important; stroke: none !important; }
          .diagram-card-wrapper svg line { stroke: black !important; }
          .diagram-card-wrapper svg, .diagram-card-wrapper canvas, .diagram-card-wrapper img { max-width: 100% !important; max-height: 350px !important; object-fit: contain; }

          .uploaded-diagram-image { max-width: 400px !important; max-height: 250px !important; padding: 4px !important; margin: 10px auto !important; object-fit: contain !important; display: block !important; }
        }
      `}} />
      <div className="qp-msg-wrap" style={{ background:'white', minHeight:'100vh', padding:32, maxWidth:800, margin:'0 auto' }}>
        {renderContent}
      </div>
    </>
  );
}
