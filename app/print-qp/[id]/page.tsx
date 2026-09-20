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
    // Inject print styles
    const style = document.createElement('style');
    style.innerHTML = `
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
          max-height: 400px !important;
          object-fit: contain;
        }
      }
    `;
    document.head.appendChild(style);

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
      Promise.all([document.fonts.ready]).then(() => {
        setTimeout(() => {
          (window as any).__PRINT_READY__ = true;
        }, 1500); 
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
    <div style={{ background:'white', minHeight:'100vh', padding:32, maxWidth:800, margin:'0 auto' }}>
      {!isCAT
        ? <UniversityLayout paper={paperData} questions={paperData.questions || []} />
        : <CATLayout paper={paperData} questions={paperData.questions || []} />}
    </div>
  );
}
