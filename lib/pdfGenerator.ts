import jsPDF from 'jspdf';

export function generateQuestionPaperPDF({ paper, assignment, questions, subject }: any) {
  const doc = new jsPDF();

  const isCAT = ['CAT1', 'CAT2', 'CAT3', 'CAT 1', 'CAT 2', 'CAT 3'].includes(paper.examType.toUpperCase().replace(/\s+/g, ''));

  const partA = questions.slice(0, 5);
  const partB = isCAT ? questions.slice(5, 8) : questions.slice(5, 10);
  const partC = isCAT ? questions.slice(8, 9) : questions.slice(10, 11);

  const totalMarks = isCAT ? 50 : 100;
  const duration = isCAT ? '1.5 Hours' : '3 Hours';

  let y = 15;

  // Header
  doc.setFontSize(14);
  doc.text("C. Abdul Hakeem College of Engineering", 105, y, { align: 'center' });
  y += 10;

  doc.setFontSize(11);
  doc.text(`Exam Type: ${paper.examType}`, 14, y);
  doc.text(`Academic Year: ${paper.academicYear}`, 140, y);
  y += 7;

  doc.text(`Subject: ${subject.name} (${subject.code})`, 14, y);
  y += 7;

  doc.text(`Department: ${subject.department || '-'}`, 14, y);
  y += 7;

  doc.text(`Branch: ${assignment.assignedToBranch}`, 14, y);
  doc.text(`Year: ${assignment.assignedToYear}`, 100, y);
  doc.text(`Section: ${assignment.assignedToSection || '-'}`, 150, y);
  y += 7;

  doc.text(`Total Marks: ${totalMarks}`, 14, y);
  doc.text(`Duration: ${duration}`, 140, y);
  y += 12;

  // PART A
  doc.setFontSize(12);
  doc.text("PART - A (10 Marks)", 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.text("Answer ALL Questions", 14, y);
  y += 8;

  partA.forEach((q: any, i: number) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${q.text}`, 180);
    doc.text(lines, 14, y);
    y += 6 * lines.length + 2;
  });

  // PART B
  y += 4;
  if (y > 270) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.text(`PART - B (${isCAT ? 36 : 65} Marks)`, 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(isCAT ? "Answer ANY THREE Questions" : "Answer ANY FIVE Questions", 14, y);
  y += 8;

  partB.forEach((q: any, i: number) => {
    const lines = doc.splitTextToSize(`${i + 6}. ${q.text}`, 180);
    if (y + (6 * lines.length) > 280) { doc.addPage(); y = 20; }
    doc.text(lines, 14, y);
    y += 6 * lines.length + 4;
  });

  // PART C
  if (partC.length > 0) {
    y += 4;
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text(`PART - C (${isCAT ? 14 : 15} Marks)`, 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text("Answer the following", 14, y);
    y += 8;

    partC.forEach((q: any, i: number) => {
      const lines = doc.splitTextToSize(`${partA.length + partB.length + i + 1}. ${q.text}`, 180);
      if (y + (6 * lines.length) > 280) { doc.addPage(); y = 20; }
      doc.text(lines, 14, y);
      y += 6 * lines.length + 4;
    });
  }

  doc.save(`${subject.code}_${paper.examType}_${paper.academicYear}.pdf`);
}
