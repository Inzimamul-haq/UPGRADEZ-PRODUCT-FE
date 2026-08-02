
export function relativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

export interface ParsedQuestion {
  text: string;
  part?: string;
  marks?: number;
}

export function cleanQuestionText(text: string): string {
  if (!text) return text;
  
  // Remove "Part - B", "Part B", "**Part B**" at the start or inside the text
  let cleaned = text.replace(/\*\*Part\s+[A-Z]\*\*/gi, '');
  cleaned = cleaned.replace(/Part\s*-\s*[A-Z]/gi, '');
  cleaned = cleaned.replace(/^Part\s+[A-Z]\s*/gi, '');
  
  // Remove marks at the end like "(2 Marks)", "[13 marks]", etc.
  cleaned = cleaned.replace(/\s*[\(\[]\s*\d+\s*[Mm]arks?\s*[\)\]]\s*$/g, '');
  
  // Also remove standalone "2 Marks" at the end if there's a dash before it like "- 2 Marks"
  cleaned = cleaned.replace(/\s*-\s*\d+\s*[Mm]arks?\s*$/g, '');
  
  // Strip the leading question number if it exists (e.g. "1. ") since QuestionRow already prepends Q1
  cleaned = cleaned.replace(/^\s*\d+\.\s*/, '');
  
  return cleaned.trim();
}

export function getMarksColor(marks?: number | null): string {
  if (!marks) return 'text-[#8C8C8A]'; // default
  if (marks <= 5) return 'text-green-500';
  if (marks <= 10) return 'text-orange-500';
  return 'text-red-500';
}

export const REGEX_PATTERNS = {
  ACADEMIC_YEAR: /^\d{4}-\d{2}$/,
  BATCH_YEAR: /^(\d{4})\s*-\s*(\d{4})$/,
  ALPHANUMERIC: /^[A-Za-z0-9]+$/,
  LETTERS_ONLY_GLOBAL: /[A-Za-z]/g,
  REPETITIVE_PATTERN: /^([A-Za-z0-9])\1+$/,
  NON_DIGITS: /\D/g,
  FILE_EXTENSION: /\.[^/.]+$/,
};

export function validateBatchYear(val: string, maxYears: number): string {
  if (!val) return 'Required';
  const match = val.match(REGEX_PATTERNS.BATCH_YEAR);
  if (!match) return 'Format should be YYYY-YYYY (e.g. 2022-2026)';
  const start = parseInt(match[1]);
  const end = parseInt(match[2]);
  if (start >= end) return 'End year must be greater than start year';
  if (end - start > maxYears + 2) return `Duration cannot exceed ${maxYears + 2} years`;
  if (start < 2000 || start > 2050) return 'Invalid start year';
  return '';
}

export function validateRollNo(val: string): string {
  if (!val) return 'Required';
  if (!REGEX_PATTERNS.ALPHANUMERIC.test(val)) return 'Must contain only letters and numbers';
  const letterCount = (val.match(REGEX_PATTERNS.LETTERS_ONLY_GLOBAL) || []).length;
  if (letterCount > 2) return 'Can contain at most 2 letters';
  if (REGEX_PATTERNS.REPETITIVE_PATTERN.test(val)) return 'Invalid repetitive pattern (e.g. 1111)';
  if (val.length < 4) return 'Roll number too short';
  return '';
}

export function extractNumber(text: string): string {
  return text.replace(REGEX_PATTERNS.NON_DIGITS, '');
}

export function removeFileExtension(filename: string): string {
  if (!filename) return '';
  return filename.replace(REGEX_PATTERNS.FILE_EXTENSION, '');
}

export function extractErrorMessage(error: any, defaultMessage: string = 'An unexpected error occurred'): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return defaultMessage;
}