// KEEP IN SYNC WITH BE src/modules/patterns/pattern.schema.ts
import { z } from 'zod';

const rbtLevels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as const;
const partNames = ['Part A', 'Part B', 'Part C', 'Part D', 'Part E'] as const;
const examTypes = ['CAT1', 'CAT2', 'CAT3', 'MODEL', 'UNIVERSITY', 'ARREAR', 'ALL'] as const;

export const PatternSlotSchema = z.object({
  id: z.string().uuid().optional(),
  marks: z.number().int().min(1).max(30),
  isMcq: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  defaultCount: z.number().int().min(1).max(50).default(1),
});

export const PatternPartSchema = z.object({
  id: z.string().uuid().optional(),
  partName: z.enum(partNames),
  allowedRbt: z.array(z.enum(rbtLevels)).min(1).refine(
    (arr) => new Set(arr).size === arr.length,
    { message: 'allowedRbt must not contain duplicates' }
  ),
  hasChoice: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  slots: z.array(PatternSlotSchema).min(1).max(4),
});

export const QuestionPaperPatternSchema = z.object({
  regulation: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9-]{1,19}$/, 'Invalid regulation format'),
  examType: z.enum(examTypes),
  parts: z.array(PatternPartSchema).min(1).max(5).refine(
    (arr) => new Set(arr.map(p => p.partName)).size === arr.length,
    { message: 'Parts must have unique partNames' }
  ),
}).strict();

export type PatternSlotType = z.infer<typeof PatternSlotSchema>;
export type PatternPartType = z.infer<typeof PatternPartSchema>;
export type QuestionPaperPatternType = z.infer<typeof QuestionPaperPatternSchema>;
