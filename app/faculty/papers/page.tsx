"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Eye, Download, FileText } from 'lucide-react';
import Link from 'next/link';

type Subject = { id: string; name: string; code: string; papers: number };
type Paper = { id: string; exam_type: string; year: string; questions: number; students: number };

const subjects: Subject[] = [
  { id: '1', name: 'Data Structures', code: 'CS201', papers: 8 },
  { id: '2', name: 'Operating Systems', code: 'CS301', papers: 6 },
  { id: '3', name: 'Computer Networks', code: 'CS302', papers: 5 },
  { id: '4', name: 'Database Management', code: 'CS401', papers: 4 },
];

const papersBySubject: Record<string, Paper[]> = {
  '1': [
    { id: 'p1', exam_type: 'CAT 1', year: '2023-24', questions: 8, students: 43 },
    { id: 'p2', exam_type: 'CAT 1', year: '2022-23', questions: 7, students: 55 },
    { id: 'p3', exam_type: 'CAT 2', year: '2023-24', questions: 10, students: 38 },
    { id: 'p4', exam_type: 'Model', year: '2023-24', questions: 15, students: 61 },
    { id: 'p5', exam_type: 'University', year: '2022-23', questions: 20, students: 72 },
  ],
  '2': [
    { id: 'p6', exam_type: 'CAT 1', year: '2023-24', questions: 9, students: 40 },
    { id: 'p7', exam_type: 'CAT 2', year: '2023-24', questions: 11, students: 35 },
    { id: 'p8', exam_type: 'Model', year: '2022-23', questions: 14, students: 50 },
  ],
  '3': [
    { id: 'p9', exam_type: 'CAT 1', year: '2023-24', questions: 8, students: 30 },
    { id: 'p10', exam_type: 'University', year: '2023-24', questions: 18, students: 65 },
  ],
  '4': [
    { id: 'p11', exam_type: 'CAT 1', year: '2023-24', questions: 7, students: 28 },
    { id: 'p12', exam_type: 'CAT 2', year: '2023-24', questions: 9, students: 32 },
  ],
};

const EXAM_TABS = ['All', 'CAT 1', 'CAT 2', 'Model', 'University'];

const examTypeColors: Record<string, string> = {
  'CAT 1': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'CAT 2': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  'Model': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'University': 'text-green-400 bg-green-400/10 border-green-400/20',
};

export default function FacultyPapersPage() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activeTab, setActiveTab] = useState('All');

  // Subject list view
  if (!selectedSubject) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6 w-full pt-14 md:pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-medium text-[#ECECEA]">My Papers</h1>
            <p className="text-[12px] text-[#8C8C8A] mt-0.5">Select a subject to view your generated papers</p>
          </div>
          <Link
            href="/chat/new?role=faculty"
            className="flex items-center gap-2 bg-[#ECECEA] text-[#1C1C1B] text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-white transition-colors"
          >
            <FileText size={14} />
            Generate
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {subjects.map(subject => (
            <button
              key={subject.id}
              onClick={() => { setSelectedSubject(subject); setActiveTab('All'); }}
              className="w-full text-left bg-[#2C2C2A] border border-[#3A3A38] rounded-xl px-5 py-4 flex items-center justify-between hover:bg-[#333331] transition-colors group"
            >
              <div>
                <p className="text-[11px] text-[#8C8C8A] uppercase tracking-wider">{subject.code}</p>
                <p className="text-[14px] font-medium text-[#ECECEA] mt-0.5">{subject.name}</p>
                <p className="text-[12px] text-[#5A5A58] mt-1">{subject.papers} papers</p>
              </div>
              <ChevronRight size={16} className="text-[#5A5A58] group-hover:text-[#8C8C8A] transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Paper list view for selected subject
  const papers = papersBySubject[selectedSubject.id] || [];
  const filtered = activeTab === 'All' ? papers : papers.filter(p => p.exam_type === activeTab);

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 w-full pt-14 md:pt-6">
      {/* Back nav */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setSelectedSubject(null)} className="text-[#8C8C8A] hover:text-[#ECECEA] transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-[12px] text-[#8C8C8A]">Papers</span>
      </div>

      <div>
        <p className="text-[11px] text-[#8C8C8A] uppercase tracking-wider">{selectedSubject.code}</p>
        <h1 className="text-[18px] font-medium text-[#ECECEA] mt-0.5">{selectedSubject.name}</h1>
      </div>

      {/* Exam type tabs */}
      <div className="mt-4 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {EXAM_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-[#ECECEA] text-[#1C1C1B]'
                : 'text-[#8C8C8A] hover:bg-[#333331] hover:text-[#ECECEA]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Papers */}
      <div className="mt-4 flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12">
            <FileText size={24} className="text-[#5A5A58] mb-2" />
            <p className="text-[13px] text-[#8C8C8A]">No papers for this exam type</p>
          </div>
        )}
        {filtered.map(paper => (
          <div key={paper.id} className="bg-[#2C2C2A] border border-[#3A3A38] rounded-xl px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-medium border rounded px-2 py-0.5 ${examTypeColors[paper.exam_type] || 'text-[#8C8C8A] bg-[#333331] border-[#3A3A38]'}`}>
                    {paper.exam_type}
                  </span>
                  <span className="text-[11px] text-[#5A5A58] flex items-center gap-1">
                    <Clock size={10} /> {paper.year}
                  </span>
                </div>
                <p className="text-[13px] text-[#8C8C8A] mt-2">{paper.questions} questions · {paper.students} student accesses</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Link
                href="/chat/new?role=faculty"
                className="flex items-center gap-1.5 text-[12px] text-[#ECECEA] bg-[#333331] border border-[#3A3A38] rounded-lg px-3 py-1.5 hover:bg-[#3A3A38] transition-colors"
              >
                <Eye size={13} /> View Questions
              </Link>
              <button className="flex items-center gap-1.5 text-[12px] text-[#ECECEA] bg-[#333331] border border-[#3A3A38] rounded-lg px-3 py-1.5 hover:bg-[#3A3A38] transition-colors">
                <Download size={13} /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
