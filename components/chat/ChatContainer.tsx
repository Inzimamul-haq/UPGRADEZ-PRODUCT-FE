"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Subject, Message } from '@/lib/types';
import { ChatStepOverlay } from './ChatStepOverlay';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AssignModal } from './AssignModal';
import { QuestionsPanel } from './QuestionsPanel';
import api from '@/lib/api';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { SessionData, ChatContainerProps, PaperKind } from "@/lib/types";
import { CHAT_MESSAGES } from '@/lib/messages';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { stripQPPrefix } from '@/lib/qpParser';

interface ChatContainerExtendedProps extends ChatContainerProps {
  initialSubjectId?: string;
  initialExamType?: string;
}

/** Parse the __CHAT_ACTION__ sentinel the backend returns for structured redirects.
 *  Handles two forms:
 *  1. Full sentinel: the entire string is "__CHAT_ACTION__:{...}"
 *  2. Appended sentinel: a real answer followed by "\n\n__CHAT_ACTION__:{...}" (mixed intent)
 */
function parseActionSentinel(raw: string): { content: string; actions?: Message['actions'] } {
  const SENTINEL = '__CHAT_ACTION__:';

  // Form 1: entire string is a sentinel (most common)
  if (raw.startsWith(SENTINEL)) {
    try {
      const payload = JSON.parse(raw.slice(SENTINEL.length));
      return {
        content: payload.text ?? '',
        actions: payload.action ? [{
          id: payload.action.id,
          label: payload.action.label,
          ...(payload.action.subjectId && { subjectId: payload.action.subjectId }),
          ...(payload.action.examType && { examType: payload.action.examType }),
        }] : undefined,
      };
    } catch {
      return { content: raw };
    }
  }

  // Form 2: sentinel embedded/appended somewhere in the message (mixed intent)
  const sentinelIdx = raw.indexOf(SENTINEL);
  if (sentinelIdx !== -1) {
    const mainContent = raw.slice(0, sentinelIdx).trimEnd();
    const sentinelStr = raw.slice(sentinelIdx + SENTINEL.length);
    try {
      const payload = JSON.parse(sentinelStr);
      return {
        content: mainContent,
        actions: payload.action ? [{
          id: payload.action.id,
          label: payload.action.label,
          ...(payload.action.subjectId && { subjectId: payload.action.subjectId }),
          ...(payload.action.examType && { examType: payload.action.examType }),
        }] : undefined,
      };
    } catch {
      // Sentinel malformed — return clean content without the broken suffix
      return { content: mainContent };
    }
  }

  return { content: raw };
}

