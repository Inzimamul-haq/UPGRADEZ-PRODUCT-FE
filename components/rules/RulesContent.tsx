import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const rulesMarkdown = `
# Rules Context — Faculty & Admin

## 1. Delete Rules — Important Questions & Exam Papers

**When an Exam Paper is deleted:**
Only that Exam Paper is removed. The Important Questions it was linked to are left untouched and remain available to students.

**When an Important Question is deleted:**
Any Exam Paper linked to it is deleted along with it, because the Exam Paper depends on that Important Question — it can't exist without its parent.

> Important Questions are the parent. Exam Papers are the dependent. Deleting a parent takes its dependents with it; deleting a dependent never touches the parent.

---

## 2. Subject Processing Rule

When a new Subject is added, it needs about **3–5 minutes** to finish processing in the background before it's ready for AI operations like question paper generation. If Faculty try to generate a paper before that window has passed, the system should hold off rather than run on an incomplete subject.

---

## 3. AI Question Paper Difficulty Rules

When Faculty pick a difficulty mode, it controls the mix of questions the AI is asked to generate:

- **Simple** — aims for 95% direct, straightforward syllabus questions, 5% slight variation
- **Medium** — aims for 80% direct, 20% problem-solving / application questions
- **Hard** — aims for 75% direct, 25% scenario-based / application questions

These are targets given to the AI, not a guarantee — an individual paper may not hit the exact percentage.

---

## 4. Important Questions — Assignment Timing

Important Questions can be assigned **at any time**, with no date restriction at all. There's no check against an exam date for this type — the only thing that blocks assigning one is if a duplicate already exists for that same subject/exam type/cohort.

---

## 5. Exam Paper — Assignment Timing

This is where it gets specific, and it actually works two different ways depending on whether the Exam Paper is linked to an Important Questions set or not:

**If it's a direct Exam Paper (no linked IQ):**
It can only be assigned **on today's date** — not before, not scheduled for later. If the selected date isn't exactly today, the assignment is rejected.

**If it's an Exam Paper linked to an Important Questions set:**
It's gated by the *linked IQ's* exam date, not "today" directly. Specifically:
- If that IQ has no exam date set yet, Faculty are prompted to set one before continuing.
- If the exam date is still in the future, the assignment is locked and blocked until that date arrives.
- Once today's date has reached or passed the IQ's exam date, the assignment is allowed to go through.

So a direct paper is "today only," while a linked paper is "on or after the IQ's exam date" — they're not the same rule even though both are described as "exam date restricted."

---

## 6. Duplicate Assignment Checks

Before anything gets assigned, the system checks whether the same kind of paper already exists for that subject, exam type, and cohort (year/department/section):

- An Important Questions set can't be assigned twice for the same cohort.
- A direct Exam Paper can't be assigned twice for the same section.
- A linked Exam Paper can't be assigned twice against the same Important Questions paper for the same section.

If any of these already exist, the new assignment is rejected and the Faculty member is told who already assigned it, so they can follow up instead of duplicating work.

---

## 7. Core Difference: Important Questions vs Exam Papers

| Feature                            | Important Questions                   | Exam Paper                                      |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------ |
| Purpose                            | Student study/preparation             | Actual examination                              |
| Can be assigned anytime?           | ✅ Yes                                 | ❌ Date restricted (see Rule 5)                  |
| Delete behavior                    | Deleting it deletes linked Exam Paper | Deleting it does NOT delete Important Questions |
| Dependency                         | Parent                                | Dependent on Important Question                 |
`;

const mdComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-[20px] font-semibold text-[#ECECEA] pb-4 mb-6 border-b border-[#3A3A38]">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-[15px] font-medium text-[#ECECEA] mt-10 mb-3 first:mt-0">
      {children}
    </h2>
  ),
  p: ({ children }: any) => (
    <p className="text-[13px] leading-relaxed text-[#ADADAB] mb-3">{children}</p>
  ),
  strong: ({ children }: any) => (
    <strong className="text-[#ECECEA] font-medium">{children}</strong>
  ),
  ul: ({ children }: any) => (
    <ul className="space-y-1.5 mb-4 mt-1">{children}</ul>
  ),
  li: ({ children }: any) => (
    <li className="flex gap-2 text-[13px] text-[#ADADAB] leading-relaxed">
      <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-[#5A5A58]" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="bg-[#2C2C2A] border-l-2 border-amber-400 rounded-r-lg px-4 py-2.5 my-4 text-[12px] text-amber-200/90">
      {children}
    </blockquote>
  ),
  hr: () => <div className="my-8 border-t border-[#3A3A38]" />,
  code: ({ children }: any) => (
    <code className="bg-[#2C2C2A] border border-[#3A3A38] rounded px-1.5 py-0.5 text-[12px] text-orange-300 font-mono">
      {children}
    </code>
  ),
  table: ({ children }: any) => (
    <div className="my-4 rounded-xl border border-[#3A3A38] overflow-hidden">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-[#2C2C2A]">{children}</thead>,
  th: ({ children }: any) => (
    <th className="text-left text-[10px] uppercase tracking-wide font-medium text-[#8C8C8A] px-4 py-2.5 border-b border-[#3A3A38]">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="text-[12px] text-[#ECECEA] px-4 py-2.5 border-t border-[#3A3A38]">
      {children}
    </td>
  ),
};

export function RulesContent() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#1C1C1B] text-[#ECECEA]">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {rulesMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}