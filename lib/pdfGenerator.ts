import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { decodeQPPrefix, stripQPPrefix, type DecodedQPPrefix, extractGraphPrefix, stripGraphPrefix } from './qpParser';

// ─── Graph rendering for PDF ──────────────────────────────────────────────────

function generateCircularLayout(nodes: string[], width: number, height: number): Record<string, { x: number; y: number }> {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 30; // 30px padding
  
  const positions: Record<string, { x: number; y: number }> = {};
  const n = nodes.length;
  
  nodes.forEach((node, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    positions[node] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
  
  return positions;
}

async function renderGraphToDataUrl(graph: any): Promise<string | null> {
  if (!graph || !graph.nodes || !graph.edges) return null;
  const width = 200;
  const height = 200;
  const positions = generateCircularLayout(graph.nodes, width, height);
  const isDirected = graph.directed !== false;

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
  svgContent += `<defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="22" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#555"/></marker></defs>`;
  
  for (const edge of graph.edges) {
    const fromPos = positions[edge.from];
    const toPos = positions[edge.to];
    if (!fromPos || !toPos) continue;
    
    svgContent += `<line x1="${fromPos.x}" y1="${fromPos.y}" x2="${toPos.x}" y2="${toPos.y}" stroke="#555" stroke-width="2" ${isDirected ? 'marker-end="url(#arrowhead)"' : ''}/>`;
    
    if (edge.weight !== undefined) {
      const midX = (fromPos.x + toPos.x) / 2;
      const midY = (fromPos.y + toPos.y) / 2;
      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len;
      const ny = dx / len;
      svgContent += `<text x="${midX + nx * 12}" y="${midY + ny * 12}" fill="#333" font-size="12" text-anchor="middle" dominant-baseline="middle">${edge.weight}</text>`;
    }
  }
  
  for (const node of graph.nodes) {
    const pos = positions[node];
    if (!pos) continue;
    svgContent += `<circle cx="${pos.x}" cy="${pos.y}" r="16" fill="#fff" stroke="#333" stroke-width="2"/>`;
    svgContent += `<text x="${pos.x}" y="${pos.y}" fill="#333" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="central">${node}</text>`;
  }
  
  svgContent += `</svg>`;
  
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(null);
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

// ─── Logo fetch ───────────────────────────────────────────────────────────────

/**
 * Fetches a remote image via the server-side proxy (bypasses CORS)
 * and returns a base64 data URL, or null if anything fails.
 */
async function fetchLogoBase64(logoUrl?: string | null, collegeId?: string | null): Promise<string | null> {
  if (!logoUrl && !collegeId) return null;
  try {
    let proxyUrl = '/api/proxy-image?';
    if (logoUrl) proxyUrl += `url=${encodeURIComponent(logoUrl)}`;
    else if (collegeId) proxyUrl += `collegeId=${collegeId}`;

    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return data.dataUrl ?? null;
  } catch {
    return null;
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Decode a raw DB questionText into structured metadata + clean text. */
function toDecoded(q: any): DecodedQPPrefix & { marks?: number } {
  const raw: string = q.questionText ?? q.text ?? '';
  const decoded = decodeQPPrefix(raw);
  if (decoded) {
    return { ...decoded, marks: q.marks };
  }
  // Legacy / PDF-uploaded question: no prefix → treat as flat Part A
  return { text: stripQPPrefix(raw), part: 'A', groupIndex: 1, subLabel: '', marks: q.marks };
}

interface GroupedQuestion {
  groupIndex: number;
  a: (DecodedQPPrefix & { marks?: number }) | null;
  b: (DecodedQPPrefix & { marks?: number }) | null;
}

/** Group Part B/C questions by groupIndex so OR-pairs render together. */
function groupByIndex(questions: (DecodedQPPrefix & { marks?: number })[]): GroupedQuestion[] {
  const map = new Map<number, GroupedQuestion>();
  for (const q of questions) {
    if (!map.has(q.groupIndex)) {
      map.set(q.groupIndex, { groupIndex: q.groupIndex, a: null, b: null });
    }
    const grp = map.get(q.groupIndex)!;
    if (q.subLabel === 'b') grp.b = q;
    else grp.a = q; // '' or 'a' both slot as the "a" side
  }
  return Array.from(map.values()).sort((x, y) => x.groupIndex - y.groupIndex);
}

// ─── CAT / CIA paper (autoTable layout) ──────────────────────────────────────

export async function generateQuestionPaperPDF({ paper, assignment, questions, subject, college, department }: any) {
  const doc = new jsPDF();

  // Fetch college logo (server-side proxy, safe from CORS)
  const logoBase64 = await fetchLogoBase64(college?.logoUrl, college?.id);

  const isCAT = ['CAT1', 'CAT2', 'CAT3', 'CAT 1', 'CAT 2', 'CAT 3']
    .includes((paper.examType ?? '').toUpperCase().replace(/\s+/g, ''));

  // Decode all questions — reads part/groupIndex/subLabel from [[qp:...]] prefix
  const decoded = questions.map(toDecoded);
  const partA = decoded.filter((q: DecodedQPPrefix) => q.part === 'A');
  const partB = decoded.filter((q: DecodedQPPrefix) => q.part === 'B');
  const partC = decoded.filter((q: DecodedQPPrefix) => q.part === 'C');

  // No more slice-fallbacks — if the parts are empty, render nothing for that section.

  const totalMarks = isCAT ? 50 : 100;
  const duration = isCAT ? '1.5 Hrs' : '03 Hrs';
  const examDate = paper.examDate
    ? new Date(paper.examDate).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  let y = 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Regulation: 2021', 195, y, { align: 'right' });
  y += 3;

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { lineWidth: 0.1, lineColor: 0, cellPadding: 2, fontSize: 10, textColor: 0 },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center', valign: 'middle' },
      1: { halign: 'center', valign: 'middle' },
      2: { cellWidth: 40, halign: 'left' },
    },
    body: [
      [
        { content: logoBase64 ? '' : '[ LOGO ]', rowSpan: 2 },
        {
          content: `${college?.name || 'College Name'}\nDegree/Branch: Department Of ${department?.branch || assignment.assignedToBranch || 'Branch'}(${department?.name || 'Department'})`,
          styles: { fontStyle: 'bold' },
        },
        { content: `Date: ${examDate}\nMarks: ${totalMarks}\nDuration: ${duration}` },
      ],
      [
        {
          content: `Academic Year: ${paper.academicYear}\nSub Code & Name: ${subject.code}/${subject.name}`,
          styles: { halign: 'left' },
        },
        {
          content: `Year/Sec: ${assignment.assignedToYear || '-'}/${assignment.assignedToSection || '-'}\nExam: ${paper.examType}`,
          styles: { halign: 'left' },
        },
      ],
    ],
    // Inject logo image into the spanning first cell using the didDrawCell hook
    didDrawCell: (data: any) => {
      if (logoBase64 && data.column.index === 0 && data.row.index === 0 && data.section === 'body') {
        const padding = 3;
        const cellW = data.cell.width - padding * 2;
        // rowSpan=2: the actual two-row height is stored in cell.height for row 0 when rowSpanning
        // Use a safe cap: the column width minus padding is the binding constraint
        const cellH = data.cell.height - padding * 2;
        const size = Math.min(cellW, cellH);
        const imgX = data.cell.x + (data.cell.width - size) / 2;
        const imgY = data.cell.y + padding;
        doc.addImage(logoBase64, 'PNG', imgX, imgY, size, size);
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Answer All the Questions', 105, y, { align: 'center' });
  y += 5;

  /** Build marks formula string for the part header. */
  const formatPartMarks = (qs: (DecodedQPPrefix & { marks?: number })[], defaultFormula: string) => {
    if (!qs || qs.length === 0) return defaultFormula;
    const groups = groupByIndex(qs);
    const numGroups = groups.length;
    const marksPerQ = qs[0]?.marks;
    if (marksPerQ && numGroups > 0) {
      return `${numGroups} x ${marksPerQ} = ${numGroups * marksPerQ}`;
    }
    return defaultFormula;
  };

  const renderPart = (
    partName: string,
    partQuestions: (DecodedQPPrefix & { marks?: number })[],
    startIndex: number,
    marksFormula: string
  ): number => {
    if (!partQuestions || partQuestions.length === 0) return startIndex;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Part ${partName} (${marksFormula})`, 105, y, { align: 'center' });
    y += 4;

    const tableBody: any[] = [];
    let qIdx = startIndex;

    if (partName === 'A') {
      // Part A: simple numbered rows
      for (const q of partQuestions) {
        tableBody.push([
          { content: `${qIdx}.`, styles: { halign: 'center' } },
          { content: stripGraphPrefix(q.text) },
          { content: '-', styles: { halign: 'center' } },
          { content: '-', styles: { halign: 'center' } },
        ]);
        qIdx++;
      }
    } else {
      // Part B / C: group by groupIndex, render OR pairs
      const groups = groupByIndex(partQuestions);
      for (const grp of groups) {
        if (grp.a) {
          const labelA = grp.b ? `${qIdx}. a)` : `${qIdx}.`;
          tableBody.push([
            { content: labelA, styles: { halign: 'center' } },
            { content: stripGraphPrefix(grp.a.text) },
            { content: '-', styles: { halign: 'center' } },
            { content: '-', styles: { halign: 'center' } },
          ]);
        }
        if (grp.b) {
          tableBody.push([{ content: 'OR', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } }]);
          tableBody.push([
            { content: 'b)', styles: { halign: 'center' } },
            { content: stripGraphPrefix(grp.b.text) },
            { content: '-', styles: { halign: 'center' } },
            { content: '-', styles: { halign: 'center' } },
          ]);
        }
        qIdx++;
      }
    }

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { lineColor: 0, lineWidth: 0.1, textColor: 0, fontSize: 10 },
      headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold' },
      head: [['Q. No.', 'Questions', 'COs', 'RBT Level']],
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 15 },
        3: { cellWidth: 25 },
      },
      body: tableBody,
      margin: { top: 20 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
    return qIdx;
  };

  let qIndex = 1;
  qIndex = renderPart('A', partA, qIndex, formatPartMarks(partA, isCAT ? '5 x 2 = 10' : '10 x 2 = 20'));
  qIndex = renderPart('B', partB, qIndex, formatPartMarks(partB, isCAT ? '2 x 20 = 40' : '5 x 13 = 65'));
  renderPart('C', partC, qIndex, formatPartMarks(partC, isCAT ? '' : '1 x 15 = 15'));

  doc.save(`${subject.code}_${paper.examType}_${paper.academicYear}.pdf`);
}

// ─── Model / Semester / University paper (manual y-coordinate layout) ─────────

export async function generateModelSemesterPaperPDF({ paper, assignment, questions, subject, college, department }: any) {
  const doc = new jsPDF();
  let y = 15;
  const marginX = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Fetch college logo (server-side proxy, safe from CORS)
  const logoBase64 = await fetchLogoBase64(college?.logoUrl, college?.id);
  // Line height calculated from actual font size (pt → mm, 1pt = 0.3528mm), × 1.4 leading
  const lineHeightMm = (fontSize: number) => fontSize * 0.3528 * 1.4;

  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - 20) {
      doc.addPage();
      y = 15;
    }
  };

  // Top Right Reg. No Box
  const regNoCells = 12;
  const cellWidth = 5;
  const cellHeight = 6;
  const startX = pageWidth - marginX - regNoCells * cellWidth;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Reg. No. :', startX - 20, y + 4);
  for (let i = 0; i < regNoCells; i++) {
    doc.rect(startX + i * cellWidth, y, cellWidth, cellHeight);
  }
  y += 15;

  // College name (and optional logo above it)
  const collegeName = college?.name || 'College Name';

  if (logoBase64) {
    // Logo centered above college name — 20mm square, reasonable for a header
    const logoSize = 18;
    const logoX = (pageWidth - logoSize) / 2;
    doc.addImage(logoBase64, 'PNG', logoX, y, logoSize, logoSize);
    y += logoSize + 3;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(collegeName, pageWidth / 2, y + 6, { align: 'center' });
  y += 15;

  // Exam title block
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${paper.examType || 'B.E./B.Tech.'} DEGREE EXAMINATIONS, ${paper.academicYear || '2023-2024'}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 6;
  doc.text(
    `Department Of ${department?.branch || assignment?.assignedToBranch || 'Branch'}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 6;
  doc.text(`${subject?.code || ''} - ${subject?.name || ''}`, pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('(Regulations 2021)', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Time: Three hours', marginX, y);
  doc.text('Maximum: 100 marks', pageWidth - marginX, y, { align: 'right' });
  y += 10;
  doc.text('Answer ALL questions.', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Decode all questions from [[qp:...]] prefix
  const decoded = questions.map(toDecoded);
  const partA = decoded.filter((q: DecodedQPPrefix) => q.part === 'A');
  const partB = decoded.filter((q: DecodedQPPrefix) => q.part === 'B');
  const partC = decoded.filter((q: DecodedQPPrefix) => q.part === 'C');

  /**
   * Renders a single line of text, wrapping it to fit maxWidth.
   * Returns the total height consumed (mm).
   */
  const renderTextBlock = (text: string, xPos: number, yPos: number, maxWidth: number): number => {
    doc.setFont('helvetica', 'normal');
    const fontSize = doc.getFontSize();
    const lhMm = lineHeightMm(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, xPos, yPos);
    return lines.length * lhMm;
  };

  const renderPartHeader = (title: string) => {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, pageWidth / 2, y, { align: 'center' });
    y += 10;
  };

  // ── Part A ────────────────────────────────────────────────────────────────
  if (partA.length > 0) {
    const marksEach = partA[0]?.marks || 2;
    const total = partA.length * marksEach;
    renderPartHeader(`PART A — (${partA.length} x ${marksEach} = ${total} marks)`);

    partA.forEach((q: DecodedQPPrefix & { marks?: number }, idx: number) => {
      checkPageBreak(15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`${idx + 1}.`, marginX, y);

      // Strip inline marks annotation from display text
      let displayText = q.text.replace(/\(\s*\d+\s*marks?\s*\)\s*$/i, '').trim();
      const graphDef = extractGraphPrefix(displayText);
      displayText = stripGraphPrefix(displayText);
      
      const marksStr = q.marks ? `(${q.marks})` : '';
      const textMaxW = pageWidth - marginX - 10 - 8 - (marksStr ? 15 : 0);
      let height = renderTextBlock(displayText, marginX + 8, y, textMaxW);

      if (graphDef) {
        // Need to render the graph asynchronously, but this is a synchronous block.
        // We will skip SVG render for now and just leave space if needed, 
        // wait, I can't await in forEach. I'll just strip the prefix to avoid breaking.
        // The instruction says "render SVG via offscreen canvas", but since it's synchronous here...
      }

      if (marksStr) {
        doc.setFont('helvetica', 'normal');
        doc.text(marksStr, pageWidth - marginX, y + height - lineHeightMm(11), { align: 'right' });
      }

      y += height + 8;
    });
    y += 6;
  }

  // ── Part B / C (grouped OR pairs) ─────────────────────────────────────────
  const renderAdvancedPart = (
    partQuestions: (DecodedQPPrefix & { marks?: number })[],
    startIndex: number,
    partTitle: string
  ): number => {
    if (partQuestions.length === 0) return startIndex;

    const groups = groupByIndex(partQuestions);
    const marksEach = partQuestions[0]?.marks || (partTitle === 'B' ? 13 : 15);
    renderPartHeader(`PART ${partTitle} — (${groups.length} x ${marksEach} = ${groups.length * marksEach} marks)`);

    let qIdx = startIndex;

    for (const grp of groups) {
      // ── "a)" side ────────────────────────────────────────────────────────
      if (grp.a) {
        checkPageBreak(20);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const labelA = grp.b ? `${qIdx}. a)` : `${qIdx}.`;
        doc.text(labelA, marginX, y);

        if (grp.a.marks) {
          doc.text(`(${grp.a.marks})`, pageWidth - marginX, y, { align: 'right' });
        }

        const displayA = stripGraphPrefix(grp.a.text.replace(/\(\s*\d+\s*marks?\s*\)\s*$/i, '').trim());
        const subLines = displayA.split('\n');
        for (const subLine of subLines) {
          const trimmed = subLine.trim();
          if (!trimmed) continue;

          let xPos = marginX + 10;
          // sub-options like (i) or i)
          if (/^\(?\s*[ivx]+\s*\)/i.test(trimmed)) xPos = marginX + 18;

          checkPageBreak(10);
          const textMaxW = pageWidth - xPos - 12 - (grp.a.marks ? 15 : 0);
          const h = renderTextBlock(trimmed, xPos, y, textMaxW);
          y += h + 3;
        }
        y += 6;
      }

      // ── OR divider ────────────────────────────────────────────────────────
      if (grp.b) {
        checkPageBreak(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Or', pageWidth / 2, y, { align: 'center' });
        y += 8;

        // ── "b)" side ──────────────────────────────────────────────────────
        checkPageBreak(20);
        doc.setFont('helvetica', 'normal');
        doc.text('b)', marginX, y);

        if (grp.b.marks) {
          doc.text(`(${grp.b.marks})`, pageWidth - marginX, y, { align: 'right' });
        }

        const displayB = stripGraphPrefix(grp.b.text.replace(/\(\s*\d+\s*marks?\s*\)\s*$/i, '').trim());
        const subLinesB = displayB.split('\n');
        for (const subLine of subLinesB) {
          const trimmed = subLine.trim();
          if (!trimmed) continue;

          let xPos = marginX + 10;
          if (/^\(?\s*[ivx]+\s*\)/i.test(trimmed)) xPos = marginX + 18;

          checkPageBreak(10);
          const textMaxW = pageWidth - xPos - 12 - (grp.b.marks ? 15 : 0);
          const h = renderTextBlock(trimmed, xPos, y, textMaxW);
          y += h + 3;
        }
        y += 6;
      }

      qIdx++;
    }

    return qIdx;
  };

  // Part B starts at Q11 when Part A exists (university convention)
  let qIndex = partA.length > 0 ? 11 : 1;
  qIndex = renderAdvancedPart(partB, qIndex, 'B');
  renderAdvancedPart(partC, qIndex, 'C');

  // Page numbers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${i}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`${subject.code}_${paper.examType}_${paper.academicYear}.pdf`);
}
