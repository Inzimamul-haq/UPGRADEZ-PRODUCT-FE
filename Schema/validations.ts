import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const settingsNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  branch: z.string().min(1, "Branch is required"),
  year: z.string().min(1, "Year is required"),
  regulation: z.string().min(1, "Regulation is required"),
  departmentIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one department"),
});

export const departmentSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required")
    .max(50, "Department name cannot exceed 50 characters"),
  branch: z.string().min(1, "Branch is required"),
});
