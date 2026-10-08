// KEEP IN SYNC WITH BE src/modules/patterns/pattern.schema.ts
import { z } from 'zod';

const rbtLevels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as const;
const partNames = ['Part A', 'Part B', 'Part C', 'Part D', 'Part E'] as const;

export const PatternSlotSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(30).regex(/^[A-Za-z0-9 \-\/]+$/, 'Label can only contain letters, numbers, spaces, hyphens, and slashes'),
  marks: z.number().int().min(1).max(30),
  marksOptions: z.array(z.number().int().min(1).max(30)).max(4).default([]),
  isMcq: z.boolean().default(false),
}).refine(data => {
  if (data.isMcq && data.marksOptions && data.marksOptions.length > 0) {
    return false;
  }
  return true;
}, {
  message: 'MCQ slots cannot have marksOptions',
  path: ['marksOptions']
}).refine(data => {
  if (data.marksOptions && data.marksOptions.length > 0) {
    return data.marksOptions.includes(data.marks);
  }
  return true;
}, {
  message: 'marksOptions must include the default marks value if it is not empty',
  path: ['marksOptions']
});

export const PatternPartSchema = z.object({
  id: z.string().uuid().optional(),
  partName: z.enum(partNames),
  allowedRbt: z.array(z.enum(rbtLevels)).min(1).refine(
    (arr) => new Set(arr).size === arr.length,
    { message: 'allowedRbt must not contain duplicates' }
  ),
  hasChoice: z.boolean().default(false),
  slots: z.array(PatternSlotSchema).min(1).max(4),
});

export const QuestionPaperPatternSchema = z.object({
  regulation: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9-]{1,19}$/, 'Invalid regulation format'),
  label: z.string().max(100).optional().nullable(),
  parts: z.array(PatternPartSchema).min(1).max(5).refine(
    (arr) => new Set(arr.map(p => p.partName)).size === arr.length,
    { message: 'Parts must have unique partNames' }
  ),
}).strict();

export type PatternSlotType = z.infer<typeof PatternSlotSchema>;
export type PatternPartType = z.infer<typeof PatternPartSchema>;
export type QuestionPaperPatternType = z.infer<typeof QuestionPaperPatternSchema>;
