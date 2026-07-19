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
       const hasOr = qs.some((q:any) => q.text.toUpperCase().trim() === 'OR');
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
