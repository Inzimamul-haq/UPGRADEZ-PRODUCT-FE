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
  padding: '5px 10px',
  fontSize: 13,
  verticalAlign: 'top',
  lineHeight: 1.35,
};
const tdCenter: React.CSSProperties = {
  ...td,
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: 12,
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
        fontSize: 12,
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
                <div style={{ fontSize: 13 }}>{collegeName}</div>
                <div style={{ fontSize: 13 }}>Department of {deptName}</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', marginTop: 2 }}>{testTitle}</div>
              </div>
              <div style={{ borderTop: BORDER, padding: '6px 10px' }}>
                <div style={{ fontSize: 13, fontWeight: 'bold' }}>{subjectLine}</div>
                <div style={{ fontSize: 12, marginTop: 3 }}>Degree/Branch: {degreeBranch}</div>
                <div style={{ fontSize: 12, marginTop: 3 }}>Academic year {academicYear}</div>
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
              <div style={{ borderTop: BORDER, padding: '6px 10px', fontSize: 12, lineHeight: 1.5 }}>
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
            <thead>
              <tr>
                <th style={{ ...tdCenter, width: COL.no, fontSize: 12, textAlign: 'left' }}>
                  Q.<br />No
                </th>
                <th
                  style={{
                    ...td,
                    textAlign: 'center',
                    fontStyle: 'italic',
                    fontWeight: 'bold',
                    fontSize: 22,
                    padding: '12px 10px',
                    verticalAlign: 'middle',
                  }}
                >
                  ANSWER ALL QUESTIONS
                </th>
                <th style={{ ...tdCenter, width: COL.co, fontSize: 12, verticalAlign: 'bottom' }}>CO</th>
                <th style={{ ...tdCenter, width: COL.rbt, fontSize: 11 }}>
                  RBT<br />Level
                </th>
              </tr>
            </thead>
            <tbody>
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

      {/* ── Footer: Bloom legend, signatures, form code, outcomes ── */}
      <div style={{ marginTop: 22, breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <div style={{ fontSize: 10, fontWeight: 'bold' }}>Level: Revised Bloom’s Taxonomy - Level No: 1-6</div>
        <div style={{ fontSize: 10, marginTop: 2 }}>
          {Object.entries(RBT_LABELS)
            .map(([k, v]) => `Level ${k.slice(1)}: ${v}`)
            .join('   ')}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 44,
            fontSize: 11,
            fontWeight: 'bold',
            padding: '0 40px',
          }}
        >
          <span>Course Handler</span>
          <span>Program Coordinator</span>
          <span>{hodLabel}</span>
        </div>

        {formCode && (
          <div style={{ textAlign: 'right', fontSize: 11, marginTop: 16, color: '#333' }}>
            {formCode}
          </div>
        )}

        {outcomes.length > 0 && (
          <div style={{ marginTop: 14, fontSize: 11 }}>
            <div style={{ fontWeight: 'bold' }}>OUTCOMES: At the end of the course the students would be able to</div>
            {outcomes.map((o) => (
              <div key={o.code}>
                <b>{o.code}</b>&nbsp;&nbsp;{o.description}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