export function ChatContainer({ initialShowOverlay = false, initialSessionId, initialPaperId, initialSubjectId, initialExamType, role: roleProp }: ChatContainerExtendedProps) {
  const router = useRouter();
  const { refreshSessions } = useSidebar();
  const { role: authRole } = useAuth();

  // role prop takes priority (from URL ?role=); fall back to auth context so
  // faculty/admin get the right experience on /chat/[sessionId] where there's no ?role= param
  const role = roleProp ?? authRole ?? undefined;

  const [showOverlay, setShowOverlay] = useState(initialShowOverlay);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [questionsToday, setQuestionsToday] = useState(0);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [paperRawText, setPaperRawText] = useState('');
  const [sessionLocked, setSessionLocked] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>(initialSessionId);
  const [resolvedPaperId, setResolvedPaperId] = useState<string | null>(null);
  const [resolvedQuestions, setResolvedQuestions] = useState<{ id: string; text: string }[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const isFaculty = role === 'faculty' || role === 'admin' || role === 'super_admin' || role === 'super-admin';
  const isAdmin = role === 'admin' || role === 'super_admin' || role === 'super-admin';

useEffect(() => {
  if (initialSessionId) {
    const loadExistingChat = async () => {
      try {
        const { data } = await api.get(`/api/chats/${initialSessionId}`);
        const chat = data.data;

        // Infer paperKind from message history so faculty can continue naturally.
        let inferredPaperKind: 'IMPORTANT_QUESTIONS' | 'EXAM_PAPER' = 'EXAM_PAPER';
        if (isFaculty && chat.messages && chat.messages.length > 0) {
          const allText: string = chat.messages.map((m: any) => m.content).join(' ').toLowerCase();
          if (allText.includes('important question') && !allText.includes('exam paper') && !allText.includes('part a') && !allText.includes('section a')) {
            inferredPaperKind = 'IMPORTANT_QUESTIONS';
          }
        }

        const hasPaperIQ = chat.paper?.kind === 'IMPORTANT_QUESTIONS';
        const hasLinkedIQ = hasPaperIQ || !!chat.paper?.linkedPaperId;
        const linkedIQPaperId = hasPaperIQ ? chat.paper.id : (chat.paper?.linkedPaperId || undefined);

        // Does the IQ paper tied to THIS chat already have an exam paper
        // linked to it — possibly assigned from a completely different chat?
        const linkedExamPaper = hasPaperIQ ? chat.paper?.linkedFrom?.[0] : undefined;
        const hasLinkedExamPaper = Boolean(linkedExamPaper);
        const examCreatorName = linkedExamPaper?.creator?.name;

        const assignment = chat.paper?.paperAssignments?.[0];
        const departmentInfo = assignment?.department || chat.department;

        setSessionData({
          subjectId: chat.subjectId,
          subjectName: chat.subject?.name,
          subject: chat.subject,
          examType: chat.examType,
          paperKind: isFaculty ? inferredPaperKind : null,
          hasLinkedIQ,
          linkedIQPaperId,
          hasLinkedExamPaper,
          year: assignment?.assignedToYear?.toString() || chat.assignedToYear?.toString() || undefined,
          departmentId: departmentInfo?.id || undefined,
          department: departmentInfo?.name || undefined,
          branch: departmentInfo?.branch || undefined,
          section: assignment?.assignedToSection || chat.assignedToSection || undefined,
        });

        let mapped: Message[] = [];
        if (chat.messages && chat.messages.length > 0) {
          mapped = chat.messages.map((m: any) => {
            if (m.role === 'assistant') {
              const parsed = parseActionSentinel(m.content as string);
              return {
                id: m.id,
                role: m.role,
                ...parsed,
                figures: m.figures,
                // Restore batchAnswers if the backend persisted them (keeps Q1/Q2 labels on reload)
                ...(m.batchAnswers && m.batchAnswers.length > 0 ? { batchAnswers: m.batchAnswers } : {}),
              };
            }
            return { id: m.id, role: m.role, content: m.content, figures: m.figures };
          });

          // For faculty: if the last assistant message looks like a generated
          // paper (long structured text), re-attach the Assign action button
          // so they can assign without needing to regenerate.
          if (isFaculty && mapped.length > 0) {
            const lastIdx = mapped.map((m, i) => m.role === 'assistant' ? i : -1).filter(i => i >= 0).pop();
            if (lastIdx !== undefined) {
              const lastMsg = mapped[lastIdx];
              const text = lastMsg.content;
              const isIQList = inferredPaperKind === 'IMPORTANT_QUESTIONS'
                && text.length > 200 && /^\s*\d+\./m.test(text);
              const isExamPaper = inferredPaperKind === 'EXAM_PAPER'
                && text.length > 300
                && (text.includes('Part A') || text.includes('Section A') || text.includes('Marks'));
              if (isIQList || isExamPaper) {
                mapped[lastIdx] = {
                  ...lastMsg,
                  actions: [{ id: 'generate_pdf', label: 'Assign', icon: 'file-down' }],
                };
              }
            }
          }
        }

        // Proactively lock the chat if the exam paper already exists elsewhere —
        // don't let faculty waste time regenerating something that will be rejected.
        if (isFaculty && hasPaperIQ && hasLinkedExamPaper) {
          setSessionLocked(true);
          mapped.push(pushMsg(
            `An **Exam Paper** for this Important Questions set has already been assigned${examCreatorName ? ` by **${examCreatorName}**` : ''}. No further action is needed here.`
          ));
          toast.info('Exam paper already assigned for this session.');
        }

        setResolvedPaperId(chat.paperId || null);
        if (chat.paper?.questions) {
          setResolvedQuestions(chat.paper.questions.map((q: any) => ({ 
            id: q.id, 
            text: stripQPPrefix(q.questionText || q.text || ''),
            marks: q.marks
          })));
        }

        setMessages(mapped);
      } catch (error) {
        console.error('Failed to load existing chat', error);
      }
    };
    loadExistingChat();
  }
}, [initialSessionId]);

  useEffect(() => {
    if (initialPaperId && !isFaculty) {
      const loadContext = async () => {
        try {
          const { data } = await api.get(`/api/question-papers/${initialPaperId}/study-context`);
          setSessionData({
            subjectId: data.subject.id,
            subjectName: data.subject.name,
            subject: data.subject,
            examType: data.examType,
            paperKind: 'EXAM_PAPER',
            hasLinkedIQ: false,
          });

          setResolvedPaperId(initialPaperId);
          if (data.questions) {
            setResolvedQuestions(data.questions.map((q: any) => ({
              id: q.id,
              text: stripQPPrefix(q.questionText || q.text || ''),
              marks: q.marks,
            })));
          }

          setMessages([{
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Ready to study **${data.subject.name}** — ${data.examType}. you can ask me anything about the paper, a topic, or previous year questions.`,
          }]);
        } catch (error) {
          console.error('Failed to load study context', error);
        }
      };
      loadContext();
    }
  }, [initialPaperId, isFaculty]);

  useEffect(() => {
    if (initialSubjectId && initialExamType && !initialSessionId && !initialPaperId) {
      const loadContext = async () => {
        try {
          const { data } = await api.get(`/api/subjects/${initialSubjectId}`);
          setSessionData({
            subjectId: data.subject.id,
            subjectName: data.subject.name,
            subject: data.subject,
            examType: initialExamType,
            paperKind: isFaculty ? 'EXAM_PAPER' : null,
            hasLinkedIQ: false,
          });
          setMessages([{
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Hello! 👋 Continuing your study session for **${data.subject.name}** — ${initialExamType}. What would you like to ask?`,
          }]);
          
          if (!isFaculty) {
            try {
              const res = await api.get('/api/question-papers/resolve', {
                params: { subjectId: initialSubjectId, examType: initialExamType }
              });
              if (res.data.success && res.data.data.paperId) {
                setResolvedPaperId(res.data.data.paperId);
                if (res.data.data.questions) {
                  setResolvedQuestions(res.data.data.questions.map((q: any) => ({
                    id: q.id,
                    text: stripQPPrefix(q.questionText || q.text || ''),
                    marks: q.marks
                  })));
                }
              }
            } catch (err) {
              console.error('Failed to resolve paper for cohort', err);
            }
          }
        } catch (error) {
          console.error('Failed to load subject context', error);
        }
      };
      loadContext();
    }
  }, [initialSubjectId, initialExamType, initialSessionId, initialPaperId, isFaculty]);

  const pushMsg = (content: string, actions?: Message['actions']): Message => ({
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    actions,
  });

  // ── Overlay complete ─────────────────────────────────────────────────────
  const handleCompleteOverlay = async (data: {
    year?: string; branch?: string; department?: string; departmentId?: string; section?: string; subject: Subject; examType: string; paperKind?: PaperKind;
  }) => {
    setShowOverlay(false);
    setSessionLocked(false);
    setResolvedPaperId(null);
    setResolvedQuestions([]);

    const base: SessionData = {
      ...data,
      subjectId: data.subject.id,
      subjectName: data.subject.name,
      subject: data.subject,
      examType: data.examType.replace(/\s+/g, '').toUpperCase(),
      paperKind: null,
      hasLinkedIQ: false,
    };

    if (!isFaculty) {
      setSessionData({ ...base, paperKind: 'EXAM_PAPER' });
      
      try {
        const res = await api.get('/api/question-papers/resolve', {
          params: { subjectId: data.subject.id, examType: data.examType }
        });
        if (res.data.success && res.data.data.paperId) {
          setResolvedPaperId(res.data.data.paperId);
          if (res.data.data.questions) {
            setResolvedQuestions(res.data.data.questions.map((q: any) => ({
              id: q.id,
              text: stripQPPrefix(q.questionText || q.text || ''),
              marks: q.marks
            })));
          }
        }
      } catch (err) {
        console.error('Failed to resolve paper for cohort', err);
      }

      setMessages([pushMsg(
        CHAT_MESSAGES.studentWelcome(
          data.subject.name,
          data.examType
        )
      )]);
      return;
    }

    // Check for existing IQ paper (Flow 2B detection)
    let hasLinkedIQ = false;
    let linkedIQPaperId: string | undefined;
    let linkedIQExamDate: string | null | undefined;
    let hasLinkedExamPaper = false;
    let linkedIQAssignment: any = undefined;
    let iqCreatorName: string | null = null;
    let examCreatorName: string | null = null;
    let hasStandaloneExamPaper = false;
    let standaloneExamCreatorName: string | null = null;

    try {
      const currentYear = new Date().getFullYear();
      const acYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

      const { data: iqRes } = await api.get('/api/question-papers/check-iq', {
        params: {
          subjectId: data.subject.id,
          examType: data.examType.replace(/\s+/g, '').toUpperCase(),
          academicYear: acYear,
          year: data.year ? data.year.charAt(0) : undefined,
          branch: data.branch,
          section: data.section
        },
      });
      if (iqRes.exists) {
        if (iqRes.paper) {
          hasLinkedIQ = true;
          linkedIQPaperId = iqRes.paper.id;
          linkedIQExamDate = iqRes.paper.examDate;
          hasLinkedExamPaper = iqRes.paper.hasLinkedExamPaper;
          linkedIQAssignment = iqRes.paper.assignment;
          iqCreatorName = iqRes.paper.creatorName ?? null;
          examCreatorName = iqRes.paper.linkedExamCreatorName ?? null;
        }
        if (iqRes.standaloneExamPaper) {
          hasStandaloneExamPaper = true;
          standaloneExamCreatorName = iqRes.standaloneExamPaper.creatorName ?? null;
        }
      }
    } catch { /* non-fatal */ }

    const session: SessionData = {
      ...base,
      hasLinkedIQ,
      linkedIQPaperId,
      linkedIQExamDate,
      linkedIQAssignment
    };
    setSessionData(session);

    const cohortLabel = [
      data.year, data.branch, data.section ? `Section ${data.section}` : null,
    ].filter(Boolean).join(' · ');

    if (hasLinkedIQ && hasLinkedExamPaper) {
      // 1. Both exist
      setSessionData({ ...session, paperKind: 'EXAM_PAPER' });
      setSessionLocked(true);

      const creditLines = [
        iqCreatorName ? `**Important Questions** — published by **${iqCreatorName}**` : null,
        examCreatorName ? `**Exam Paper** — published by **${examCreatorName}**` : null,
      ].filter(Boolean).join('\n');

      setMessages([pushMsg(
        `Both the important questions and the exam paper are already assigned for **${data.subject.name}** (${data.examType}${cohortLabel ? ' · ' + cohortLabel : ''}).\n\n${creditLines ? creditLines + '\n\n' : ''}There's nothing new to generate for this combination until the next academic cycle. If you have any concerns about the existing content, please reach out to them directly before making changes.`,
        [
          { id: 'start_new_session', label: 'Start a new session' },
        ]
      )]);
    } else if (hasStandaloneExamPaper) {
      // 2. Standalone exam only
      setSessionData({ ...session, paperKind: 'EXAM_PAPER' });
      setSessionLocked(true);

      const creditLine = standaloneExamCreatorName ? `\n\n**Exam Paper** — published by **${standaloneExamCreatorName}**` : '';

      setMessages([pushMsg(
        `A direct exam paper is already assigned for **${data.subject.name}** (${data.examType}${cohortLabel ? ' · ' + cohortLabel : ''}).${creditLine}\n\nThere's nothing new to generate for this combination until the next academic cycle. If you have any concerns about the existing content, please reach out to them directly before making changes.`,
        [
          { id: 'start_new_session', label: 'Start a new session' },
        ]
      )]);
    } else if (data.paperKind) {
      // 3. Paper kind already chosen in overlay (e.g. University)
      if (data.paperKind === 'IMPORTANT_QUESTIONS') {
         setSessionData({ ...session, paperKind: 'IMPORTANT_QUESTIONS' });
         if (hasLinkedIQ) {
           setSessionLocked(true);
           setMessages([pushMsg(
             `I can see important questions are already assigned for **${data.subject.name}** (${data.examType})${iqCreatorName ? ` — published by **${iqCreatorName}**` : ''}.\n\nThere's nothing new to generate for this combination until the next academic cycle.`,
             [{ id: 'start_new_session', label: 'Start a new session' }]
           )]);
         } else {
           setMessages([
             pushMsg(`Hello! 👋 Let's work on **${data.subject.name}** — ${data.examType}.`),
             pushMsg(`Great! Let's prepare **Important Questions** for this exam.\n\nPlease tell me:\n1. **Which chapter(s)** should be covered?\n2. **Mark distribution** — how many questions and of what mark value?`)
           ]);
         }
      } else {
         setSessionData({ ...session, paperKind: 'EXAM_PAPER' });
         const isUniversity = data.examType.toUpperCase().includes('UNIVERSITY');
         const msgContent = isUniversity 
            ? `*This is a Semester/University exam paper. It will be common for all sections of the department for this subject.*\n\nLet's build the **Exam Paper** directly. Please confirm:\n1. **Which chapter(s)** should be covered?\n2. **Mark/part distribution** (e.g. Part A: 10×2 marks, Part B: 3×13 marks)\n3. **Exam date**`
            : `Let's build the **Exam Paper** directly. Please confirm:\n1. **Which chapter(s)** should be covered?\n2. **Mark/part distribution** (e.g. Part A: 10×2 marks, Part B: 3×13 marks)\n3. **Exam date**`;
         setMessages([
           pushMsg(`Hello! 👋 Let's work on **${data.subject.name}** — ${data.examType}.`),
           pushMsg(msgContent)
         ]);
      }
    } else if (hasLinkedIQ) {
      // 4. IQ exists, no exam paper yet (Standard branch)
      setMessages([pushMsg(
        `I can see important questions are already assigned for **${data.subject.name}** (${data.examType})${iqCreatorName ? ` — published by **${iqCreatorName}**` : ''}.\n\nWould you like to generate the actual **Exam Paper** now? If you have any concerns about the existing questions, please reach out to them first.`,
        [
          { id: 'pick_exam_paper', label: 'Yes, generate the Exam Paper' }
        ]
      )]);
    } else {
      // 5. Neither exist (Standard branch question)
      setMessages([pushMsg(
        `Hello! 👋 Let's work on **${data.subject.name}** — ${data.examType}.\n\nWhat would you like to do?`,
        [
          { id: 'pick_iq', label: '(a) Assign Important Questions' },
          { id: 'pick_exam_paper', label: '(b) Generate Direct Exam Paper' },
        ]
      )]);
    }
  };

  // ── Action buttons ───────────────────────────────────────────────────────
  const handleAction = (messageId: string, actionId: string) => {
    if (actionId === 'pick_iq') {
      setSessionData(prev => prev ? { ...prev, paperKind: 'IMPORTANT_QUESTIONS' } : prev);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, actions: undefined } : m).concat(pushMsg(
        `Great! Let's prepare **Important Questions** for this exam.\n\nPlease tell me:\n1. **Which chapter(s)** should be covered?\n2. **Mark distribution** — how many questions and of what mark value?`
      )));
      return;
    }

    if (actionId === 'pick_exam_paper') {
      setSessionData(prev => prev ? { ...prev, paperKind: 'EXAM_PAPER' } : prev);
      
      const isUniversity = sessionData?.examType.toUpperCase().includes('UNIVERSITY');
      const hasIQ = sessionData?.hasLinkedIQ;

      const messageContent = isUniversity
        ? `*This is a Semester/University exam paper. It will be common for all sections of the department for this subject.*\n\nLet's build the **Exam Paper** directly. Please confirm:\n1. **Which chapter(s)** should be covered?\n2. **Mark/part distribution** (e.g. Part A: 10×2 marks, Part B: 3×13 marks)\n3. **Exam date**`
        : hasIQ
          ? `Since we already have the chapters and marks from the important questions, how would you like to divide the questions in the actual exam paper (e.g., Part A, B, C)? And what is the exam date?`
          : `Let's build the **Exam Paper** directly. Please confirm:\n1. **Which chapter(s)** should be covered?\n2. **Mark/part distribution** (e.g. Part A: 10×2 marks, Part B: 3×13 marks)\n3. **Exam date**`;

      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, actions: undefined } : m).concat(pushMsg(messageContent)));
      return;
    }

    if (actionId === 'proceed_to_exam_paper') {
      setSessionData(prev => prev ? { ...prev, paperKind: 'EXAM_PAPER' } : prev);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, actions: undefined } : m).concat(pushMsg(
        `Since we already have the chapters and marks from the important questions, how would you like to divide the questions in the actual exam paper (e.g., Part A, B, C)? And what is the exam date?`
      )));
      return;
    }

    if (actionId === 'generate_pdf') {
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        setPaperRawText(msg.content);
        setAssignModalOpen(true);
      }
      return;
    }

    if (actionId === 'navigate_to_questions') {
      const action = messages.find(m => m.id === messageId)?.actions?.find(a => a.id === 'navigate_to_questions');
      const subjectId = (action as any)?.subjectId ?? sessionData?.subjectId;
      if (subjectId) {
        router.push(`/student/questions/${subjectId}`);
      }
      return;
    }

    if (actionId === 'navigate_new_chat_exam') {
      // Navigate in the same tab to bypass overlay using the URL query params
      const action = messages.find(m => m.id === messageId)?.actions?.find(a => a.id === 'navigate_new_chat_exam');
      const targetExamType = (action as any)?.examType || sessionData?.examType;
      const subjectId = (action as any)?.subjectId || sessionData?.subjectId;
      const params = new URLSearchParams();
      if (subjectId) params.set('subjectId', subjectId);
      if (targetExamType) params.set('examType', targetExamType);
      router.push(`/chat/new?${params.toString()}`);
      return;
    }

    if (actionId === 'start_new_session') {
      setSessionLocked(false);
      setSessionData(null);
      setMessages([]);
      setResolvedPaperId(null);
      setResolvedQuestions([]);
      setShowOverlay(true);
      return;
    }
  };

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = async (content: string) => {
    if (!isFaculty && questionsToday >= 10) return;
    if (!isFaculty) setQuestionsToday(p => p + 1);

    // Gate: branch question not answered yet — only for NEW sessions before IQ/Exam is chosen
    if (isFaculty && sessionData?.paperKind === null && !chatId) {
      setMessages(prev => [...prev,
      { id: crypto.randomUUID(), role: 'user', content },
      pushMsg('Please use the buttons above to choose between Important Questions or Exam Paper first. 👆'),
      ]);
      return;
    }

    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content }]);
    setIsStreaming(true);

    try {
      if (isFaculty) {
        const history = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
        const { data } = await api.post('/api/generate/qp', {
          subjectId: sessionData?.subjectId || undefined,
          subjectName: sessionData?.subjectName || '',
          examType: sessionData?.examType || '',
          year: sessionData?.year || '',
          branch: sessionData?.branch || '',
          instruction: content,
          paperKind: sessionData?.paperKind || 'EXAM_PAPER',
          hasLinkedIQ: sessionData?.hasLinkedIQ || false,
          chatId: chatId,
          history,
        });

        // Persist session: update URL + sidebar on first turn
        if (data.chatId && !chatId) {
          setChatId(data.chatId);
          refreshSessions();
          window.history.replaceState(null, '', `/chat/${data.chatId}?role=${role}`);
        }

        const responseText = data.data as string;
        const isIQList = sessionData?.paperKind === 'IMPORTANT_QUESTIONS'
          && responseText.length > 200 && /^\s*\d+\./m.test(responseText);
        const isExamPaper = sessionData?.paperKind === 'EXAM_PAPER'
          && responseText.length > 300
          && (responseText.includes('Part A') || responseText.includes('Section A') || responseText.includes('Marks'));

        const responseFigures = data.figures as { pageNumber: number, caption: string, url: string }[] | undefined;

        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant', content: responseText, figures: responseFigures,
          ...((isIQList || isExamPaper) && { actions: [{ id: 'generate_pdf', label: 'Assign', icon: 'file-down' }] }),
        }]);
      } else {
        // ── Stream standard student Q&A / Study-paper mode ────────────────────────
        const payload = initialPaperId ? {
          question: content,
          paperId: chatId ? undefined : initialPaperId,
          chatId: chatId,
        } : {
          subjectId: chatId ? undefined : sessionData?.subjectId || undefined,
          examType: chatId ? undefined : (sessionData?.examType ? sessionData.examType.toUpperCase().replace(' ', '') : undefined),
          chatId: chatId,
          question: content,
        };

        const match = document.cookie.match(new RegExp('(^|;\\s*)(' + 'csrf-token' + ')=([^;]*)'));
        const csrfToken = match ? decodeURIComponent(match[3]) : '';

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const response = await authenticatedFetch(`${api.defaults.baseURL}/api/chats/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-College-Slug': window.location.hostname.split('.')[0],
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
          },
          body: JSON.stringify(payload),
          credentials: 'include',
          signal: abortController.signal
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || 'Network response was not ok');
        }

        if (!response.body) throw new Error('ReadableStream not supported');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        const currentBubbleId = crypto.randomUUID();
        
        let doneReading = false;
        let buffer = '';
        let streamedText = '';

        setMessages(prev => [...prev, { id: currentBubbleId, role: 'assistant', content: '' }]);

        while (!doneReading) {
          const { value, done } = await reader.read();
          if (done) {
            doneReading = true;
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          let boundary = buffer.indexOf('\n\n');
          while (boundary !== -1) {
            const chunk = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            boundary = buffer.indexOf('\n\n');

            if (chunk.startsWith('data: ')) {
              const dataStr = chunk.slice(6);
              if (dataStr.trim() === '[DONE]') continue;
              try {
                const data = JSON.parse(dataStr);
                if (data.error) throw new Error(data.error);

                if (data.batch) {
                  setMessages(prev => prev.map(m => m.id === currentBubbleId ? { 
                    ...m, 
                    batchAnswers: m.batchAnswers ? [...m.batchAnswers, ...data.batch] : data.batch
                  } : m));
                  continue;
                }

                if (data.chatLocked) {
                  setSessionLocked(true);
                  const parsedLocked = parseActionSentinel(data.data as string);
                  setMessages(prev => prev.map(m => m.id === currentBubbleId ? { ...m, ...parsedLocked, figures: data.figures } : m));
                  return;
                }

                if (data.text) {
                  streamedText += data.text;
                  setMessages(prev => prev.map(m => m.id === currentBubbleId ? { ...m, content: streamedText } : m));
                }

                if (data.done) {
                  if (data.chatId && !chatId) {
                    setChatId(data.chatId);
                    refreshSessions();
                    window.history.replaceState(null, '', `/chat/${data.chatId}`);
                  }
                  
                  // Finalize parsing (actions, figures)
                  const finalContent = data.data as string;
                  const parsed = parseActionSentinel(finalContent || streamedText);
                  setMessages(prev => prev.map(m => m.id === currentBubbleId ? { ...m, ...parsed, figures: data.figures } : m));
                }
              } catch (e) {
                 console.error("Error parsing chunk", chunk, e);
              }
            }
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, pushMsg('Unable to process your request. Please try again in a few moments.')]);
    } finally {
      setIsStreaming(false);
    }
  };

  // ── After assign success ─────────────────────────────────────────────────
  const handleAssignSuccess = async (message: string, assignedKind: PaperKind, assignedPaperId: string) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: message }]);

    // Persist the success message to the DB if we have a chatId
    if (chatId) {
      try {
        await api.post(`/api/chats/${chatId}/message`, { role: 'assistant', content: message });
      } catch (err) {
        console.error('Failed to persist assign success message', err);
      }
    }

    if (assignedKind === 'IMPORTANT_QUESTIONS') {
      setSessionData(prev => prev
        ? { ...prev, hasLinkedIQ: true, linkedIQPaperId: assignedPaperId, paperKind: null }
        : prev
      );
      const followUp = `Great! Important questions have been assigned. Ready to generate the actual **Exam Paper** now?`;
      setTimeout(async () => {
        setMessages(prev => [...prev, pushMsg(
          followUp,
          [{ id: 'proceed_to_exam_paper', label: 'Yes, generate the Exam Paper' }]
        )]);
        // Persist the follow-up prompt too
        if (chatId) {
          try {
            await api.post(`/api/chats/${chatId}/message`, { role: 'assistant', content: followUp });
          } catch (err) {
            console.error('Failed to persist follow-up message', err);
          }
        }
      }, 600);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1C1C1B] relative">
      {showOverlay && <ChatStepOverlay role={role} onComplete={handleCompleteOverlay} />}

      {!showOverlay && (
        <ChatHeader
          subjectName={sessionData?.subjectName ?? 'Study Session'}
          examType={sessionData?.examType ?? (initialPaperId ? 'Paper Chat' : 'General')}
          paperResolved={!!resolvedPaperId || !!initialPaperId}
          onOpenQuestions={() => setIsPanelOpen(true)}
          role={role}
        />
      )}

      <QuestionsPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        questions={resolvedQuestions} 
      />

      <ChatMessages messages={messages} isStreaming={isStreaming} onAction={handleAction} />

      {assignModalOpen && sessionData && (
        <AssignModal
          sessionData={sessionData}
          rawText={paperRawText}
          onClose={() => setAssignModalOpen(false)}
          onSuccess={handleAssignSuccess}
          chatId={chatId}
        />
      )}

      <ChatInput
        onSend={handleSend}
        disabled={showOverlay || isStreaming || sessionLocked}
      />
    </div>
  );
}