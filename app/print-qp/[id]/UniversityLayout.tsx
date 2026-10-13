import React from 'react';
import { MathMarkdown } from '@/components/ui/MathMarkdown';
import 'katex/dist/katex.min.css';
import { toDecoded, groupByIndex } from '@/lib/examFormat';
import { DiagramRenderer } from '@/components/ui/QuestionDiagram/DiagramRenderer';
import { QuestionDisplay } from '@/components/chat/QuestionDisplay';

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
    <div className="bg-white text-black qp-layout" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      {/* Reg No Box */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, marginTop: 15 }}>
        <span style={{ marginRight: 12, fontSize: 16, fontWeight: 'bold' }}>Reg. No. :</span>
        <div style={{ display: 'flex' }}>
          {Array.from({ length: regNoCells }).map((_, i) => (
            <div key={i} style={{ width: 24, height: 28, border: '1px solid black', display: 'inline-block' }} />
          ))}
        </div>
      </div>

      {/* Letterhead */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            onError={(e) => { e.currentTarget.src = `/api/proxy-image?collegeId=${collegeId}`; }}
            style={{ width: 80, height: 80, objectFit: 'contain', display: 'block', margin: '0 auto 12px', marginTop: 30 }}
            alt="College Logo"
          />
        ) : (
          <div style={{ height: 80, width: 80, margin: '0 auto 12px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
            Logo
          </div>
        )}
        <div style={{ fontSize: 22, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 10 }}>{collegeName}</div>
        <div style={{ fontSize: 16, fontWeight: 'bold', marginTop: 12 }}>{examType} DEGREE EXAMINATIONS, {academicYear}</div>
        <div style={{ fontSize: 15, marginTop: 12 }}>Department Of {branchName}</div>
        <div style={{ fontSize: 17, fontWeight: 'bold', marginTop: 6 }}>{subjectCode} - {subjectName}</div>
        <div style={{ fontSize: 14, marginTop: 14 }}>(Regulations 2021)</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26, fontWeight: 'bold', fontSize: 15 }}>
          <div>Time : {duration}</div>
          <div>Maximum : {maxMarks} Marks</div>
        </div>

        <div style={{ marginTop: 34, fontWeight: 'bold', fontSize: 16, textDecoration: 'underline' }}>Answer ALL questions.</div>
      </div>

      {/* Part A */}
      {partA.length > 0 && (
        <div style={{ marginBottom: 20, breakInside: 'auto' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, marginBottom: 24, breakAfter: 'avoid' }}>PART A — ({partA.length} x 2 = {partA.length * 2} marks)</div>
          <div style={{ padding: '0 24px' }}>
            {partA.map((q: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, paddingTop: 2 }}>{i + 1}.</span>
                  <div className="qp-question-text" style={{ flex: 1, wordBreak: 'normal', overflowWrap: 'break-word' }}>
                    <QuestionDisplay stem={q.stem} options={q.options} fallbackText={q.text} showAnswer={false} />
                  </div>
                </div>
                <div style={{ fontSize: 16, marginLeft: 16, fontWeight: 500, paddingTop: 2 }}>({q.marks || 2})</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Part B & C */}
      {[
        { qs: partB, title: 'B', startIndex: partA.length + 1, defaultMarks: 13 },
        { qs: partC, title: 'C', startIndex: partA.length + groupByIndex(partB).length + 1, defaultMarks: 15 }
      ].map((part) => {
        if (part.qs.length === 0) return null;
        const groups = groupByIndex(part.qs);
        const marksEach = part.qs[0]?.marks || part.defaultMarks;

        return (
          <div key={part.title} style={{ marginBottom: 20, breakInside: 'auto' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, marginBottom: 24, breakAfter: 'avoid' }}>
              PART {part.title} — ({groups.length} x {marksEach} = {groups.length * marksEach} marks)
            </div>
            <div style={{ padding: '0 24px' }}>
              {groups.map((grp, gIdx) => {
                const qIdx = part.startIndex + gIdx;
                return (
                  <div key={gIdx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', marginBottom: 40 }}>
                    {/* Side A */}
                    {grp.a && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 16, fontWeight: 500, paddingTop: 2 }}>{qIdx}. {grp.b ? 'a)' : ''}</span>
                          <div className="qp-question-text" style={{ flex: 1, wordBreak: 'normal', overflowWrap: 'break-word' }}>
                            <QuestionDisplay stem={grp.a.stem} options={grp.a.options} fallbackText={grp.a.text} showAnswer={false} />
                            {grp.a.diagramSpec && (
                              <div className="diagram-card-wrapper mt-1 flex justify-center" style={{ marginBottom: -10 }}>
                                <DiagramRenderer type={grp.a.diagramSpec.type || grp.a.diagramType || 'unknown'} subtype={grp.a.diagramSpec.subtype} spec={grp.a.diagramSpec} width={400} height={250} />
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: 16, marginLeft: 16, fontWeight: 500, paddingTop: 2 }}>({grp.a.marks || marksEach})</div>
                      </div>
                    )}

                    {/* OR divider */}
                    {grp.b && (
                      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 15, margin: '12px 0' }}>Or</div>
                    )}

                    {/* Side B */}
                    {grp.b && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 16, fontWeight: 500, paddingTop: 2 }}>b)</span>
                          <div className="qp-question-text" style={{ flex: 1, wordBreak: 'normal', overflowWrap: 'break-word' }}>
                            <QuestionDisplay stem={grp.b.stem} options={grp.b.options} fallbackText={grp.b.text} showAnswer={false} />
                            {grp.b.diagramSpec && (
                              <div className="diagram-card-wrapper mt-1 flex justify-center" style={{ marginBottom: -10 }}>
                                <DiagramRenderer type={grp.b.diagramSpec.type || grp.b.diagramType || 'unknown'} subtype={grp.b.diagramSpec.subtype} spec={grp.b.diagramSpec} width={400} height={250} />
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: 16, marginLeft: 16, fontWeight: 500, paddingTop: 2 }}>({grp.b.marks || marksEach})</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
