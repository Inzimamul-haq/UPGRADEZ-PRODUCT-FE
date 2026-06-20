import React from 'react';
import { PaperQuestionsClient } from './PaperQuestionsClient';
import { Question } from '@/lib/types';

export default async function PaperQuestionsPage({ params }: { params: Promise<{ subjectId: string, paperId: string }> }) {
  const { subjectId, paperId } = await params;
  
  const subjectName = "Data Structures";
  const examType = "CAT 1";
  const academicYear = "2023-24";
  
  const questions: Question[] = [
    { id: 'q1', paper_id: paperId, question_text: 'Explain the difference between a stack and a queue with real-world examples.', mark_type: '5M' },
    { id: 'q2', paper_id: paperId, question_text: 'Define a linked list.', mark_type: '2M' },
    { id: 'q3', paper_id: paperId, question_text: 'Write an algorithm to insert a node at the beginning of a singly linked list and discuss its time complexity.', mark_type: '13M' },
    { id: 'q4', paper_id: paperId, question_text: 'What is the time complexity of binary search?', mark_type: '2M' },
    { id: 'q5', paper_id: paperId, question_text: 'Compare array and linked list data structures in terms of memory allocation and basic operation efficiencies.', mark_type: '13M' },
  ];

  return (
    <PaperQuestionsClient 
      subjectId={subjectId}
      paperId={paperId}
      subjectName={subjectName}
      examType={examType}
      academicYear={academicYear}
      questions={questions}
    />
  );
}
