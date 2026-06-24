import React, { useState } from 'react';
import api from '@/lib/api';
import { generateQuestionPaperPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';

interface AssignModalProps {
  sessionData: any;
  rawText: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function AssignModal({ sessionData, rawText, onClose, onSuccess }: AssignModalProps) {
  const [branch, setBranch] = useState(sessionData.branch || '');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);

  const extractQuestions = (text: string) => {
    const regex = /\d+\.\s+([\s\S]*?)(?=\n\n\d+\.\s+|\n\nPart|\n\nSection|$)/g;
    const questions = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      questions.push({ text: match[1].trim() });
    }
    if (questions.length === 0) {
      const lines = text.split('\n');
      for (const line of lines) {
        const m = line.trim().match(/^\d+\.\s+(.*)/);
        if (m) questions.push({ text: m[1] });
      }
    }
    return questions;
  };

  const handleGenerateAndSave = async () => {
    setLoading(true);
    try {
      const questions = extractQuestions(rawText);
      const currentYear = new Date().getFullYear();
      const acYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

      const payload = {
        subjectId: sessionData.subjectId,
        examType: sessionData.examType,
        academicYear: acYear,
        assignedToYear: sessionData.year ? parseInt(sessionData.year) : 2,
        assignedToBranch: branch,
        assignedToSection: section || null,
        rawQuestions: questions
      };

      const res = await api.post('/api/question-papers/save-and-assign', payload);
      const { paper, assignment, questions: savedQuestions } = res.data.data;

      generateQuestionPaperPDF({
        paper,
        assignment,
        questions: savedQuestions,
        subject: sessionData.subject
      });

      const assignedSections = section || 'All Sections';
      const successMsg = `Paper assigned successfully.

${sessionData.subject?.name} — ${sessionData.examType}
${branch} · ${sessionData.year}
Assigned to: Section ${assignedSections}

All students in the selected sections will receive a notification and see this in their Recent Activity feed.`;

      onSuccess(successMsg);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save and assign paper");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl p-6 w-[450px] shadow-2xl mx-4 text-[#ECECEA]" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-medium mb-4">Generate & Assign Question Paper</h2>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-[#8C8C8A]">Subject:</span>
            <span>{sessionData.subject?.name} ({sessionData.subject?.code})</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#8C8C8A]">Exam Type:</span>
            <span>{sessionData.examType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#8C8C8A]">Academic Year:</span>
            <span>{new Date().getFullYear()}-{((new Date().getFullYear()) + 1).toString().slice(-2)}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-[#8C8C8A] mb-2 font-medium">Assign To:</p>
          <div className="space-y-3">
            <div className="flex items-center">
              <label className="w-24 text-sm text-[#8C8C8A]">Department</label>
              <input type="text" readOnly value={sessionData.subject?.department || ''} className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-sm text-[#8C8C8A]" />
            </div>
            <div className="flex items-center">
              <label className="w-24 text-sm text-[#8C8C8A]">Branch</label>
              <input type="text" value={branch} onChange={e => setBranch(e.target.value)} className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div className="flex items-center">
              <label className="w-24 text-sm text-[#8C8C8A]">Year</label>
              <input type="text" readOnly value={sessionData.year || ''} className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-sm text-[#8C8C8A]" />
            </div>
            <div className="flex items-center">
              <label className="w-24 text-sm text-[#8C8C8A]">Section</label>
              <input type="text" placeholder="Optional (e.g. A)" value={section} onChange={e => setSection(e.target.value)} className="flex-1 bg-[#1C1C1B] border border-[#3A3A38] rounded-lg px-3 py-2 text-sm text-white" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-[#3A3A38] rounded-xl py-2.5 text-[13px] text-[#8C8C8A] hover:bg-[#333331] transition-colors">
            Cancel
          </button>
          <button onClick={handleGenerateAndSave} disabled={loading} className="flex-1 bg-orange-500 rounded-xl py-2.5 text-[13px] font-medium text-white hover:bg-orange-400 disabled:opacity-40 transition-colors">
            {loading ? 'Saving...' : 'Generate & Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
