import React from 'react';
import 'katex/dist/katex.min.css';
import { toDecoded, groupByIndex } from '@/lib/examFormat';
import { DiagramRenderer } from '@/components/ui/QuestionDiagram/DiagramRenderer';
import { QuestionDisplay } from '@/components/chat/QuestionDisplay';

const RBT_LABELS: Record<string, string> = {
  L1: 'Remember',
  L2: 'Understand',
  L3: 'Apply',
  L4: 'Analyse',
  L5: 'Evaluate',
  L6: 'Create',
};

const TEST_TITLES: Record<string, string> = {
  CAT1: 'CONTINUOUS ASSESSMENT TEST- I',
  CAT2: 'CONTINUOUS ASSESSMENT TEST- II',
  CAT3: 'CONTINUOUS ASSESSMENT TEST- III',
};

const BORDER = '1px solid #999';
const td: React.CSSProperties = {
  border: BORDER,
  padding: '6px 10px',
  fontSize: 14,
  verticalAlign: 'top',
  lineHeight: 1.4,
};
const tdCenter: React.CSSProperties = {
  ...td,
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: 13,
};
const COL = { no: 50, co: 44, rbt: 56 };

const unitMarks = (g: any, letter: string, paper: any) =>
  g.a?.marks ||
  g.b?.marks ||
  paper?.questionDistribution?.[`part${letter}`]?.marks ||
  (letter === 'A' ? 1 : 0);

function partStats(letter: string, qs: any[], paper: any) {
  const units = groupByIndex(qs).map((g: any) => unitMarks(g, letter, paper));
  const total = units.reduce((s: number, m: number) => s + m, 0);
  const allSame = units.length > 0 && units.every((m: number) => m === units[0]);
  const label = !total
    ? `PART-${letter}`
    : allSame && letter !== 'C'
      ? `PART-${letter} (${units.length} X ${units[0]} = ${total} Marks)`
      : `PART-${letter} (${total} Marks)`;
  return { label, total };
}

function formatDuration(mins?: number, fallback: string = '1h 30m') {
  if (!mins || mins <= 0) return fallback;
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function QRow({ no, q }: { no: string; q: any }) {
  return (
    <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <td style={{ ...tdCenter, width: COL.no }}>{no}</td>
      <td style={td}>
        <div className="qp-question-text" style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}>
          <QuestionDisplay stem={q.stem} options={q.options} fallbackText={q.text} showAnswer={false} />
          {q.diagramSpec && (
            <div className="diagram-card-wrapper mt-2">
              <DiagramRenderer
                type={q.diagramSpec.type || q.diagramType || 'unknown'}
                subtype={q.diagramSpec.subtype}
                spec={q.diagramSpec}
                width={400}
                height={250}
              />
            </div>
          )}
        </div>
      </td>
      <td style={{ ...tdCenter, width: COL.co }}>{q.meta?.co || ''}</td>
      <td style={{ ...tdCenter, width: COL.rbt }}>{q.meta?.rbt || ''}</td>
    </tr>
  );
}

