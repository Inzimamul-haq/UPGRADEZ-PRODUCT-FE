import { Message } from "@/lib/types";

export const CHAT_MESSAGES = {
  studentWelcome: (subject: string, examType: string) =>
    `Here are the **${examType}** questions for **${subject}**.

Where would you like to start? You can ask me for a **2-mark answer**, about syllabus, or help with any question.`,

  content: (subject: string, examType: string) =>
    `Ready to study **${subject}** — ${examType}. You can ask me anything about the paper, a topic, previous year questions, or ask me to **give you a 2-mark answer**.`,

  facultyWelcome: (subject: string, examType: string) =>
    `Hello! 👋 Let's work on **${subject}** — ${examType}.

What would you like to do?`,

  buttons: [
    { id: "pick_iq", label: "(a) Assign Important Questions" },
    { id: "pick_exam_paper", label: "(b) Generate Direct Exam Paper" },
  ],

  bothAlreadyAssigned: (
    subject: string,
    examType: string,
    cohortLabel: string,
    creditLines: string
  ) =>
    `Both the important questions and the exam paper are already assigned for **${subject}** (${examType}${
      cohortLabel ? " · " + cohortLabel : ""
    }).

${creditLines ? creditLines + "\n\n" : ""}There's nothing new to generate for this combination until the next academic cycle.

If you have any concerns about the existing content, please reach out to them directly before making changes.`,

  importantQuestionsAlreadyAssigned: (
    subject: string,
    examType: string,
    creatorName?: string | null
  ) =>
    `I can see important questions are already assigned for **${subject}** (${examType})${
      creatorName ? ` — published by **${creatorName}**` : ""
    }.

Would you like to generate the actual **Exam Paper** now? If you have any concerns about the existing questions, please reach out to them first.`,

  choosePaperFirst:
    `Please use the buttons above to choose between Important Questions or Exam Paper first. 👆`,

  importantQuestionsPrompt:
    `Great! Let's prepare **Important Questions** for this exam.

Please tell me:

1. Which chapter(s) should be covered?
2. Mark distribution — how many questions and of what mark value?
    
**Example:**
"From Chapter 2, give me 5 questions of 2 marks and 3 questions of 13 marks."`,

  examPaperPrompt:
    `Let's build the **Exam Paper** directly.

Please confirm:

1. Which chapter(s) should be covered?
2. Mark/part distribution (e.g. Part A: 10×2 marks, Part B: 3×13 marks)
3. Exam date

**Example:**
"Create an exam paper from Chapter 2 with Part A: 5×2 marks and Part B: 3×13 marks. Exam date: 25 August 2026."`,

  examPaperFromIQ:
    `Since we already have the chapters and marks from the important questions, how would you like to divide the questions in the actual exam paper (e.g., Part A, B, C)?

And what is the exam date?`,

  iqAssigned:
    `Great! Important questions have been assigned.

Ready to generate the actual **Exam Paper** now?`,

  apiError:
    `Unable to process your request. Please try again in a few moments.`,
};

export const ASSIGN_MODAL_MESSAGES = {
  checkingExamDate: "Checking exam date…",

  examDateRequiredTitle: "Exam date required",

  examDateRequiredDescription:
    "The linked important-questions paper has no exam date set. Enter it now to continue.",

  examDateRequiredNote:
    "Note: This will be reflected in the question paper, so please choose the correct date.",

  saveExamDate: "Set Exam Date & Continue",

  savingExamDate: "Saving…",

  lockedTitle: "Locked",

  lockedDescription: (date: string | null) =>
    `Assignment is not available until ${date ?? "the exam date"}.`,

  assignTo: "Assign To",

  cancel: "Cancel",

  assign: "Assign",

  assigning: "Assigning…",

  downloadPDF: "Download PDF",

  close: "Close",

  apiError: "Failed to save and assign",

  examDateError: "Failed to set exam date",

  duplicateAssignment: (section: string) =>
    `An exam paper is already assigned for ${
      section || "this cohort"
    }. Please verify before reassigning.`,

  successMessage: (
    kind: string,
    subject: string,
    exam: string,
    branch: string,
    year: string,
    section: string
  ) =>
    `${kind} assigned successfully.

${subject} — ${exam}
${branch} · ${year}
Section: ${section}

Students will be notified.`,
};