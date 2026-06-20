"use client";

import React, { useState } from 'react';
import { Subject, Message } from '@/lib/types';
import { ChatStepOverlay } from './ChatStepOverlay';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

const SUBJECTS: Subject[] = [
  { id: '1', name: 'Data Structures', code: 'CS201', department: 'Computer Science', branch: 'CS', year: '2nd' },
  { id: '2', name: 'Operating Systems', code: 'CS301', department: 'Computer Science', branch: 'CS', year: '2nd' },
  { id: '3', name: 'Computer Networks', code: 'CS302', department: 'Computer Science', branch: 'CS', year: '3rd' },
  { id: '4', name: 'Database Management', code: 'CS401', department: 'Computer Science', branch: 'CS', year: '3rd' },
];

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

  const handleCompleteOverlay = (data: { year?: string; branch?: string; subjectId: string; examType: string }) => {
    const found = SUBJECTS.find(s => s.id === data.subjectId);
    setSessionData({ ...data, subjectName: found?.name ?? 'Subject' });
    setShowOverlay(false);

    if (role === 'faculty') {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Hello Dr. Chen! 👋\n\nLet's generate a **${data.examType}** paper for **${found?.name}**\n📅 Year: ${data.year} · 🏫 Branch: ${data.branch}\n\nPlease tell me the question format you'd like, for example:\n- *"5 questions of 2 marks and 3 questions of 13 marks"*\n- *"2 questions from Linked Lists chapter, 13 marks each"*\n\nOr just type **"generate"** and I'll create a standard format paper.`,
      }]);
    } else {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Here are the **${data.examType}** questions for **${found?.name}**.\n\nWhere would you like to start? I can explain a topic, quiz you on key concepts, or walk through a specific question step by step.`,
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

    setTimeout(() => {
      setIsStreaming(false);

      if (role === 'faculty') {
        if (lower.includes('generate') || lower.includes('marks') || lower.includes('question')) {
          const generated: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Here's the generated **${sessionData?.examType}** paper for **${sessionData?.subjectName}**:\n\n` +
              `**Part A — 2 Marks (5 × 2 = 10)**\n` +
              `1. Define a stack and list its basic operations.\n` +
              `2. What is the time complexity of binary search?\n` +
              `3. Differentiate between linear and binary search.\n` +
              `4. Define a queue. Mention its types.\n` +
              `5. What is a linked list?\n\n` +
              `**Part B — 13 Marks (3 × 13 = 39)**\n` +
              `6. Write an algorithm to insert a node at the beginning of a singly linked list and analyze its time complexity.\n` +
              `7. Compare array and linked list data structures in terms of memory allocation and basic operations.\n` +
              `8. Explain BFS and DFS traversal algorithms with suitable examples.\n\n` +
              `---\n\n` +
              `Would you like to:\n- **Modify** any question (e.g. "change Q2 to be about hashing")\n- **Add** questions from a specific chapter\n- **Generate PDF** when ready`,
            actions: [
              { id: 'generate_pdf', label: 'Generate PDF', icon: 'file-down' }
            ]
          };
          setMessages(prev => [...prev, generated]);
          return;
        }

        if (lower.includes('pdf') || lower.includes('download') || lower.includes('save')) {
          const pdfMsg: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `✅ **PDF Generated Successfully!**\n\n📄 ${sessionData?.subjectName}_${sessionData?.examType?.replace(' ', '')}_${sessionData?.year}.pdf\n\nThe paper has been saved with proper formatting and university template.\n\nWould you like to **assign** this paper to sections?`,
            actions: [
              { id: 'assign_sections', label: 'Assign to Sections', icon: 'users' }
            ]
          };
          setMessages(prev => [...prev, pdfMsg]);
          return;
        }

        if (lower.includes('chapter') || lower.includes('modify') || lower.includes('change')) {
          const modifyMsg: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Got it! I've updated the paper accordingly.\n\nThe modifications have been applied. You can:\n- Ask for more changes\n- Generate PDF when you're satisfied`,
            actions: [
              { id: 'generate_pdf', label: 'Generate PDF', icon: 'file-down' }
            ]
          };
          setMessages(prev => [...prev, modifyMsg]);
          return;
        }

        const defaultMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I understand. Would you like me to generate the questions now? Just tell me the format (e.g. "5 questions of 2 marks, 3 questions of 13 marks") or type **"generate"** for a standard paper.`,
        };
        setMessages(prev => [...prev, defaultMsg]);
        return;
      }

      // Student logic
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Here\'s a detailed explanation based on your question.',
        rag_used: true,
      }]);
    }, 1500);
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
          subjects={SUBJECTS}
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
