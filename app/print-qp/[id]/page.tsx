"use client";

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';

import { UniversityLayout } from './UniversityLayout';
import { CATLayout } from './CATLayout';

export default function PrintQP({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [paperData, setPaperData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        
        const res = await fetch(`${backendUrl}/api/question-papers/${id}/questions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          const body = await res.text();
          console.error('[PrintQP] Paper fetch failed:', {
            url: `${backendUrl}/api/question-papers/${id}/questions`,
            status: res.status,
            statusText: res.statusText,
            body,
            hasToken: !!token,
          });
          throw new Error(`Failed to fetch paper questions: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        
        if (data.paper) {
          setPaperData(data.paper);
        } else {
          setError('Error: No paper data found.');
        }
      } catch (err) {
        console.error(err);
        setError('Error loading paper.');
      }
    };
    
    if (token) fetchData();
    else setError('Error: Missing print token.');
  }, [id, token]);

  useEffect(() => {
    if (paperData) {
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
  }, [paperData]);

  if (error) {
    return <div className="p-10 text-red-500">{error}</div>;
  }

  if (!paperData) {
    return <div className="p-10 text-black">Preparing Document for Print...</div>;
  }

  const isCAT = ['CAT1','CAT2','CAT3', 'CAT 1', 'CAT 2', 'CAT 3'].some(t =>
    (paperData.examType || '').toUpperCase().replace(/\s+/g, '').includes(t.replace(/\s+/g, ''))
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { animation: none !important; transition: none !important; }
        body { background: white !important; color: black !important; }
        
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }

          .qp-print-page {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .qp-layout {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
          }

          .math-md p {
            margin: 0 !important;
          }

          .math-md p + p {
            margin-top: 4px !important;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          td {
            overflow: visible !important;
          }

          .math-md, .math-md *, .katex, .katex *, .qp-question-text {
            overflow: visible !important;
          }
          
          .katex {
            line-height: 1.4 !important;
          }
          
          .math-md p {
            line-height: 1.5;
          }

          .diagram-card-wrapper svg,
          .diagram-card-wrapper canvas,
          .diagram-card-wrapper img {
            max-width: 100% !important;
            max-height: 350px !important;
            object-fit: contain;
          }
            .diagram-card-wrapper {
  background: #FFFFFF !important;
  color: #000000 !important;
  print-color-adjust: exact !important;
  -webkit-print-color-adjust: exact !important;
}

.diagram-card-wrapper svg {
  background: #FFFFFF !important;
}

.diagram-card-wrapper canvas {
  background: #FFFFFF !important;
}


          .uploaded-diagram-image {
            max-width: 400px !important;
            max-height: 250px !important;
            border: 1px solid #999 !important;
            border-radius: 4px !important;
            padding: 4px !important;
            margin: 10px auto !important;
            object-fit: contain !important;
            display: block !important;
          }
        }
      `}} />
      <div className="qp-print-page" style={{ background:'white', minHeight:'100vh', margin:'0 auto' }}>
        {!isCAT
          ? <UniversityLayout paper={paperData} questions={paperData.questions || []} />
          : <CATLayout paper={paperData} questions={paperData.questions || []} />}
      </div>
    </>
  );
}
