import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, Info } from 'lucide-react';
import api from '@/lib/api';
import { QuestionPaperPatternSchema, QuestionPaperPatternType } from '@/lib/patternSchema';

const partNames = ['Part A', 'Part B', 'Part C', 'Part D', 'Part E'] as const;
const rbtLevels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as const;

interface PatternBuilderProps {
  initialData?: any;
  onSave: () => void;
}

export default function PatternBuilder({ initialData, onSave }: PatternBuilderProps) {
  const [formData, setFormData] = useState<QuestionPaperPatternType>({
    regulation: '',
    examType: 'CAT1',
    parts: [
      {
        partName: 'Part A',
        allowedRbt: ['L1', 'L2'],
        hasChoice: false,
        sortOrder: 0,
        slots: [
          { marks: 2, isMcq: false, sortOrder: 0, defaultCount: 1 }
        ]
      }
    ]
  });

  const [loadingRegs, setLoadingRegs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [displayExamType, setDisplayExamType] = useState('CAT');

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        label: initialData.label || '',
      });
      if (initialData.examType?.startsWith('CAT')) {
        setDisplayExamType('CAT');
      } else {
        setDisplayExamType(initialData.examType);
      }
    }
  }, [initialData]);

  useEffect(() => {
    setLoadingRegs(false);
  }, []);

  const addPart = () => {
    if (formData.parts.length >= 5) return;
    const availableNames = partNames.filter(n => !formData.parts.some(p => p.partName === n));
    if (availableNames.length === 0) return;
    
    setFormData({
      ...formData,
      parts: [
        ...formData.parts,
        {
          partName: availableNames[0],
          allowedRbt: ['L3', 'L4'],
          hasChoice: true,
          sortOrder: formData.parts.length,
          slots: [{ marks: 16, isMcq: false, sortOrder: 0, defaultCount: 1 }]
        }
      ]
    });
  };

  const removePart = (index: number) => {
    setFormData({
      ...formData,
      parts: formData.parts.filter((_, i) => i !== index)
    });
  };

  const updatePart = (index: number, updates: any) => {
    const newParts = [...formData.parts];
    newParts[index] = { ...newParts[index], ...updates };
    setFormData({ ...formData, parts: newParts });
  };

  const addSlot = (partIndex: number) => {
    if (formData.parts[partIndex].slots.length >= 4) return;
    const newParts = [...formData.parts];
    newParts[partIndex].slots.push({
      marks: 10,
      isMcq: false,
      sortOrder: newParts[partIndex].slots.length,
      defaultCount: 1
    });
    setFormData({ ...formData, parts: newParts });
  };

  const removeSlot = (partIndex: number, slotIndex: number) => {
    const newParts = [...formData.parts];
    newParts[partIndex].slots = newParts[partIndex].slots.filter((_, i) => i !== slotIndex);
    setFormData({ ...formData, parts: newParts });
  };

  const updateSlot = (partIndex: number, slotIndex: number, updates: any) => {
    const newParts = [...formData.parts];
    const slot = { ...newParts[partIndex].slots[slotIndex], ...updates };
    
    newParts[partIndex].slots[slotIndex] = slot;
    setFormData({ ...formData, parts: newParts });
  };

  const handleSave = async () => {
    try {
      setError('');
      setSaving(true);
      
      const examTypesToSave = displayExamType === 'CAT' ? ['CAT1', 'CAT2', 'CAT3'] : [displayExamType];
      
      if (initialData?.id) {
        // Fetch existing patterns for this regulation to update or create the group
        const res = await api.get(`/api/patterns/resolve?regulation=${formData.regulation}`);
        const existingPatterns = res.data.patterns || [];

        for (const et of examTypesToSave) {
          const parsed = QuestionPaperPatternSchema.parse({
            regulation: formData.regulation,
            examType: et,
            parts: formData.parts,
          });

          const existing = existingPatterns.find((p: any) => p.examType === et);
          if (existing) {
            await api.put(`/api/patterns/${existing.id}`, parsed);
          } else {
            await api.post('/api/patterns', parsed);
          }
        }
      } else {
        for (const et of examTypesToSave) {
          const parsed = QuestionPaperPatternSchema.parse({
            regulation: formData.regulation,
            examType: et,
            parts: formData.parts,
          });
          try {
            await api.post('/api/patterns', parsed);
          } catch (e: any) {
            if (e.response?.status !== 409) throw e;
          }
        }
      }
      onSave();
    } catch (err: any) {
      console.error(err);
      if (err.name === 'ZodError' || err.issues) {
        const message = err.errors?.[0]?.message || err.issues?.[0]?.message || 'Validation failed';
        setError(message);
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save pattern');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-[#ECECEA] mb-2">Regulation</label>
          <input 
             type="text" 
             placeholder="Type regulation (e.g. R-2021)"
             value={formData.regulation}
             onChange={e => setFormData({ ...formData, regulation: e.target.value.toUpperCase().trim() })}
             className="w-full bg-[#252525] border border-[#3A3A38] rounded-xl px-4 py-3 text-sm text-[#ECECEA] focus:outline-none focus:border-[#5A5A58]"
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-[#ECECEA] mb-2">Exam Type</label>
          <select
            value={displayExamType}
            onChange={e => setDisplayExamType(e.target.value)}
            className="w-full bg-[#252525] border border-[#3A3A38] rounded-xl px-4 py-3 text-sm text-[#ECECEA] focus:outline-none focus:border-[#5A5A58]"
          >
            {['CAT', 'MODEL', 'UNIVERSITY', 'ARREAR', 'ALL'].map(type => (
              <option key={type} value={type}>{type === 'ALL' ? 'ALL (Global Fallback)' : type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-[#30302E] pb-4">
          <h2 className="text-xl font-medium text-[#ECECEA]">Pattern Parts</h2>
          <button 
            onClick={addPart}
            disabled={formData.parts.length >= 5}
            className="flex items-center gap-2 bg-[#252525] border border-[#3A3A38] px-3 py-1.5 rounded-lg text-sm text-[#ECECEA] hover:bg-[#2A2A28] disabled:opacity-50"
          >
            <Plus size={16} /> Add Part
          </button>
        </div>

        {formData.parts.map((part, pIdx) => (
          <div key={pIdx} className="bg-[#1C1C1B] border border-[#30302E] rounded-xl p-5">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4 items-center">
                <select
                  value={part.partName}
                  onChange={e => updatePart(pIdx, { partName: e.target.value })}
                  className="bg-[#252525] border border-[#3A3A38] rounded-lg px-3 py-1.5 text-sm text-[#ECECEA] focus:outline-none"
                >
                  {partNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={part.hasChoice}
                    onChange={e => updatePart(pIdx, { hasChoice: e.target.checked })}
                    className="w-4 h-4 bg-[#252525] border-[#3A3A38] rounded"
                  />
                  <span className="text-sm text-[#8C8C8A]">Questions have (a)/(b) OR choice</span>
                </div>
              </div>
              {formData.parts.length > 1 && (
                <button onClick={() => removePart(pIdx)} className="text-[#8C8C8A] hover:text-red-400">
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm text-[#8C8C8A] mb-2">Allowed RBT Levels</label>
              <div className="flex gap-2">
                {rbtLevels.map(rbt => (
                  <button
                    key={rbt}
                    onClick={() => {
                      const cur = new Set(part.allowedRbt);
                      if (cur.has(rbt)) {
                         if (cur.size > 1) cur.delete(rbt);
                      } else cur.add(rbt);
                      updatePart(pIdx, { allowedRbt: Array.from(cur).sort() });
                    }}
                    className={`px-3 py-1 text-sm rounded-lg border transition-all ${
                      part.allowedRbt.includes(rbt) 
                        ? 'bg-[#3A3A38] border-[#4A4A48] text-[#ECECEA]' 
                        : 'bg-transparent border-[#30302E] text-[#8C8C8A] hover:bg-[#252525]'
                    }`}
                  >
                    {rbt}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#252525] border border-[#30302E] rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-[#ECECEA]">Slots (Types of Questions)</h3>
                <button 
                  onClick={() => addSlot(pIdx)}
                  disabled={part.slots.length >= 4}
                  className="flex items-center gap-1 text-xs text-[#ECECEA] hover:text-white disabled:opacity-50"
                >
                  <Plus size={14} /> Add Slot
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {part.slots.map((slot, sIdx) => (
                  <div key={sIdx} className="grid grid-cols-12 gap-4 items-center bg-[#1C1C1B] border border-[#3A3A38] p-3 rounded-lg">
                    <div className="col-span-8">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#8C8C8A]">Marks:</span>
                        <input
                          type="number"
                          value={slot.marks || ''}
                          onChange={e => updateSlot(pIdx, sIdx, { marks: parseInt(e.target.value) || 0 })}
                          className="w-16 bg-transparent border-b border-[#3A3A38] px-1 py-1 text-sm text-[#ECECEA] focus:outline-none focus:border-[#5A5A58]"
                        />
                      </div>
                    </div>

                    <div className="col-span-3 flex items-center justify-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slot.isMcq}
                          onChange={e => updateSlot(pIdx, sIdx, { isMcq: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-[#ECECEA]">MCQ</span>
                      </label>
                    </div>
                    <div className="col-span-1 text-right">
                      {part.slots.length > 1 && (
                        <button onClick={() => removeSlot(pIdx, sIdx)} className="text-[#8C8C8A] hover:text-red-400">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

      <div className="flex justify-end pt-6 border-t border-[#30302E]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#ECECEA] text-[#121212] px-6 py-3 rounded-xl font-medium text-[15px] hover:bg-white transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
          {initialData ? 'Update Pattern' : 'Create Pattern'}
        </button>
      </div>
    </div>
  );
}
