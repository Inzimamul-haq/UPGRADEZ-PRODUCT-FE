"use client";

import React, { useState } from 'react';
import { Subject, Message } from '@/lib/types';
import { ChatStepOverlay } from './ChatStepOverlay';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AssignModal } from './AssignModal';
import api from '@/lib/api';

type PaperKind = 'IMPORTANT_QUESTIONS' | 'EXAM_PAPER';

export interface SessionData {
  year?: string;
  branch?: string;
  subjectId: string;
  examType: string;
  subjectName?: string;
  subject?: Subject;
  paperKind: PaperKind | null;
  hasLinkedIQ: boolean;
  linkedIQPaperId?: string;
  linkedIQExamDate?: string | null;
  linkedIQAssignment?: {
    assignedToYear: number | null;
    assignedToBranch: string | null;
    assignedToSection: string | null;
  };
}

interface ChatContainerProps {
  initialShowOverlay?: boolean;
  initialSessionId?: string;
  initialPaperId?: string;
  role?: string;
}

export function ChatContainer({ initialShowOverlay = false, initialPaperId, role }: ChatContainerProps) {
  const [showOverlay, setShowOverlay] = useState(initialShowOverlay);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [questionsToday, setQuestionsToday] = useState(0);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [paperRawText, setPaperRawText] = useState('');

  const isFaculty = role === 'faculty' || role === 'admin' || role === 'super_admin' || role === 'super-admin';

  const pushMsg = (content: string, actions?: Message['actions']): Message => ({
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    actions,
  });

  // ── Overlay complete ─────────────────────────────────────────────────────
  const handleCompleteOverlay = async (data: {
    year?: string; branch?: string; subject: Subject; examType: string;
  }) => {
    setShowOverlay(false);

    const base: SessionData = {
      ...data,
      subjectId: data.subject.id,
      subjectName: data.subject.name,
      subject: data.subject,
      paperKind: null,
      hasLinkedIQ: false,
    };

    if (!isFaculty) {
      setSessionData({ ...base, paperKind: 'EXAM_PAPER' });
      setMessages([pushMsg(
        `Here are the **${data.examType}** questions for **${data.subject.name}**.\n\nWhere would you like to start?`
      )]);
      return;
    }

    // Check for existing IQ paper (Flow 2B detection)
    let hasLinkedIQ = false;
    let linkedIQPaperId: string | undefined;
    let linkedIQExamDate: string | null | undefined;
    let hasLinkedExamPaper = false;
    let linkedIQAssignment: any = undefined;

    try {
      const { data: iqRes } = await api.get('/api/question-papers/check-iq', {
        params: { subjectId: data.subject.id, examType: data.examType },
      });
      if (iqRes.exists) {
        hasLinkedIQ = true;
        linkedIQPaperId = iqRes.paper.id;
        linkedIQExamDate = iqRes.paper.examDate;
        hasLinkedExamPaper = iqRes.paper.hasLinkedExamPaper;
        linkedIQAssignment = iqRes.paper.assignment;
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

    if (hasLinkedIQ && hasLinkedExamPaper) {
      // Both already exist
      setSessionData({ ...session, paperKind: 'EXAM_PAPER' });
      setMessages([pushMsg(
        `Both important questions and the exam paper are already assigned for **${data.subject.name}** (${data.examType}).\n\nWould you like to regenerate or review?`
      )]);
    } else if (hasLinkedIQ) {
      // IQ exists, no exam paper yet — prompt for exam paper
      setMessages([pushMsg(
        `I can see important questions are already assigned for **${data.subject.name}** (${data.examType}).\n\nWould you like to generate the actual **Exam Paper** now?`,
        [
          { id: 'pick_exam_paper', label: '(b) Yes, generate the Exam Paper' },
          { id: 'pick_iq', label: '(a) Re-assign Important Questions' },
        ]
      )]);
    } else {
      // Standard branch question
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
      const hasIQ = sessionData?.hasLinkedIQ;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, actions: undefined } : m).concat(pushMsg(
        hasIQ
          ? `Since we already have the chapters and marks from the important questions, how would you like to divide the questions in the actual exam paper (e.g., Part A, B, C)? And what is the exam date?`
          : `Let's build the **Exam Paper** directly. Please confirm:\n1. **Which chapter(s)** should be covered?\n2. **Mark/part distribution** (e.g. Part A: 10×2 marks, Part B: 3×13 marks)\n3. **Exam date**`
      )));
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
    }
  };

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = async (content: string) => {
    if (!isFaculty && questionsToday >= 10) return;
    if (!isFaculty) setQuestionsToday(p => p + 1);

    // Gate: branch question not answered yet
    if (isFaculty && sessionData?.paperKind === null) {
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
          subjectId: sessionData?.subjectId || '',
          subjectName: sessionData?.subjectName || '',
          examType: sessionData?.examType || '',
          year: sessionData?.year || '',
          branch: sessionData?.branch || '',
          instruction: content,
          paperKind: sessionData?.paperKind || 'EXAM_PAPER',
          hasLinkedIQ: sessionData?.hasLinkedIQ || false,
          history,
        });

        const responseText = data.data as string;
        const isIQList = sessionData?.paperKind === 'IMPORTANT_QUESTIONS'
          && responseText.length > 200 && /^\s*\d+\./m.test(responseText);
        const isExamPaper = sessionData?.paperKind === 'EXAM_PAPER'
          && responseText.length > 300
          && (responseText.includes('Part A') || responseText.includes('Section A') || responseText.includes('Marks'));

        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant', content: responseText,
          ...((isIQList || isExamPaper) && { actions: [{ id: 'generate_pdf', label: 'Assign', icon: 'file-down' }] }),
        }]);
      } else {
        const { data } = await api.post('/api/generate/answer', {
          subjectId: sessionData?.subjectId || '',
          subjectName: sessionData?.subjectName || '',
          examType: sessionData?.examType || '',
          question: content,
        });
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant', content: data.data, rag_used: data.cached === true,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, pushMsg('Unable to process your request. Please try again in a few moments.')]);
    } finally {
      setIsStreaming(false);
    }
  };

  // ── After assign success ─────────────────────────────────────────────────
  const handleAssignSuccess = (message: string, assignedKind: PaperKind, assignedPaperId: string) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: message }]);

    if (assignedKind === 'IMPORTANT_QUESTIONS') {
      setSessionData(prev => prev
        ? { ...prev, hasLinkedIQ: true, linkedIQPaperId: assignedPaperId, paperKind: null }
        : prev
      );
      setTimeout(() => {
        setMessages(prev => [...prev, pushMsg(
          `Great! Important questions have been assigned. Ready to generate the actual **Exam Paper** now?`,
          [{ id: 'proceed_to_exam_paper', label: 'Yes, generate the Exam Paper' }]
        )]);
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
          questionsToday={!isFaculty ? questionsToday : 0}
        />
      )}

      <ChatMessages messages={messages} isStreaming={isStreaming} onAction={handleAction} />

      {assignModalOpen && sessionData && (
        <AssignModal
          sessionData={sessionData}
          rawText={paperRawText}
          onClose={() => setAssignModalOpen(false)}
          onSuccess={handleAssignSuccess}
        />
      )}

      <ChatInput
        onSend={handleSend}
        disabled={showOverlay || isStreaming}
        questionsToday={!isFaculty ? questionsToday : 0}
      />
    </div>
  );
}
