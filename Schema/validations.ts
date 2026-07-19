import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  collegeId: z.string().uuid("Invalid college ID"),
});

export const accessCodeSchema = z.object({
  accessCode: z.string().min(1, "College Access Code is required"),
});

export const settingsNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const settingsPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  year: z.string().min(1, "Year is required"),
  regulation: z.string().min(1, "Regulation is required"),
  departmentIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one department"),
});

export const syllabusSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
  credits: z.number().min(1, "Credits must be greater than 0"),
});

export const departmentSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required")
    .max(50, "Department name cannot exceed 50 characters"),
  branch: z.string().min(1, "Branch is required"),
  hodId: z.string().uuid("Invalid HoD ID").optional(),
});

export const bulkPromoteSchema = z.object({
  currentYear: z.number().min(1).max(4),
  departmentId: z.string().uuid("Invalid department ID").optional(),
  targetYear: z.number().min(2).max(5),
});

export const studentEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  rollNo: z.string().min(1, "Roll Number is required"),
  batchYear: z.string().regex(/^\d{4}-\d{4}$/, "Batch Year must be in YYYY-YYYY format"),
  year: z.number().min(1).max(4),
  section: z.string().optional(),
});

export const facultyEditSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  departmentId: z.string().uuid("Invalid department ID").optional(),
  assignedSubjects: z.array(z.string().uuid()).optional(),
});
