import React, { useEffect } from 'react';
import { X, Info } from 'lucide-react';

interface AIDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUESTION_STYLES = [
  {
    name: 'Theory',
    means: 'Questions focus on understanding and explaining concepts rather than solving calculations or performing technical tasks.',
    chooseWhen: 'Students mainly need to remember, explain, compare, describe, discuss, or interpret concepts.',
    // typical: [
    //   'Define or explain a concept',
    //   'Describe a process or principle',
    //   'Compare two concepts',
    //   'Explain advantages, disadvantages, applications, or characteristics',
    //   'Discuss a topic in detail',
    // ],
    ex: 'Tamil, Chemistry, Environmental Sciences & Sustainability, Principles of Management, Human Values & Ethics, Project Report Writing, Foundations of Data Science',
  },
  {
    name: 'Problem Solving',
    means: 'Questions require students to calculate, derive, or solve a problem step by step using formulas, mathematical methods, or established procedures.',
    chooseWhen: 'A significant part of the subject is based on numerical problems, and getting the correct solution requires working through calculations.',
    typical: [
      'Solve a numerical problem',
      'Calculate a required value',
      'Apply a formula',
      'Perform a derivation',
      'Analyze given numerical data',
      'Solve a mathematical or engineering problem',
    ],
    ex: 'Matrices & Calculus, Statistics & Numerical Methods, Discrete Mathematics, Control Systems',
  },
  {
    name: 'Applied',
    means: 'Questions test whether students can apply concepts to a calculation, practical situation, or given scenario. The subject is not purely numerical, but students are expected to use what they learned to solve problems.',
    chooseWhen: 'The subject contains a mixture of conceptual learning and practical application, where questions can move from "understand this" to "use this."',
    typical: [
      'Apply a concept to a given situation',
      'Solve a formula-based problem',
      'Analyze a practical case',
      'Determine what happens when conditions change',
      'Select or justify an appropriate method',
      'Combine theory with practical calculation',
    ],
    ex: 'Physics, BEEE, Power Systems, Theory of Computation, Compiler Design, Digital Principles & Computer Organization',
  },
  {
    name: 'Hybrid',
    means: 'Questions combine conceptual understanding with technical skills or procedures. Students may need to write, analyze, design, configure, or work with a technical system.',
    chooseWhen: 'The subject is not simply theory or numerical problem solving, and students are expected to do something technical with their knowledge.',
    typical: [
      'Write or analyze code',
      'Trace an algorithm',
      'Write or analyze SQL queries',
      'Design or analyze a system',
      'Explain how a technical component works',
      'Analyze a technical scenario',
      'Compare technical approaches',
    ],
    ex: 'Python Programming, C Programming, OOPS, Data Structures, Algorithms, DBMS, Operating Systems, AIML, Computer Networks, Network Security, Cryptography & Cyber Security, Distributed Computing, Big Data, Virtualization, DevOps, Full Stack, OOSE, Embedded Systems & IoT, UI/UX Design',
  },
  {
    name: 'Diagram-Based',
    means: 'The diagram is an important part of solving or answering the question. Students may need to draw, interpret, analyze, or solve using a diagram.',
    chooseWhen: 'Questions frequently depend on a visual representation such as an engineering drawing, circuit, structural model, or other technical diagram.',
    typical: [
      'Draw a required diagram',
      'Interpret a given diagram',
      'Solve a problem using a diagram',
      'Analyze forces, connections, or components shown in a diagram',
      'Convert one visual representation into another',
      'Construct a technical drawing',
    ],
    ex: 'Engineering Graphics, CAD, Structural Analysis, Circuit Theory',
    // important: 'Use this style only when diagrams are genuinely central to the subject. An occasional diagram does not make a subject Diagram-Based.',
  },
];

