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
          body { background: white !important; color: black !important; }
          * { 
            color: black !important; 
            border-color: #ccc !important; 
            background: white !important;
            background-color: white !important;
          }
          
          /* Shape fills: white background, black outline — scoped to exclude <defs> */
          svg > *:not(defs) circle,
          svg > *:not(defs) ellipse,
          svg > *:not(defs) rect,
          svg > *:not(defs) polygon,
          svg > *:not(defs) path,
          svg > *:not(defs) polyline {
            fill: white !important;
            stroke: black !important;
          }

          /* Arrowhead markers must stay solid black */
          svg marker polygon,
          svg marker path,
          svg marker circle {
            fill: black !important;
            stroke: black !important;
          }

          /* All SVG text: black, no stroke */
          svg text, svg tspan {
            fill: black !important;
            stroke: none !important;
          }

          /* Edge lines */
          svg line {
            stroke: black !important;
          }

          /* Diagram wrapper: no border */
          .diagram-card-wrapper {
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            padding: 4px 0 !important;
          }
          
          /* Force any SVG or canvas diagrams to stay within max height on print */
          canvas, svg, img {
            max-width: 100% !important;
            max-height: 350px !important;
            object-fit: contain;
          }

          .uploaded-diagram-image {
            max-width: 400px !important;
            max-height: 250px !important;
            padding: 4px !important;
            margin: 10px auto !important;
            object-fit: contain !important;
            display: block !important;
          }
        }
      `}} />
      <div style={{ background:'white', minHeight:'100vh', padding:32, maxWidth:800, margin:'0 auto' }}>
        {renderContent}
      </div>
    </>
  );
}
