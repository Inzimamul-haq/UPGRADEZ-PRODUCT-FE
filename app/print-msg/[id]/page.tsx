"use client";

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { QuestionPaperRenderer } from '@/components/chat/QuestionPaperRenderer';

export default function PrintMsg({ params }: { params: Promise<{ id: string }> }) {
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
      Promise.all([document.fonts.ready]).then(() => {
        setTimeout(() => {
          (window as any).__PRINT_READY__ = true;
        }, 1500); 
      });
    }
  }, [content]);

  if (!content) {
    return <div className="p-8 text-center text-gray-500">Loading paper content...</div>;
  }

  return (
    <div className="bg-white min-h-screen text-black page-break-inside-avoid">
      <div className="max-w-[800px] mx-auto p-8">
        <QuestionPaperRenderer content={content} />
      </div>
    </div>
  );
}
