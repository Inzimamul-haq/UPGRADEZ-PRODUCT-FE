export function normalizeExamTypeKey(examType: string): string {
  return examType.toUpperCase().replace(/\s+/g, '');
}

/** Map DB exam type (CAT1, CIA 2, etc.) to the tab label shown in ExamTypeTabs. */
export function examTypeToTab(examType: string, isEngineering = true): string {
  const key = normalizeExamTypeKey(examType).replace(/^CIA/, 'CAT');

  const tabs: Record<string, { eng: string; arts: string }> = {
    CAT1: { eng: 'CAT 1', arts: 'CIA 1' },
    CAT2: { eng: 'CAT 2', arts: 'CIA 2' },
    CAT3: { eng: 'CAT 3', arts: 'CIA 3' },
    MODEL: { eng: 'Model', arts: 'Model' },
    UNIVERSITY: { eng: 'University', arts: 'University' },
  };

  const entry = tabs[key];
  if (!entry) return isEngineering ? 'CAT 1' : 'CIA 1';
  return isEngineering ? entry.eng : entry.arts;
}
