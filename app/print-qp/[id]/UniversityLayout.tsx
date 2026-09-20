import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { toDecoded, groupByIndex } from '@/lib/examFormat';
import { DiagramRenderer } from '@/components/ui/DiagramRenderer';

export function UniversityLayout({ paper, questions }: any) {
  const decoded = questions.map(toDecoded);
  const partA = decoded.filter((q: any) => q.part === 'A');
  const partB = decoded.filter((q: any) => q.part === 'B');
  const partC = decoded.filter((q: any) => q.part === 'C');

  const regNoCells = 12;

  // Derive text values
  const collegeName = paper.subject?.college?.name || 'College Name';
  const logoUrl = paper.subject?.college?.logoUrl || '';
  const collegeId = paper.subject?.college?.id || '';
  const academicYear = paper.academicYear || '2023-2024';
  const examType = paper.examType || 'B.E./B.Tech.';
  const branchName = paper.subject?.subjectDepartments?.[0]?.department?.branch || 'Branch Name';
  const subjectCode = paper.subject?.code || 'SUB CODE';
  const subjectName = paper.subject?.name || 'Subject Name';
  const duration = '3 Hours';
  const maxMarks = 100;

  return (
    <div className="bg-white text-black max-w-[800px] mx-auto">
      {/* Reg No Box */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <span style={{ marginRight: 8, fontSize: 13, fontWeight: 'bold' }}>Reg. No. :</span>
        <div style={{ display: 'flex' }}>
          {Array.from({ length: regNoCells }).map((_, i) => (
            <div key={i} style={{ width: 20, height: 24, border: '1px solid black', display: 'inline-block' }} />
          ))}
        </div>
      </div>

      {/* Letterhead */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            onError={(e) => { e.currentTarget.src = `/api/proxy-image?collegeId=${collegeId}`; }}
            style={{ width: 60, height: 60, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
            alt="College Logo"
          />
        ) : (
          <div style={{ height: 60, width: 60, margin: '0 auto 8px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Logo
          </div>
        )}
        <div style={{ fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' }}>{collegeName}</div>
        <div style={{ fontSize: 14, fontWeight: 'bold', marginTop: 8 }}>{examType} DEGREE EXAMINATIONS, {academicYear}</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Department Of {branchName}</div>
        <div style={{ fontSize: 13, fontWeight: 'bold', marginTop: 4 }}>{subjectCode} - {subjectName}</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>(Regulations 2021)</div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 'bold', fontSize: 12 }}>
          <div>Time : {duration}</div>
          <div>Maximum : {maxMarks} Marks</div>
        </div>
        
        <div style={{ marginTop: 16, fontWeight: 'bold', fontSize: 13, textDecoration: 'underline' }}>Answer ALL questions.</div>
      </div>

      {/* Part A */}
      {partA.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 13, marginBottom: 12 }}>PART A — ({partA.length} x 2 = {partA.length * 2} marks)</div>
          {partA.map((q: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13 }}>{i + 1}.</span>
                <div style={{ fontSize: 13, flex: 1, wordBreak: 'break-word' }}>
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{q.text}</ReactMarkdown>
                </div>
              </div>
              <div style={{ fontSize: 13, marginLeft: 16 }}>({q.marks || 2})</div>
            </div>
          ))}
        </div>
      )}

      {/* Part B & C */}
      {[ 
        { qs: partB, title: 'B', startIndex: partA.length > 0 ? partA.length + 1 : 1, defaultMarks: 13 },
        { qs: partC, title: 'C', startIndex: partA.length > 0 ? partA.length + 1 + groupByIndex(partB).length : 1, defaultMarks: 15 } 
      ].map((part) => {
        if (part.qs.length === 0) return null;
        const groups = groupByIndex(part.qs);
        const marksEach = part.qs[0]?.marks || part.defaultMarks;

        return (
          <div key={part.title} style={{ marginBottom: 20 }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 13, marginBottom: 12 }}>
              PART {part.title} — ({groups.length} x {marksEach} = {groups.length * marksEach} marks)
            </div>
            {groups.map((grp, gIdx) => {
              const qIdx = part.startIndex + gIdx;
              return (
                <div key={gIdx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', marginBottom: 16 }}>
                  {/* Side A */}
                  {grp.a && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13 }}>{qIdx}. {grp.b ? 'a)' : ''}</span>
                        <div style={{ fontSize: 13, flex: 1, wordBreak: 'break-word' }}>
                          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{grp.a.text}</ReactMarkdown>
                          {grp.a.diagramSpec && (
                            <div className="diagram-card-wrapper mt-2">
                              <DiagramRenderer type={grp.a.diagramSpec.type || grp.a.diagramType || 'unknown'} spec={grp.a.diagramSpec} width={400} height={200} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, marginLeft: 16 }}>({grp.a.marks || marksEach})</div>
                    </div>
                  )}

                  {/* OR divider */}
                  {grp.b && (
                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 13, margin: '12px 0' }}>Or</div>
                  )}

                  {/* Side B */}
                  {grp.b && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13 }}>b)</span>
                        <div style={{ fontSize: 13, flex: 1, wordBreak: 'break-word' }}>
                          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{grp.b.text}</ReactMarkdown>
                          {grp.b.diagramSpec && (
                            <div className="diagram-card-wrapper mt-2">
                              <DiagramRenderer type={grp.b.diagramSpec.type || grp.b.diagramType || 'unknown'} spec={grp.b.diagramSpec} width={400} height={200} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, marginLeft: 16 }}>({grp.b.marks || marksEach})</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
