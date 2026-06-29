import React from 'react';
import { SharedSubjectPapers } from '@/components/questions/SharedSubjectPapers';

export default async function SubjectPapersPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  return <SharedSubjectPapers subjectId={subjectId} />;
}