export function CATLayout({ paper, questions }: any) {
  const decoded = questions.map(toDecoded);
  const partA = decoded.filter((q: any) => q.part === 'A');
  const partB = decoded.filter((q: any) => q.part === 'B');
  const partC = decoded.filter((q: any) => q.part === 'C');

  const examKey = (paper.examType || '').toUpperCase().replace(/\s+/g, '').replace(/^CIA/, 'CAT');
  const testTitle = TEST_TITLES[examKey] || (paper.examType ? paper.examType.toUpperCase() : 'CONTINUOUS ASSESSMENT TEST');

  const statsA = partStats('A', partA, paper);
  const statsB = partStats('B', partB, paper);
  const statsC = partStats('C', partC, paper);
  const totalMarks = statsA.total + statsB.total + statsC.total || paper.totalMarks || 0;

  const college = paper.subject?.college || {};
  const dept = paper.subject?.subjectDepartments?.[0]?.department || {};
  const collegeName = college.name || 'College Name';
  const logoUrl = college.logoUrl || '';
  const formCode = college.formCode || 'CAHCET/AD/S&H/CF-05';
  const deptName = dept.name || 'Department';
  const hodLabel = dept.shortName ? `HOD/${dept.shortName}` : 'HOD';
  const subjectLine = `${paper.subject?.code || 'SUB CODE'}-${paper.subject?.name || 'Subject Name'}`;
  const degreeBranch = paper.degreeBranch || (dept.branch ? `B.E. / ${dept.branch}` : 'B. E. /B.Tech');
  const academicYear = `${paper.academicYear || '2026 - 2027'}${paper.semesterType ? ` (${paper.semesterType})` : ''}`;
  const examDate = (paper.examDate ? new Date(paper.examDate) : new Date())
    .toLocaleDateString('en-GB')
    .replace(/\//g, '.');
  const duration = paper.duration || formatDuration(paper.durationMinutes, '1h 30m');
  const outcomes: { code: string; description: string }[] = paper.subject?.courseOutcomes || [];

  // Extract unique RBT levels actually used in the questions
  const usedRbts = Array.from(
    new Set(
      decoded
        .map((q: any) => {
          const raw = (q.meta?.rbt || '').trim().toUpperCase();
          const m = raw.match(/L?([1-6])/);
          return m ? `L${m[1]}` : null;
        })
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

  const activeRbtEntries = usedRbts.length > 0 ? usedRbts : Object.keys(RBT_LABELS);

  // Extract unique Course Outcomes present in the questions (e.g. CO2, CO3, CO4)
  const usedCos = Array.from(
    new Set(
      decoded
        .map((q: any) => {
          const raw = (q.meta?.co || '').toUpperCase().replace(/\s+/g, '');
          if (!raw) return null;
          const m = raw.match(/(?:CO)?(\d+)/i);
          return m ? `CO${m[1]}` : raw;
        })
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, '') || '0', 10);
    const nb = parseInt(b.replace(/\D/g, '') || '0', 10);
    return na - nb;
  });

  const tocEntries: any[] = (paper.subject?.tocPlan as any)?.entries || [];
  const subjectNameOnly = paper.subject?.name || 'the subject';

  const defaultCoDescriptions: Record<string, string> = {
    CO1: `Understand foundational principles, concepts, and terminologies of ${subjectNameOnly}.`,
    CO2: `Apply analytical and problem-solving techniques to solve engineering problems in ${subjectNameOnly}.`,
    CO3: `Analyze, evaluate, and compare various models, algorithms, and designs in ${subjectNameOnly}.`,
    CO4: `Design and implement optimal solutions for practical real-world problems in ${subjectNameOnly}.`,
    CO5: `Formulate and evaluate advanced methodologies, frameworks, and implementations in ${subjectNameOnly}.`,
    CO6: `Create and synthesize comprehensive solutions integrating core concepts of ${subjectNameOnly}.`,
  };

  const targetCoKeys = usedCos.length > 0 ? usedCos : ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];

  const displayOutcomes = targetCoKeys.map((coKey) => {
    const fromSubject = outcomes.find(o => (o.code || '').toUpperCase().replace(/\s+/g, '') === coKey);
    if (fromSubject && fromSubject.description) {
      return { code: coKey, description: fromSubject.description };
    }

    const coNum = parseInt(coKey.replace(/\D/g, '') || '0', 10);
    const tocEntry = tocEntries.find(e => 
      e.chapter === coNum || 
      (Array.isArray(e.co) && e.co.some((c: string) => c.toUpperCase().replace(/\s+/g, '') === coKey))
    );
    if (tocEntry && tocEntry.title) {
      return { code: coKey, description: `Understand, apply, and analyze the principles of ${tocEntry.title}.` };
    }

    return {
      code: coKey,
      description: defaultCoDescriptions[coKey] || `Apply and analyze core principles associated with ${coKey} in ${subjectNameOnly}.`
    };
  });

  const bStart = partA.length + 1;
  const cStart = partA.length + groupByIndex(partB).length + 1;

  const renderGroups = (qs: any[], start: number) =>
    groupByIndex(qs).map((grp: any, gIdx: number) => {
      const n = start + gIdx;
      return (
        <React.Fragment key={gIdx}>
          {grp.a && <QRow no={`${n}${grp.b ? 'a' : ''}`} q={grp.a} />}
          {grp.b && (
            <tr>
              <td colSpan={4} style={{ ...tdCenter, background: '#f9f9f9' }}>
                OR
              </td>
            </tr>
          )}
          {grp.b && <QRow no={`${n}b`} q={grp.b} />}
        </React.Fragment>
      );
    });

  const partHeading = (text: string) => (
    <div
      style={{
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 13.5,
        margin: '14px 0 6px',
        breakAfter: 'avoid',
      }}
    >
      {text}
    </div>
  );

  return (
    <div
      className="bg-white text-black qp-layout"
      style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
    >
      {/* ── Header Table ── */}
      <table style={{ borderCollapse: 'collapse', width: '100%', border: BORDER, tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={{ border: BORDER, width: 110, padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  onError={(e) => {
                    e.currentTarget.src = `/api/proxy-image?collegeId=${college.id || ''}`;
                  }}
                  style={{ width: 90, height: 90, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                  alt="College Logo"
                />
              ) : (
                <div
                  style={{
                    height: 80,
                    width: 80,
                    margin: '0 auto',
                    border: '1px dashed #ccc',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Logo
                </div>
              )}
            </td>

            <td style={{ border: BORDER, padding: 0, textAlign: 'center', verticalAlign: 'top' }}>
              <div style={{ padding: '6px 10px' }}>
                <div style={{ fontSize: 14.5, fontWeight: 'bold' }}>{collegeName}</div>
                <div style={{ fontSize: 13.5, marginTop: 2 }}>Department of {deptName}</div>
                <div style={{ fontSize: 14, fontWeight: 'bold', marginTop: 3 }}>{testTitle}</div>
              </div>
              <div style={{ borderTop: BORDER, padding: '6px 10px' }}>
                <div style={{ fontSize: 14, fontWeight: 'bold' }}>{subjectLine}</div>
                <div style={{ fontSize: 13, marginTop: 3 }}>Degree/Branch: {degreeBranch}</div>
                <div style={{ fontSize: 13, marginTop: 3 }}>Academic year {academicYear}</div>
              </div>
            </td>

            <td style={{ border: BORDER, width: 170, padding: 0, verticalAlign: 'top' }}>
              <div style={{ padding: 6, textAlign: 'center', minHeight: 75 }}>
                <img
                  src="/tuv-iso21001.png"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  style={{ width: 75, height: 75, objectFit: 'contain', margin: '0 auto', display: 'block' }}
                  alt=""
                />
              </div>
              <div style={{ borderTop: BORDER, padding: '6px 10px', fontSize: 13, lineHeight: 1.5 }}>
                <div>Date: {examDate}</div>
                <div>Duration: {duration}</div>
                <div>
                  Marks: <b>{totalMarks}</b>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Part A ── */}
      {partA.length > 0 && (
        <>
          {partHeading(statsA.label)}
          <table style={{ borderCollapse: 'collapse', width: '100%', border: BORDER, tableLayout: 'fixed' }}>
            <tbody>
              {/* Header row placed in tbody so it NEVER repeats across page breaks */}
              <tr>
                <td style={{ ...tdCenter, width: COL.no, fontSize: 13, textAlign: 'left' }}>
                  Q.<br />No
                </td>
                <td
                  style={{
                    ...td,
                    textAlign: 'center',
                    fontStyle: 'italic',
                    fontWeight: 'bold',
                    fontSize: 20,
                    padding: '10px',
                    verticalAlign: 'middle',
                  }}
                >
                  ANSWER ALL QUESTIONS
                </td>
                <td style={{ ...tdCenter, width: COL.co, fontSize: 13, verticalAlign: 'bottom' }}>CO</td>
                <td style={{ ...tdCenter, width: COL.rbt, fontSize: 12 }}>
                  RBT<br />Level
                </td>
              </tr>
              {partA.map((q: any, i: number) => (
                <QRow key={i} no={`${i + 1}.`} q={q} />
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ── Part B ── */}
      {partB.length > 0 && (
        <>
          {partHeading(statsB.label)}
          <table style={{ borderCollapse: 'collapse', width: '100%', border: BORDER, tableLayout: 'fixed' }}>
            <tbody>{renderGroups(partB, bStart)}</tbody>
          </table>
        </>
      )}

      {/* ── Part C ── */}
      {partC.length > 0 && (
        <>
          {partHeading(statsC.label)}
          <table style={{ borderCollapse: 'collapse', width: '100%', border: BORDER, tableLayout: 'fixed' }}>
            <tbody>{renderGroups(partC, cStart)}</tbody>
          </table>
        </>
      )}

      {/* ── Footer: Bloom legend, outcomes table, signatures, form code ── */}
      <div style={{ marginTop: 20, breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <div style={{ fontSize: 13, fontWeight: 'bold' }}>Level: Revised Bloom’s Taxonomy - Level No: 1-6</div>
        <div style={{ fontSize: 12.5, marginTop: 2, lineHeight: 1.35 }}>
          {activeRbtEntries
            .map((k) => `Level ${k.slice(1)}: ${RBT_LABELS[k]}`)
            .join(' ')}
        </div>

        {displayOutcomes.length > 0 && (
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              border: BORDER,
              marginTop: 6,
              tableLayout: 'auto',
            }}
          >
            <colgroup>
              <col style={{ width: 55 }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <td
                  colSpan={2}
                  style={{
                    border: BORDER,
                    padding: '3px 8px',
                    fontWeight: 'bold',
                    fontSize: 12.5,
                  }}
                >
                  OUTCOMES: At the end of the course the students would be able to
                </td>
              </tr>
              {displayOutcomes.map((o) => (
                <tr key={o.code}>
                  <td
                    style={{
                      border: BORDER,
                      padding: '3px 8px',
                      width: 55,
                      fontSize: 12,
                      verticalAlign: 'top',
                      textAlign: 'left',
                    }}
                  >
                    {o.code.replace(/^(CO)\s*(\d+)$/i, '$1 $2')}
                  </td>
                  <td
                    style={{
                      border: BORDER,
                      padding: '3px 8px',
                      fontSize: 12,
                      verticalAlign: 'top',
                      lineHeight: 1.35,
                    }}
                  >
                    {o.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 36,
            fontSize: 13,
            fontWeight: 'bold',
            padding: '0 40px',
          }}
        >
          <span>Course Handler</span>
          <span>Program Coordinator</span>
          <span>{hodLabel}</span>
        </div>

        {formCode && (
          <div style={{ textAlign: 'right', fontSize: 11, marginTop: 12, color: '#333' }}>
            {formCode}
          </div>
        )}
      </div>
    </div>
  );
}
  