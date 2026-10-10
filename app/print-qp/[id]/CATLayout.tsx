import React from 'react';
import { MathMarkdown } from '@/components/ui/MathMarkdown';
import 'katex/dist/katex.min.css';
import { toDecoded, groupByIndex, formatPartMarks, type DecodedQuestion } from '@/lib/examFormat';
import { DiagramRenderer } from '@/components/ui/QuestionDiagram/DiagramRenderer';
const RBT_LABELS: Record<string, string> = {
  L1: 'Remember',
  L2: 'Understand',
  L3: 'Apply',
  L4: 'Analyze',
  L5: 'Evaluate',
  L6: 'Create',
};

export function CATLayout({ paper, questions }: any) {
  const decoded = questions.map(toDecoded);
  const partA = decoded.filter((q: any) => q.part === 'A');
  const partB = decoded.filter((q: any) => q.part === 'B');
  const partC = decoded.filter((q: any) => q.part === 'C');

  // Collect unique, sorted RBT levels actually present
  const usedRbts = [...new Set(
    decoded
      .map((q: any) => q.meta?.rbt?.trim())
      .filter(Boolean)
  )].sort();

  // Collect unique, sorted CO codes actually present
  const usedCos = [...new Set(
    decoded
      .map((q: any) => q.meta?.co?.trim())
      .filter(Boolean)
  )].sort();

  const isCAT = ['CAT1', 'CAT2', 'CAT3', 'CAT 1', 'CAT 2', 'CAT 3'].includes(
    (paper.examType || '').toUpperCase().replace(/\s+/g, '')
  );

  const totalMarks = isCAT ? 50 : 100;
  const duration = isCAT ? '1.5 Hrs' : '03 Hrs';

  const collegeName = paper.subject?.college?.name || 'College Name';
  const logoUrl = paper.subject?.college?.logoUrl || '';
  const collegeId = paper.subject?.college?.id || '';
  const academicYear = paper.academicYear || '2023-2024';
  const examType = paper.examType || 'Exam';
  const branchName = paper.subject?.subjectDepartments?.[0]?.department?.branch || 'Branch Name';
  const deptName = paper.subject?.subjectDepartments?.[0]?.department?.name || 'Dept Name';
  const subjectCode = paper.subject?.code || 'SUB CODE';
  const subjectName = paper.subject?.name || 'Subject Name';
  const examDate = paper.examDate ? new Date(paper.examDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  return (
    <div className="bg-white text-black qp-layout">
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 12, border: '1px solid black' }}>
        <tbody>
          <tr>
            <td rowSpan={2} style={{ border: '1px solid black', width: 80, padding: 4, verticalAlign: 'middle', textAlign: 'center' }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  onError={(e) => { e.currentTarget.src = `/api/proxy-image?collegeId=${collegeId}`; }}
                  style={{ width: 60, height: 60, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                  alt="College Logo"
                />
              ) : (
                <div style={{ height: 60, width: 60, margin: '0 auto', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>Logo</div>
              )}
            </td>
            <td style={{ border: '1px solid black', padding: '4px 8px', fontWeight: 'bold', fontSize: 16 }}>
              {collegeName}
            </td>
            <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: 13, width: 140 }}>
              Date: {examDate}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: 13 }}>
              Dept of {branchName} ({deptName})
            </td>
            <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: 13 }}>
              Marks: {totalMarks}
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: '1px solid black', padding: '4px 8px', fontSize: 13 }}>
              Acad Year: {academicYear} / {subjectCode} {subjectName}
            </td>
            <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: 13 }}>
              Duration: {duration}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '16px 0', fontSize: 16 }}>Answer All Questions</div>

      {/* Part A */}
      {partA.length > 0 && (
        <div style={{ marginBottom: 20, breakInside: 'auto' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, marginBottom: 8, breakAfter: 'avoid' }}>
            PART A — ({formatPartMarks(partA, isCAT ? '5 x 2 = 10' : '10 x 2 = 20')} marks)
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid black' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid black', padding: 4, width: 40, fontSize: 13 }}>Q.No</th>
                <th style={{ border: '1px solid black', padding: 4, fontSize: 13 }}>Questions</th>
                <th style={{ border: '1px solid black', padding: 4, width: 50, fontSize: 13 }}>COs</th>
                <th style={{ border: '1px solid black', padding: 4, width: 70, fontSize: 13 }}>RBT Level</th>
              </tr>
            </thead>
            <tbody>
              {partA.map((q: any, i: number) => (
                <tr key={i} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontSize: 14, verticalAlign: 'top' }}>
                    {i + 1}
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: 14, verticalAlign: 'top' }}>
                    <div className="qp-question-text" style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}>
                      <MathMarkdown>{q.text}</MathMarkdown>
                    </div>
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontSize: 12, verticalAlign: 'top' }}>
                    {q.meta?.co || '-'}
                  </td>
                  <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontSize: 12, verticalAlign: 'top' }}>
                    {q.meta?.rbt || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Part B & C */}
      {[
        { qs: partB, title: 'B', startIndex: partA.length + 1, defaultFormula: isCAT ? '2 x 20 = 40' : '5 x 13 = 65' },
        { qs: partC, title: 'C', startIndex: partA.length + groupByIndex(partB).length + 1, defaultFormula: isCAT ? '' : '1 x 15 = 15' }
      ].map((part) => {
        if (part.qs.length === 0) return null;
        const groups = groupByIndex(part.qs);

        return (
          <div key={part.title} style={{ marginBottom: 20, breakInside: 'auto' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, marginBottom: 8, breakAfter: 'avoid' }}>
              PART {part.title} — ({formatPartMarks(part.qs, part.defaultFormula)} marks)
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid black' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: 4, width: 40, fontSize: 13 }}>Q.No</th>
                  <th style={{ border: '1px solid black', padding: 4, fontSize: 13 }}>Questions</th>
                  <th style={{ border: '1px solid black', padding: 4, width: 50, fontSize: 13 }}>COs</th>
                  <th style={{ border: '1px solid black', padding: 4, width: 70, fontSize: 13 }}>RBT Level</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((grp, gIdx) => {
                  const qIdx = part.startIndex + gIdx;
                  return (
                    <React.Fragment key={gIdx}>
                      {/* Side A */}
                      {grp.a && (
                        <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                          <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontSize: 14, verticalAlign: 'top' }}>
                            {qIdx}{grp.b ? 'a' : ''}
                          </td>
                          <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: 14, verticalAlign: 'top' }}>
                            <div className="qp-question-text" style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}>
                              <MathMarkdown>{grp.a.text}</MathMarkdown>
                              {grp.a.diagramSpec && (
                                <div className="diagram-card-wrapper mt-2">
                                  <DiagramRenderer type={grp.a.diagramSpec.type || grp.a.diagramType || 'unknown'} subtype={grp.a.diagramSpec.subtype} spec={grp.a.diagramSpec} width={400} height={250} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontSize: 12, verticalAlign: 'top' }}>
                            {grp.a.meta?.co || '-'}
                          </td>
                          <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontSize: 12, verticalAlign: 'top' }}>
                            {grp.a.meta?.rbt || '-'}
                          </td>
                        </tr>
                      )}

                      {/* OR Divider */}
                      {grp.b && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', fontWeight: 'bold', border: '1px solid black', padding: 4, fontSize: 13, backgroundColor: '#f9f9f9' }}>
                            OR
                          </td>
                        </tr>
                      )}

                      {/* Side B */}
                      {grp.b && (
                        <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                          <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontSize: 14, verticalAlign: 'top' }}>
                            {qIdx}b
                          </td>
                          <td style={{ border: '1px solid black', padding: '4px 8px', fontSize: 14, verticalAlign: 'top' }}>
                            <div className="qp-question-text" style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}>
                              <MathMarkdown>{grp.b.text}</MathMarkdown>
                              {grp.b.diagramSpec && (
                                <div className="diagram-card-wrapper mt-2">
                                  <DiagramRenderer type={grp.b.diagramSpec.type || grp.b.diagramType || 'unknown'} subtype={grp.b.diagramSpec.subtype} spec={grp.b.diagramSpec} width={400} height={250} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontSize: 12, verticalAlign: 'top' }}>
                            {grp.b.meta?.co || '-'}
                          </td>
                          <td style={{ border: '1px solid black', padding: '4px 8px', textAlign: 'center', fontSize: 12, verticalAlign: 'top' }}>
                            {grp.b.meta?.rbt || '-'}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* QP Summary */}
      {(usedRbts.length > 0 || usedCos.length > 0) && (
        <div style={{
          marginTop: 28,
          border: '1px solid black',
          padding: '12px 16px',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
        }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: 13,
            textAlign: 'center',
            borderBottom: '1px solid black',
            paddingBottom: 6,
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            Question Paper Summary
          </div>

          {usedRbts.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold', fontSize: 12 }}>RBT Levels Covered: </span>
              <span style={{ fontSize: 12 }}>
                {usedRbts
                  .map(rbt => `${rbt}${RBT_LABELS[rbt as string] ? ` – ${RBT_LABELS[rbt as string]}` : ''}`)
                  .join('  |  ')}
              </span>
            </div>
          )}

          {usedCos.length > 0 && (
            <div>
              <span style={{ fontWeight: 'bold', fontSize: 12 }}>Course Outcomes Covered: </span>
              <span style={{ fontSize: 12 }}>{usedCos.join('  |  ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
