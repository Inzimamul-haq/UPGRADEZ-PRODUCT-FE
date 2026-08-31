"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Subject, Message, TocEntry } from '@/lib/types';
import { ChatStepOverlay } from './ChatStepOverlay';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AssignModal } from './AssignModal';
import { QuestionsPanel } from './QuestionsPanel';
import { SyllabusPanel } from './SyllabusPanel';
import api from '@/lib/api';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { SessionData, ChatContainerProps, PaperKind, DifficultyMode } from "@/lib/types";
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
  const [assignMessageId, setAssignMessageId] = useState<string | null>(null);
  const [paperRawText, setPaperRawText] = useState('');
  const [sessionLocked, setSessionLocked] = useState(false);
  const [difficultyMode, setDifficultyMode] = useState<DifficultyMode | ''>('');
  const [difficultyConfirmed, setDifficultyConfirmed] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>(initialSessionId);
  const [resolvedPaperId, setResolvedPaperId] = useState<string | null>(null);
  const [resolvedQuestions, setResolvedQuestions] = useState<{ id: string; text: string }[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  // Syllabus TOC panel state
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  const [syllabusEntries, setSyllabusEntries] = useState<TocEntry[]>([]);
  const [syllabusSubjectName, setSyllabusSubjectName] = useState('');
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

  // Fetch syllabus TOC whenever subject changes
  useEffect(() => {
    const subjectId = sessionData?.subjectId;
    if (!subjectId) return;
    let cancelled = false;
    api.get(`/api/subjects/${subjectId}/toc`)
      .then(({ data }) => {
        if (cancelled) return;
        setSyllabusEntries(data.entries ?? []);
        setSyllabusSubjectName(data.subjectName ?? '');
      })
      .catch(() => {
        // Silently fail — syllabus button just stays hidden
        if (!cancelled) setSyllabusEntries([]);
      });
    return () => { cancelled = true; };
  }, [sessionData?.subjectId]);

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
          
          // Bug Fix: If this chat generated an EXAM_PAPER, then an exam paper IS assigned!
          const hasLinkedExamPaper = Boolean(linkedExamPaper) || chat.paper?.kind === 'EXAM_PAPER';
          
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
            // Bug 4: also try subject.department as branch fallback when assignment lacks branch
            branch: departmentInfo?.branch || chat.subject?.department?.branch || undefined,
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
                  isAssigned: m.isAssigned,
                  ...(m.batchAnswers && m.batchAnswers.length > 0 ? { batchAnswers: m.batchAnswers } : {}),
                  ...(m.stepExplanations && m.stepExplanations.length > 0 ? { stepExplanations: m.stepExplanations } : {}),
                };
              }
              return { id: m.id, role: m.role, content: m.content, figures: m.figures, isAssigned: m.isAssigned, ...(m.stepExplanations && m.stepExplanations.length > 0 ? { stepExplanations: m.stepExplanations } : {}) };
            });

            if (isFaculty && mapped.length > 0) {
              mapped = mapped.map((m, i) => {
                if (m.role === 'assistant') {
                  const text = m.content as string;
                  const hasNumberedList = /(?:^\s*\d+\.|Q\d+)/m.test(text);
                  const hasMarks = /\d+\s*marks?/i.test(text);
                  const hasQuestionWords = /\b(what|define|list|explain|describe|how|why|discuss|state)\b/i.test(text);
                  
                  const isLikelyPaper = text.length > 100 && (
                    /(?:part|section)\s*[-_]?\s*[a-c]/i.test(text) || 
                    (/important questions?/i.test(text) && hasNumberedList) ||
                    (hasNumberedList && hasMarks && hasQuestionWords)
                  );
                  if (isLikelyPaper && !m.actions?.some(a => a.id === 'generate_pdf')) {
                    return {
                      ...m,
                      actions: [...(m.actions || []), { id: 'generate_pdf', label: 'Assign', icon: 'file-down' }]
                    };
                  }
                }
                return m;
              });
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

          // Bug 3: always mark difficulty as confirmed when reloading an existing session.
          // Faculty already went through difficulty setup before generating — requiring them
          // to re-confirm on every reload would lock the input unnecessarily.
          if (isFaculty) {
            setDifficultyConfirmed(true);
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
            content: `Ready to study **${data.subject.name}** — ${data.examType}. Ask me about any question, topic, or previous year question. You can also ask for a **2-mark answer**.`
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
      setDifficultyConfirmed(true);
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
          setDifficultyConfirmed(false);
          setDifficultyMode('MEDIUM');
          setMessages([
            pushMsg(`Hello! 👋 Let's work on **${data.subject.name}** — ${data.examType}.`),
            pushMsg(CHAT_MESSAGES.importantQuestionsPrompt)
          ]);
        }
      } else {
        setSessionData({ ...session, paperKind: 'EXAM_PAPER' });
        setDifficultyConfirmed(false);
        setDifficultyMode('MEDIUM');
        const isUniversity = data.examType.toUpperCase().includes('UNIVERSITY');
        const msgContent = isUniversity
          ? `*This is a Semester/University exam paper. It will be common for all sections of the department for this subject.*\n\n${CHAT_MESSAGES.examPaperPrompt}`
          : CHAT_MESSAGES.examPaperPrompt;
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
      setDifficultyConfirmed(false);
      setDifficultyMode('MEDIUM');
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, actions: undefined } : m).concat(pushMsg(
        CHAT_MESSAGES.importantQuestionsPrompt
      )));
      return;
    }

    if (actionId === 'pick_exam_paper') {
      setSessionData(prev => prev ? { ...prev, paperKind: 'EXAM_PAPER' } : prev);
      setDifficultyConfirmed(false);
      setDifficultyMode('MEDIUM');

      const isUniversity = sessionData?.examType.toUpperCase().includes('UNIVERSITY');
      const hasIQ = sessionData?.hasLinkedIQ;

      const messageContent = isUniversity
        ? `*This is a Semester/University exam paper. It will be common for all sections of the department for this subject.*\n\n${CHAT_MESSAGES.examPaperPrompt}`
        : hasIQ
          ? CHAT_MESSAGES.examPaperFromIQ
          : CHAT_MESSAGES.examPaperPrompt;

      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, actions: undefined } : m).concat(pushMsg(messageContent)));
      return;
    }

    if (actionId.startsWith('proceed_to_exam_paper')) {
      const mode = actionId.endsWith('simple') ? 'SIMPLE' : actionId.endsWith('hard') ? 'HARD' : 'MEDIUM';
      setSessionData(prev => prev ? { ...prev, paperKind: 'EXAM_PAPER', linkedIQDifficultyMode: difficultyMode || undefined } : prev);
      setDifficultyConfirmed(true);
      setDifficultyMode(mode);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, actions: undefined } : m).concat(pushMsg(
        CHAT_MESSAGES.examPaperFromIQ
      )));
      return;
    }

    if (actionId === 'generate_pdf') {
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        setPaperRawText(msg.content);
        setAssignMessageId(messageId);
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

  const handleEditSubmit = async (messageId: string, content: string) => {
    if (!chatId) return;
    const msg = messages.find(m => m.id === messageId);
    if (msg?.role === 'user') {
      // User message edit -> trim history and regenerate
      handleSend(content, messageId);
      return;
    }

    try {
      const { data } = await api.patch(`/api/chats/${chatId}/messages/${messageId}`, { content });
      
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          const parsed = parseActionSentinel(content);
          return {
            ...m,
            ...parsed,
            actions: m.actions, // preserve Assign button
          };
        }
        return m;
      }));
    } catch (err: any) {
      console.error('Failed to edit message', err);
      const code = err?.response?.status;
      if (code === 409) {
        toast.error('Cannot edit this message as it has already been assigned.');
        throw err; // throw so ChatMessage component knows it failed
      } else if (code === 404) {
        // Message not found in DB (likely an unsaved mutation). Just update local state.
        setMessages(prev => prev.map(m => {
          if (m.id === messageId) {
            const parsed = parseActionSentinel(content);
            return {
              ...m,
              ...parsed,
              actions: m.actions, // preserve Assign button
            };
          }
          return m;
        }));
        toast.success('Local edit saved (message not persisted).');
        return; // do not throw, it was successful locally
      } else {
        toast.error('Failed to edit message.');
        throw err;
      }
    }
  };

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = async (content: string, editMessageId?: string) => {
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

    const newUserMsgId = crypto.randomUUID();
    const newUserMsg = { id: newUserMsgId, role: 'user', content };
    let newMessagesList: Message[] = [];
    
    setMessages(prev => {
      if (editMessageId) {
        const idx = prev.findIndex(m => m.id === editMessageId);
        if (idx !== -1) {
          newMessagesList = [...prev.slice(0, idx), newUserMsg as Message];
          return newMessagesList;
        }
      }
      newMessagesList = [...prev, newUserMsg as Message];
      return newMessagesList;
    });

    setIsStreaming(true);

    try {
      if (isFaculty) {
        if (!difficultyMode || !difficultyConfirmed) {
          toast.error("Please confirm the difficulty mode on top to start generating.");
          setIsStreaming(false);
          setMessages(prev => prev.slice(0, -1)); // Remove the optimistically added message
          return;
        }

        let effectivePaperKind = sessionData?.paperKind || 'EXAM_PAPER';
        // Auto-transition to EXAM_PAPER if they ask for one, even if they reload the chat later
        if (effectivePaperKind === 'IMPORTANT_QUESTIONS' && /\b(?:exam|exam paper|qp|question paper)\b/i.test(content)) {
          effectivePaperKind = 'EXAM_PAPER';
          setSessionData(prev => prev ? { ...prev, paperKind: 'EXAM_PAPER' } : prev);
        }

        const historyToUse = newMessagesList.slice(0, -1); // exclude the newly added user message for API history if needed, or include it
        const history = historyToUse.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
        const { data } = await api.post('/api/generate/qp', {
          subjectId: sessionData?.subjectId || undefined,
          subjectName: sessionData?.subjectName || '',
          examType: sessionData?.examType || '',
          year: sessionData?.year || '',
          branch: sessionData?.branch || '',
          instruction: content,
          paperKind: effectivePaperKind,
          difficultyMode: difficultyMode,
          linkedIQDifficultyMode: sessionData?.linkedIQDifficultyMode,
          hasLinkedIQ: sessionData?.hasLinkedIQ || false,
          linkedPaperId: sessionData?.linkedIQPaperId, // Pass the explicit paper ID if this chat was started from the dashboard
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
        const hasNumberedList = /(?:^\s*\d+\.|Q\d+)/m.test(responseText);
        const hasMarks = /\d+\s*marks?/i.test(responseText);
        const hasQuestionWords = /\b(what|define|list|explain|describe|how|why|discuss|state)\b/i.test(responseText);

        const isLikelyPaper = responseText.length > 100 && (
          /(?:part|section)\s*[-_]?\s*[a-c]/i.test(responseText) || 
          (/important questions?/i.test(responseText) && hasNumberedList) ||
          (hasNumberedList && hasMarks && hasQuestionWords)
        );

        const responseFigures = data.figures as { pageNumber: number, caption: string, url: string }[] | undefined;
        const returnedMessageId = data.messageId || crypto.randomUUID();

        setMessages(prev => [...prev, {
          id: returnedMessageId, role: 'assistant', content: responseText, figures: responseFigures,
          ...(isLikelyPaper && { actions: [{ id: 'generate_pdf', label: 'Assign', icon: 'file-down' }] }),
        }]);
      } else {
        // ── Stream standard student Q&A / Study-paper mode ────────────────────────
        const payload = initialPaperId ? {
          question: content,
          paperId: chatId ? undefined : initialPaperId,
          chatId: chatId,
          editMessageId,
        } : {
          subjectId: chatId ? undefined : sessionData?.subjectId || undefined,
          examType: chatId ? undefined : (sessionData?.examType ? sessionData.examType.toUpperCase().replace(' ', '') : undefined),
          chatId: chatId,
          question: content,
          editMessageId,
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

                  // Finalize parsing (actions, figures, and map the real database messageId)
                  const finalContent = data.data as string;
                  const parsed = parseActionSentinel(finalContent || streamedText);
                  setMessages(prev => prev.map(m => m.id === currentBubbleId ? { ...m, ...parsed, figures: data.figures, id: data.messageId || m.id } : m));
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
    // Instantly update the assigned message in UI state so the green badge appears
    if (assignMessageId) {
      setMessages(prev => prev.map(m => m.id === assignMessageId ? { ...m, isAssigned: true } : m));
    }

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
      const followUp = `Ready to generate the actual **Exam Paper** now? Please select the target difficulty for the exam:`;
      setTimeout(async () => {
        setMessages(prev => [...prev, pushMsg(
          followUp,
          [
            { id: 'proceed_to_exam_paper_simple', label: 'Simple Exam Paper' },
            { id: 'proceed_to_exam_paper_medium', label: 'Medium Exam Paper' },
            { id: 'proceed_to_exam_paper_hard', label: 'Hard Exam Paper' },
          ]
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
    } else if (assignedKind === 'EXAM_PAPER') {
      setSessionData(prev => prev ? { ...prev, hasLinkedExamPaper: true } : prev);
    }
  };


return (
  <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden bg-[#1C1C1B]">
    {showOverlay && <ChatStepOverlay role={role} onComplete={handleCompleteOverlay} />}

    {!showOverlay && (
      <ChatHeader
        subjectName={sessionData?.subjectName ?? 'Study Session'}
        examType={sessionData?.examType ?? (initialPaperId ? 'Paper Chat' : 'General')}
        paperResolved={!!resolvedPaperId || !!initialPaperId}
        onOpenQuestions={() => setIsPanelOpen(true)}
        role={role}
        // New difficulty props
        showDifficulty={isFaculty && !showOverlay && !!sessionData?.paperKind && !sessionLocked}
        difficultyValue={difficultyMode}
        difficultyConfirmed={difficultyConfirmed}
        onDifficultyConfirm={(mode) => {
          setDifficultyMode(mode);
          setDifficultyConfirmed(true);
          setSessionData((prev) => (prev ? { ...prev, difficultyMode: mode } : prev));
        }}
        onDifficultyEdit={() => setDifficultyConfirmed(false)}
        difficultyDisabled={isStreaming}
        // Syllabus props
        syllabusAvailable={syllabusEntries.length > 0}
        onOpenSyllabus={() => setIsSyllabusOpen(true)}
      />
    )}

    <QuestionsPanel
      isOpen={isPanelOpen}
      onClose={() => setIsPanelOpen(false)}
      questions={resolvedQuestions}
    />

    <SyllabusPanel
      open={isSyllabusOpen}
      onClose={() => setIsSyllabusOpen(false)}
      subjectName={syllabusSubjectName || sessionData?.subjectName || ''}
      entries={syllabusEntries}
    />

    <ChatMessages messages={messages} chatId={chatId || ''} isStreaming={isStreaming} onAction={handleAction} onEditSubmit={handleEditSubmit} />

    {assignModalOpen && sessionData && (
      <AssignModal
        sessionData={sessionData}
        rawText={paperRawText}
        messageId={assignMessageId}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={handleAssignSuccess}
        chatId={chatId}
      />
    )}

    {/* Remove the standalone DifficultySelector from here */}

    <ChatInput
      onSend={handleSend}
      disabled={showOverlay || isStreaming || sessionLocked || (isFaculty && !!sessionData?.paperKind && !difficultyConfirmed)}
      onDisabledClick={() => {
        if (isFaculty && !!sessionData?.paperKind && !difficultyConfirmed) {
          toast.error("Please confirm the difficulty mode on top to start generating.");
        }
      }}
    />
  </div>
);
}