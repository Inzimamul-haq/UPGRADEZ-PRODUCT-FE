"use client";

import React, { useState } from 'react';
import { Subject, Message } from '@/lib/types';
import { ChatStepOverlay } from './ChatStepOverlay';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { AssignModal } from './AssignModal';
import api from '@/lib/api';


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

  // Unified state for both flows
  const [sessionData, setSessionData] = useState<{
    year?: string;
    branch?: string;
    subjectId: string;
    examType: string;
    subjectName?: string;
    subject?: Subject;
  } | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [paperRawText, setPaperRawText] = useState("");

  const handleCompleteOverlay = (data: { year?: string; branch?: string; subject: Subject; examType: string }) => {
    setSessionData({ ...data, subjectId: data.subject.id, subjectName: data.subject.name, subject: data.subject });
    setShowOverlay(false);

    if (role === 'faculty' || role === 'admin' || role === 'super_admin' || role === 'super-admin') {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Hello! 👋\n\nLet's generate a **${data.examType}** paper for **${data.subject.name}**\n Year: ${data.year} ·  Branch: ${data.branch}\n\nPlease tell me the question format you'd like, for example:\n- "5 questions of 2 marks and 3 questions of 13 marks"*\n- *"2 questions from Linked Lists chapter, 13 marks each"*\n`,
      }]);
    } else {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Here are the **${data.examType}** questions for **${data.subject.name}**.\n\nWhere would you like to start? I can explain a topic, quiz you on key concepts, or walk through a specific question step by step.`,
      }]);
    }
  };

  const handleAction = (messageId: string, actionId: string) => {
    if (actionId === 'generate_pdf') {
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        setPaperRawText(msg.content);
        setAssignModalOpen(true);
      }
    }
  };

  const handleSend = async (content: string) => {
    if (!role || role === 'student') {
      if (questionsToday >= 10) return;
      setQuestionsToday(prev => prev + 1);
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      if (role === 'faculty' || role === 'admin' || role === 'super_admin' || role === 'super-admin') {
        const history = messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }));

        const { data } = await api.post('/api/generate/qp', {
          subjectId: sessionData?.subjectId || '',
          subjectName: sessionData?.subjectName || '',
          examType: sessionData?.examType || '',
          year: sessionData?.year || '',
          branch: sessionData?.branch || '',
          instruction: content,
          history: history
        });

        const responseText = data.data as string;
        const isPaper = responseText.length > 300 && (responseText.includes('Part A') || responseText.includes('Section A') || responseText.includes('Marks'));

        const generatedMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: responseText,
          ...(isPaper && {
            actions: [
              { id: 'generate_pdf', label: 'Generate PDF', icon: 'file-down' }
            ]
          })
        };
        setMessages(prev => [...prev, generatedMsg]);

      } else {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Here\'s a detailed explanation based on your question.',
          rag_used: true,
        }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while communicating with the AI. Please try again.',
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleAssignSuccess = (message: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: message
    }]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#1C1C1B] relative">
      {showOverlay && (
        <ChatStepOverlay
          role={role}
          onComplete={handleCompleteOverlay}
        />
      )}

      {!showOverlay && (
        <ChatHeader
          subjectName={sessionData?.subjectName ?? 'Study Session'}
          examType={sessionData?.examType ?? (initialPaperId ? 'Paper Chat' : 'General')}
          questionsToday={role === 'student' ? questionsToday : 0} />
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
        questionsToday={role === 'student' ? questionsToday : 0}
      />
    </div>
  );
}
