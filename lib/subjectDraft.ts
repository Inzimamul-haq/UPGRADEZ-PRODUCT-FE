const DRAFT_KEY = "studymate_subject_draft";
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SubjectDraft = {
  name: string;
  code: string;
  departmentIds: string[];
  year: string;
  regulation: string;
  courseOutcomes?: { code: string; description: string }[];
  step: 1 | 2 | 3;
  savedAt: number;
};

export function saveDraft(draft: Omit<SubjectDraft, "savedAt">): void {
  try {
    const payload: SubjectDraft = { ...draft, savedAt: Date.now() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

export function loadDraft(): SubjectDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft: SubjectDraft = JSON.parse(raw);
    if (!draft.savedAt || Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
