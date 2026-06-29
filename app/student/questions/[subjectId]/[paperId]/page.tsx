import React from 'react';
import { SharedPaperQuestions } from '@/components/questions/SharedPaperQuestions';

export default async function PaperQuestionsPage({ params }: { params: Promise<{ subjectId: string, paperId: string }> }) {
  const { subjectId, paperId } = await params;
  return <SharedPaperQuestions subjectId={subjectId} paperId={paperId} />;
}
