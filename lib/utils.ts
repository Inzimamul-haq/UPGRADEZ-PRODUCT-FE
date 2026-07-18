
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
  
  return cleaned.trim();
}

export function getMarksColor(marks?: number | null): string {
  if (!marks) return 'text-[#8C8C8A]'; // default
  if (marks <= 5) return 'text-green-500';
  if (marks <= 10) return 'text-orange-500';
  return 'text-red-500';
}