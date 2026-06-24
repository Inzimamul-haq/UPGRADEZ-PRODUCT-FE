"use client";

import React, { useState } from 'react';
import { Subject, Message } from '@/lib/types';
import { ChatStepOverlay } from './ChatStepOverlay';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
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
  } | null>(null);

  // Faculty-specific state
  const [showAssign, setShowAssign] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const SECTIONS = ['A', 'B', 'C', 'All Sections'];

  const handleCompleteOverlay = (data: { year?: string; branch?: string; subject: Subject; examType: string }) => {
    setSessionData({ ...data, subjectId: data.subject.id, subjectName: data.subject.name });
    setShowOverlay(false);

    if (role === 'faculty' || role === 'admin' || role === 'super_admin' || role === 'super-admin') {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Hello! 👋\n\nLet's generate a **${data.examType}** paper for **${data.subject.name}**\n📅 Year: ${data.year} · 🏫 Branch: ${data.branch}\n\nPlease tell me the question format you'd like, for example:\n- *"5 questions of 2 marks and 3 questions of 13 marks"*\n- *"2 questions from Linked Lists chapter, 13 marks each"*\n\nOr just type **"generate"** and I'll create a standard format paper.`,
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
      handleSend('Generate PDF');
    } else if (actionId === 'assign_sections') {
      setShowAssign(true);
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

    const lower = content.toLowerCase();

    try {
      if (role === 'faculty' || role === 'admin' || role === 'super_admin' || role === 'super-admin') {
        
        // Intercept local actions
        if (lower === 'generate pdf' || lower.includes('download pdf')) {
          const pdfMsg: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `✅ **PDF Generated Successfully!**\n\n📄 ${sessionData?.subjectName}_${sessionData?.examType?.replace(' ', '')}_${sessionData?.year}.pdf\n\nThe paper has been saved with proper formatting and university template.\n\nWould you like to **assign** this paper to sections?`,
            actions: [
              { id: 'assign_sections', label: 'Assign to Sections', icon: 'users' }
            ]
          };
          setMessages(prev => [...prev, pdfMsg]);
          setIsStreaming(false);
          return;
        }

        // Format history for backend
        // We skip the first welcome message if we want, or send everything.
        const history = messages.map(msg => ({
          role: msg.role, // 'user' or 'assistant'
          parts: [{ text: msg.content }]
        }));

        const { data } = await api.post('/api/generate/qp', {
          subjectName: sessionData?.subjectName || '',
          examType: sessionData?.examType || '',
          year: sessionData?.year || '',
          branch: sessionData?.branch || '',
          instruction: content,
          history: history
        });

        const generatedMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.data,
          actions: [
            { id: 'generate_pdf', label: 'Generate PDF', icon: 'file-down' }
          ]
        };
        setMessages(prev => [...prev, generatedMsg]);

      } else {
        // Student logic placeholder (you can point this to a real student endpoint later)
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

  const toggleSection = (s: string) => {
    if (s === 'All Sections') {
      setSelectedSections(prev => prev.includes('All Sections') ? [] : ['All Sections']);
      return;
    }
    setSelectedSections(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev.filter(x => x !== 'All Sections'), s]
    );
  };

  const handleAssign = () => {
    if (selectedSections.length === 0) return;
    setShowAssign(false);
    const sections = selectedSections.includes('All Sections') ? 'All Sections' : selectedSections.join(', ');
    const assignMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `✅ **Paper Assigned Successfully!**\n\n📋 ${sessionData?.subjectName} — ${sessionData?.examType}\n🏫 ${sessionData?.branch} · ${sessionData?.year}\n📌 Assigned to: **Section ${sections}**\n\nAll students in the selected sections will see this in their Recent Activity feed. They can now access and practice this paper.`,
    };
    setMessages(prev => [...prev, assignMsg]);
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

      {/* Section Assignment Overlay for Faculty */}
      {showAssign && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAssign(false)}>
          <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl p-6 w-[360px] shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-[16px] font-medium text-[#ECECEA] mb-1">Assign Paper</p>
            <p className="text-[12px] text-[#8C8C8A] mb-5">
              {sessionData?.subjectName} — {sessionData?.examType} · {sessionData?.branch} · {sessionData?.year}
            </p>

            <p className="text-[12px] text-[#8C8C8A] mb-2">Select sections:</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {SECTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSection(s)}
                  className={`py-2.5 rounded-lg text-[13px] font-medium border transition-colors ${selectedSections.includes(s)
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-[#1C1C1B] text-[#8C8C8A] border-[#3A3A38] hover:border-[#4A4A48]'
                    }`}
                >
                  {s === 'All Sections' ? s : `Section ${s}`}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAssign(false)} className="flex-1 border border-[#3A3A38] rounded-xl py-2.5 text-[13px] text-[#8C8C8A] hover:bg-[#333331] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedSections.length === 0}
                className="flex-1 bg-orange-500 rounded-xl py-2.5 text-[13px] font-medium text-white hover:bg-orange-400 disabled:opacity-40 transition-colors"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        disabled={showOverlay || isStreaming}
        questionsToday={role === 'student' ? questionsToday : 0}
      />
    </div>
  );
}
