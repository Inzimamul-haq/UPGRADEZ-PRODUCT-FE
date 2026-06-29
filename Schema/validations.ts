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
  qualification: z
    .string()
    .min(1, "Qualification is required")
    .refine((val) => val.includes("/"), {
      message: "Must follow format: DEGREE/BRANCH",
    }),
  year: z.string().min(1, "Year is required"),
  regulation: z.string().min(1, "Regulation is required"),
});
