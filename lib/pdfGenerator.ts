import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateQuestionPaperPDF({ paper, assignment, questions, subject, college, department }: any) {
  const doc = new jsPDF();

  const isCAT = ['CAT1', 'CAT2', 'CAT3', 'CAT 1', 'CAT 2', 'CAT 3'].includes(paper.examType.toUpperCase().replace(/\s+/g, ''));

  // Separate questions by part based on extraction
  const partA = questions.filter((q: any) => q.part === 'A');
  const partB = questions.filter((q: any) => q.part === 'B');
  const partC = questions.filter((q: any) => q.part === 'C');

  // Fallbacks if part tags are missing but total questions exist
  if (partA.length === 0 && questions.length > 0) {
    if (isCAT) {
      partA.push(...questions.slice(0, 5));
      partB.push(...questions.slice(5));
    } else {
      partA.push(...questions.slice(0, 10));
      partB.push(...questions.slice(10, 15));
      partC.push(...questions.slice(15));
    }
  }

  const totalMarks = isCAT ? 50 : 100;
  const duration = isCAT ? '1.5 Hrs' : '03 Hrs';
  const examDate = paper.examDate ? new Date(paper.examDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  let y = 10;

  // Top right regulation
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Regulation: 2021", 195, y, { align: 'right' });
  y += 3;

  // Calculate marks string for table header if we can sum it up
  // Or just use placeholders
  const partAMarksSum = partA.reduce((sum: number, q: any) => sum + (q.marks || 2), 0);
  // If there are OR questions, the sum would be halved. For simplicity, if partB has more than 5 questions in university, it's likely OR.
  const partBMarksSum = partB.reduce((sum: number, q: any) => sum + (q.marks || (isCAT ? 20 : 13)), 0);
  const partCMarksSum = partC.reduce((sum: number, q: any) => sum + (q.marks || 15), 0);

  // Outer Header Box using autoTable
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { lineWidth: 0.1, lineColor: 0, cellPadding: 2, fontSize: 10, textColor: 0 },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center', valign: 'middle' }, // Logo placeholder
      1: { halign: 'center', valign: 'middle' },
      2: { cellWidth: 40, halign: 'left' }
    },
    body: [
      [
        { content: '[ LOGO ]', rowSpan: 2 },
        { content: `${college?.name || 'College Name'}\nDegree/Branch: Department Of ${department?.branch || assignment.assignedToBranch || 'Branch'}(${department?.name || 'Department'})`, styles: { fontStyle: 'bold' } },
        { content: `Date: ${examDate}\nMarks: ${totalMarks}\nDuration: ${duration}` }
      ],
      [
        { content: `Academic Year: ${paper.academicYear}\nSub Code & Name: ${subject.code}/${subject.name}`, styles: { halign: 'left' } },
        { content: `Year/Sec: ${assignment.assignedToYear || '-'}/${assignment.assignedToSection || '-'}\nExam: ${paper.examType}`, styles: { halign: 'left' } }
      ]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // Center instruction
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Answer All the Questions", 105, y, { align: 'center' });
  y += 5;

  // Generic Part Renderer
  const renderPart = (partName: string, partQuestions: any[], startIndex: number, marksFormula: string) => {
    if (!partQuestions || partQuestions.length === 0) return startIndex;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Part ${partName} (${marksFormula})`, 105, y, { align: 'center' });
    y += 4;

    const tableBody: any[] = [];
    let qIdx = startIndex;

    for (let i = 0; i < partQuestions.length; i++) {
      const q = partQuestions[i];

      // If Part B or C has OR questions, they might be stored sequentially or joined
      // Let's assume standard Q. No handling

      // If we detect an "OR" string or if we are alternating a/b manually
      const isOr = q.text.toUpperCase().trim() === 'OR';

      if (isOr) {
        tableBody.push([{ content: 'OR', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } }]);
      } else {
        // If it's a paired question (like 11.a and 11.b)
        // Since we don't have the exact a/b parsing, we'll just number them sequentially for now
        // or check if it matches a paired pattern

        let qNumStr = `${qIdx}.`;

        // Very basic OR pairing if we know it's Part B and it's every two questions with OR in between
        // We'll leave it as simple numbering for robustness if no "OR" string is found

        tableBody.push([
          { content: qNumStr, styles: { halign: 'center' } },
          { content: q.text },
          { content: '-', styles: { halign: 'center' } }, // CO placeholder
          { content: '-', styles: { halign: 'center' } }  // RBT placeholder
        ]);
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
        3: { cellWidth: 25 }
      },
      body: tableBody,
      margin: { top: 20 }
    });

    y = (doc as any).lastAutoTable.finalY + 8;
    return qIdx;
  };

  const formatPartMarks = (qs: any[], defaultFormula: string) => {
    if (!qs || qs.length === 0) return defaultFormula;
    const firstQ = qs[0];
    if (firstQ.marks) {
      // Just showing total marks for the part or dynamically calculating based on questions
      // If it's Part B in University, it might have ORs, so just show the marks per question
      const hasOr = qs.some((q: any) => q.text.toUpperCase().trim() === 'OR');
      let numQs = qs.length;
      if (hasOr) {
        numQs = Math.ceil(qs.length / 2);
      }
      return `${numQs} x ${firstQ.marks} = ${numQs * firstQ.marks}`;
    }
    return defaultFormula;
  };

  let qIndex = 1;
  qIndex = renderPart('A', partA, qIndex, formatPartMarks(partA, isCAT ? `5 x 2 = 10` : `10 x 2 = 20`));
  qIndex = renderPart('B', partB, qIndex, formatPartMarks(partB, isCAT ? `2 x 20 = 40` : `5 x 13 = 65`));
  qIndex = renderPart('C', partC, qIndex, formatPartMarks(partC, isCAT ? `` : `1 x 15 = 15`));

  doc.save(`${subject.code}_${paper.examType}_${paper.academicYear}.pdf`);
}

export function generateModelSemesterPaperPDF({ paper, assignment, questions, subject, college, department }: any) {
  const doc = new jsPDF();
  let y = 15;
  const marginX = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

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
  const startX = pageWidth - marginX - (regNoCells * cellWidth);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Reg. No. :", startX - 20, y + 4);

  for (let i = 0; i < regNoCells; i++) {
    doc.rect(startX + (i * cellWidth), y, cellWidth, cellHeight);
  }
  y += 15;

  // College Name (Centered)
  const collegeName = college?.name || 'College Name';
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(collegeName, pageWidth / 2, y + 6, { align: "center" });
  y += 15;

  // Exam Title Block
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const degreeLine = `${paper.examType || 'B.E./B.Tech.'} DEGREE EXAMINATIONS, ${paper.academicYear || '2023-2024'}`;
  doc.text(degreeLine, pageWidth / 2, y, { align: "center" });
  y += 6;

  const branchLine = `Department Of ${department?.branch || assignment?.assignedToBranch || 'Branch'}`;
  doc.text(branchLine, pageWidth / 2, y, { align: "center" });
  y += 6;

  const subjectLine = `${subject?.code || ''} - ${subject?.name || ''}`;
  doc.text(subjectLine, pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFont("helvetica", "normal");
  const regLine = `(Regulations 2021)`;
  doc.text(regLine, pageWidth / 2, y, { align: "center" });
  y += 10;

  // Time and Marks
  doc.setFont("helvetica", "bold");
  doc.text("Time: Three hours", marginX, y);
  doc.text(`Maximum: 100 marks`, pageWidth - marginX, y, { align: "right" });
  y += 10;

  // Instruction
  doc.text("Answer ALL questions.", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Separate questions by part based on extraction
  const partA = questions.filter((q: any) => q.part === 'A');
  const partB = questions.filter((q: any) => q.part === 'B');
  const partC = questions.filter((q: any) => q.part === 'C');

  // Helper
  const renderTextWithIndent = (text: string, xPos: number, currentY: number, maxWidth: number) => {
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, xPos, currentY);
    return lines.length * 5; // approx 5mm per line
  };

  const renderPartHeader = (title: string) => {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageWidth / 2, y, { align: "center" });
    y += 10;
  };

  // Render Part A
  if (partA.length > 0) {
    const partAMarksSum = partA.reduce((sum: number, q: any) => sum + (q.marks || 2), 0);
    renderPartHeader(`PART A — (${partA.length} x ${partA[0]?.marks || 2} = ${partAMarksSum} marks)`);

    partA.forEach((q: any, idx: number) => {
      checkPageBreak(15);
      const qNum = `${idx + 1}.`;
      doc.setFont("helvetica", "normal");
      doc.text(qNum, marginX, y);
      
      let lineText = q.text.trim();
      let lineMarks = '';
      const marksMatch = lineText.match(/\s*\(\s*(\d+)\s*marks?\s*\)\s*$/i) || lineText.match(/\s*\(\s*(\d+)\s*\)\s*$/i);
      if (marksMatch) {
         lineMarks = marksMatch[1];
         lineText = lineText.replace(marksMatch[0], '');
      }

      const textHeight = renderTextWithIndent(lineText, marginX + 8, y, pageWidth - marginX - 10 - 8 - (lineMarks ? 15 : 0));
      
      if (lineMarks) {
         doc.setFont("helvetica", "normal");
         doc.text(`(${lineMarks})`, pageWidth - marginX, y + textHeight - 5, { align: "right" });
      }

      y += textHeight + 12; // INCREASED: Proper gapping between Part A questions
    });
    y += 10; // Extra gap before next part
  }

  // Render Part B / C
  const renderAdvancedPart = (partQuestions: any[], startIndex: number, partTitle: string) => {
    if (partQuestions.length === 0) return startIndex;

    let realQCount = partQuestions.length;
    const hasOr = partQuestions.some((q: any) => q.text.toUpperCase().trim() === 'OR');
    if (hasOr) {
      realQCount = Math.ceil(partQuestions.length / 2);
    }
    const marksPerQ = partQuestions[0]?.marks || (partTitle === 'B' ? 13 : 15);
    renderPartHeader(`PART ${partTitle} — (${realQCount} x ${marksPerQ} = ${realQCount * marksPerQ} marks)`);

    let qIdx = startIndex;

    for (let i = 0; i < partQuestions.length; i++) {
      const q = partQuestions[i];
      const text = q.text.trim();

      const isLegacyOr = text.toUpperCase() === 'OR';
      if (isLegacyOr) {
        checkPageBreak(15);
        y += 2;
        doc.setFont("helvetica", "bold");
        doc.text("Or", pageWidth / 2, y, { align: "center" });
        y += 8;
        continue;
      }

      checkPageBreak(20);

      const isAfterLegacyOr = i > 0 && partQuestions[i - 1].text.toUpperCase().trim() === 'OR';
      if (!isAfterLegacyOr && !text.match(/^[0-9]+\./)) {
         doc.setFont("helvetica", "normal");
         doc.text(`${qIdx}.`, marginX, y);
      }

      // We print the marks at the end of the question block if q.marks exists 
      // AND it's a legacy style (no inline OR). If there are inline ORs, marks are handled per line.
      if (q.marks && !text.toUpperCase().includes('\nOR\n') && !text.toUpperCase().includes('\nOR \n')) {
         doc.setFont("helvetica", "normal");
         doc.text(`(${q.marks})`, pageWidth - marginX, y, { align: "right" });
      }

      const lines = text.split('\n');
      let currentY = y;
      
      lines.forEach((line: string) => {
        let xPos = marginX + 8;
        let lineText = line.trim();
        
        let lineMarks = '';
        const marksMatch = lineText.match(/\s*\(\s*(\d+)\s*marks?\s*\)\s*$/i) || lineText.match(/\s*\(\s*(\d+)\s*\)\s*$/i);
        if (marksMatch) {
           lineMarks = marksMatch[1];
           lineText = lineText.replace(marksMatch[0], '');
        }

        if (lineText.toUpperCase() === 'OR') {
          currentY += 6; // Space before OR
          checkPageBreak(15);
          doc.setFont("helvetica", "bold");
          doc.text("Or", pageWidth / 2, currentY, { align: "center" });
          currentY += 10; // Space after OR
          return; // skip to next line
        }
        
        if (
          lineText.match(/^\([a-z]\)/i) ||
          lineText.match(/^[a-z]\)/i)
        ) {
          xPos = marginX + 8;
        } else if (
          lineText.match(/^\([ivx]+\)/i) ||
          lineText.match(/^[ivx]+\)/i)
        ) {
          xPos = marginX + 16;
        } else if (isAfterLegacyOr) {
          xPos = marginX + 8;
        }

        const textHeight = renderTextWithIndent(lineText, xPos, currentY, pageWidth - xPos - 15 - (lineMarks ? 15 : 0));
        
        if (lineMarks) {
           doc.setFont("helvetica", "normal");
           doc.text(`(${lineMarks})`, pageWidth - marginX, currentY + textHeight - 5, { align: "right" });
        }
        
        currentY += textHeight + 4; // Extra space between lines/sub-options
      });
      
      y = currentY + 12; // INCREASED: Proper gapping between Part B/C main questions
      
      if (!isAfterLegacyOr) {
        qIdx++;
      }
    }

    return qIdx;
  };

  let qIndex = partA.length > 0 ? 11 : 1;
  qIndex = renderAdvancedPart(partB, qIndex, 'B');
  qIndex = renderAdvancedPart(partC, qIndex, 'C');

  // Add Footers to all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const footerY = pageHeight - 10;
    doc.text(`${i}`, pageWidth / 2, footerY, { align: 'center' });
  }

  doc.save(`${subject.code}_${paper.examType}_${paper.academicYear}.pdf`);
}