export function AIDetailsPanel({ isOpen, onClose }: AIDetailsPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-[1000px] max-h-full flex flex-col bg-[#1F1F1E] border border-[#3A3A38] shadow-2xl rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3A3A38] bg-[#1F1F1E] shrink-0">
          <h2 className="text-[16px] font-medium text-[#ECECEA]">AI Question & Diagram Guide</h2>
          <button 
            onClick={onClose}
            className="text-[#8C8C8A] hover:text-[#ECECEA] transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5A5A58]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content (Grid Layout) */}
        <div className="flex-1 overflow-y-auto p-6 animate-in fade-in duration-[400ms]">
          <p className="text-[13px] text-[#8C8C8A] leading-relaxed mb-6">
            Pick the question style that best describes your subject. Then enable only the diagram types that truly belong to it. The AI adds a diagram only when a question really needs one, and never uses a type you haven't enabled.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Column 1: Question Style */}
            <section className="space-y-4">
              <h3 className="text-[14px] font-semibold text-[#ECECEA] border-b border-[#3A3A38] pb-2">Question Configuration</h3>

              {/* <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Info size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-[12px] leading-snug">
                  Choose the style that best describes how students are normally expected to answer questions in this subject. You are setting the overall style for the subject, not the style of every individual question. The AI will vary questions within the selected style.
                </p>
              </div> */}
              
              <div className="grid gap-3">
                {QUESTION_STYLES.map(block => (
                  <div key={block.name} className="p-4 rounded-lg border border-[#3A3A38] bg-[#2C2C2A]/40 flex flex-col">
                    <span className="text-[13px] font-semibold text-[#ECECEA] mb-1.5">{block.name}</span>
                    <div className="text-[12px] text-[#B0B0AE] leading-relaxed">{block.means}</div>

                    <div className="mt-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8C8C8A] mb-1">Choose this when</div>
                      <div className="text-[12px] text-[#8C8C8A] leading-relaxed">{block.chooseWhen}</div>
                    </div>
{/* 
                    <div className="mt-2.5">
                      <div className="text-[11px] font-medium text-[#ECECEA] mb-0.5">Typical questions</div>
                      <ul className="space-y-0.5">
                        {block.typical.map(item => (
                          <li key={item} className="flex gap-2 text-[12px] text-[#8C8C8A] leading-snug">
                            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#5A5A58]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div> */}

                    <div className="mt-3 border-t border-[#3A3A38]/60 pt-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 mb-1.5">Examples</div>
                      <div className="flex flex-wrap gap-1.5">
                        {block.ex.split(', ').map(subject => (
                          <span
                            key={subject}
                            className="px-2 py-0.5 rounded-md border border-blue-500/20 bg-blue-500/10 text-[11px] leading-snug text-blue-300"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* {block.important && (
                      <div className="mt-2.5 rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[11px] leading-snug text-amber-400">
                        {block.important}
                      </div>
                    )} */}
                  </div>
                ))}
              </div>
            </section>

            {/* Column 2: Diagram Configuration */}
            <section className="space-y-4 flex flex-col lg:sticky lg:top-0">
              <h3 className="text-[14px] font-semibold text-[#ECECEA] border-b border-[#3A3A38] pb-2">Diagram Configuration</h3>
              
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Info size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-[12px] leading-snug">
                  Enabling a diagram type does not mean every question will have a diagram. Subjects with no types enabled have diagrams turned off.
                </p>
              </div>

              <div className="space-y-2 mt-2 flex-1">
                <div className="text-[12px] font-semibold text-[#ECECEA]">Subjects with diagrams you can configure</div>
                <div className="grid gap-2 border border-[#3A3A38] rounded-lg p-3 bg-[#2C2C2A]/20">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#ECECEA]">Data Structures, Algorithms</span>
                    <div className="flex gap-1"><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">Tree</span><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">Graph</span></div>
                  </div>
                  <div className="flex items-center justify-between text-[12px] border-t border-[#3A3A38]/50 pt-2">
                    <span className="text-[#ECECEA]">Computer Networks, Network Security</span>
                    <div className="flex gap-1"><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">Network</span></div>
                  </div>
                  <div className="flex items-center justify-between text-[12px] border-t border-[#3A3A38]/50 pt-2">
                    <span className="text-[#ECECEA]">Control Systems, Power Systems</span>
                    <div className="flex gap-1"><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">Block</span><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">Circuit</span></div>
                  </div>
                  <div className="flex items-center justify-between text-[12px] border-t border-[#3A3A38]/50 pt-2">
                    <span className="text-[#ECECEA]"> Circuit Theory</span>
                    <div className="flex gap-1"><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">Circuit</span></div>
                  </div>
                  <div className="flex items-center justify-between text-[12px] border-t border-[#3A3A38]/50 pt-2">
                    <span className="text-[#ECECEA]">CAD, Engineering Graphics</span>
                    <div className="flex gap-1"><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">Engineering Drawing </span></div>
                  </div>
                  <div className="flex items-center justify-between text-[12px] border-t border-[#3A3A38]/50 pt-2">
                    <span className="text-[#ECECEA]">Structural Analysis</span>
                    <div className="flex gap-1"><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">Mech Structural</span></div>
                  </div>
                </div>

                {/* <div className="text-[12px] font-semibold text-[#8C8C8A] pt-3">Subjects with diagrams off by default (can be switched on)</div> */}
                {/* <div className="grid gap-2 border border-[#3A3A38] rounded-lg p-3 bg-[#2C2C2A]/10">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#ECECEA]">DBMS</span>
                    <div className="flex gap-1"><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">ER Diagram</span></div>
                  </div>
                  <div className="flex items-center justify-between text-[12px] border-t border-[#3A3A38]/50 pt-2">
                    <span className="text-[#ECECEA]">OOSE, Operating Systems</span>
                    <div className="flex gap-1"><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">UML</span><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">State Diagram</span></div>
                  </div>
                  <div className="flex items-center justify-between text-[12px] border-t border-[#3A3A38]/50 pt-2">
                    <span className="text-[#ECECEA]">Theory of Computation, Compiler Design</span>
                    <div className="flex gap-1"><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">State Diagram</span><span className="px-1.5 py-0.5 rounded bg-[#3A3A38] text-[#8C8C8A]">Tree</span></div>
                  </div>
                </div> */}
              </div>

              {/* <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 mt-2">
                <Info size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-[12px] leading-snug">
                  The AI decides whether an individual question needs a diagram, but it can never go outside what you enabled.
                </p>
              </div> */}
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}