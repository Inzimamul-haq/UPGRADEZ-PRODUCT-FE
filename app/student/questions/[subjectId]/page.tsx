import React from 'react';
import { SubjectPapersClient } from './SubjectPapersClient';
import { Paper } from '@/lib/types';

export default async function SubjectPapersPage({ params }: { params: { subjectId: string } }) {
  const subjectId = params.subjectId;
  const subjectName = "Data Structures";
  const subjectCode = "CS201";
  
  const papers: Paper[] = [
    { id: 'p1', subject_id: subjectId, exam_type: 'CAT 1', academic_year: '2023-24', source: 'historical' },
    { id: 'p2', subject_id: subjectId, exam_type: 'CAT 1', academic_year: '2022-23', source: 'historical' },
    { id: 'p3', subject_id: subjectId, exam_type: 'CAT 2', academic_year: '2023-24', source: 'historical' },
    { id: 'p4', subject_id: subjectId, exam_type: 'Model', academic_year: '2023-24', source: 'historical' },
    { id: 'p5', subject_id: subjectId, exam_type: 'University', academic_year: '2022-23', source: 'historical' },
  ];

  return (
    <SubjectPapersClient 
      subjectId={subjectId} 
      subjectName={subjectName} 
      subjectCode={subjectCode} 
      papers={papers} 
    />
  );
}
