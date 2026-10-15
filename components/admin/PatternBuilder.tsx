"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { QuestionPaperPatternSchema, QuestionPaperPatternType } from '@/lib/patternSchema';

const partNames = ['Part A', 'Part B', 'Part C', 'Part D', 'Part E'] as const;
const rbtLevels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as const;

interface PatternBuilderProps {
  initialData?: any;
  onSave: () => void;
  onCancel: () => void;
  setIsDirty?: (dirty: boolean) => void;
}

export default function PatternBuilder({ initialData, onSave, onCancel, setIsDirty }: PatternBuilderProps) {
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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [displayExamType, setDisplayExamType] = useState('CAT');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        label: initialData.label || '',
      });
      if (initialData.examType?.startsWith('CAT')) {
        setDisplayExamType('CAT');
      } else {
        setDisplayExamType(initialData.examType || 'CAT');
      }
    }
  }, [initialData]);

  const markDirty = () => {
    setTouched(true);
    if (setIsDirty) setIsDirty(true);
  };

  // Validation
  const validationError = useMemo(() => {
    const reg = (formData.regulation || '').trim();
    if (!reg) {
      return 'Regulation is required (e.g. R-2021).';
    }
    if (!/^[A-Z0-9][A-Z0-9-]{1,19}$/.test(reg.toUpperCase())) {
      return 'Regulation format must be 2-20 characters: letters, numbers, hyphens (e.g. R-2021).';
    }
    if (!formData.parts || formData.parts.length === 0) {
      return 'At least one Part is required.';
    }
    const names = formData.parts.map(p => p.partName);
    if (new Set(names).size !== names.length) {
      return 'Part names must be unique.';
    }
    for (const p of formData.parts) {
      if (!p.allowedRbt || p.allowedRbt.length === 0) {
        return `${p.partName} must have at least one allowed RBT level.`;
      }
      if (!p.slots || p.slots.length === 0) {
        return `${p.partName} must have at least one slot.`;
      }
      for (const s of p.slots) {
        if (!s.marks || s.marks < 1 || s.marks > 30) {
          return `Slot marks in ${p.partName} must be between 1 and 30.`;
        }
      }
    }
    return null;
  }, [formData]);

  const isValid = validationError === null;

  const addPart = () => {
    if (formData.parts.length >= 5) return;
    const availableNames = partNames.filter(n => !formData.parts.some(p => p.partName === n));
    if (availableNames.length === 0) return;

    markDirty();
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
    markDirty();
    setFormData({
      ...formData,
      parts: formData.parts.filter((_, i) => i !== index)
    });
  };

  const updatePart = (index: number, updates: any) => {
    markDirty();
    const newParts = [...formData.parts];
    newParts[index] = { ...newParts[index], ...updates };
    setFormData({ ...formData, parts: newParts });
  };

  const addSlot = (partIndex: number) => {
    if (formData.parts[partIndex].slots.length >= 4) return;
    markDirty();
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
    markDirty();
    const newParts = [...formData.parts];
    newParts[partIndex].slots = newParts[partIndex].slots.filter((_, i) => i !== slotIndex);
    setFormData({ ...formData, parts: newParts });
  };

  const updateSlot = (partIndex: number, slotIndex: number, updates: any) => {
    markDirty();
    const newParts = [...formData.parts];
    const slot = { ...newParts[partIndex].slots[slotIndex], ...updates };
    newParts[partIndex].slots[slotIndex] = slot;
    setFormData({ ...formData, parts: newParts });
  };

  const handleSave = async () => {
    if (!isValid) return;

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

      if (setIsDirty) setIsDirty(false);
      setSuccessToast('Pattern saved successfully');
      setTimeout(() => {
        onSave();
      }, 500);
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
    <div className="flex flex-col gap-6">
      {/* Toast / Error Banner */}
      {successToast && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px] text-emerald-400">
          {successToast}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Basic Information */}
      <div className="rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-4 sm:p-5">
        <div className="mb-4 pb-2 border-b border-[#3A3A38]/50">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8C8A]">
            Basic Information
          </h2>
          <p className="text-[12px] text-[#8C8C8A] mt-0.5">
            Configure the academic regulation and the target exam category.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-[#ECECEA] mb-1.5">
              Regulation <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. R-2021"
              value={formData.regulation}
              onChange={e => {
                markDirty();
                setFormData({ ...formData, regulation: e.target.value.toUpperCase().trim() });
              }}
              className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] placeholder:text-[#5A5A58] focus:border-[#4A4A48] focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-[#8C8C8A] mt-1">E.g., R-2021, R-2017</p>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#ECECEA] mb-1.5">
              Exam Type
            </label>
            <select
              value={displayExamType}
              onChange={e => {
                markDirty();
                setDisplayExamType(e.target.value);
              }}
              className="w-full rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-3 py-2 text-[13px] text-[#ECECEA] focus:border-[#4A4A48] focus:outline-none transition-colors"
            >
              {['CAT', 'MODEL', 'UNIVERSITY', 'ARREAR', 'ALL'].map(type => (
                <option key={type} value={type}>
                  {type === 'CAT' ? 'CAT (CAT1, CAT2, CAT3)' : type === 'ALL' ? 'ALL (Global Fallback)' : type}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#8C8C8A] mt-1">
              Selecting CAT applies this pattern across CAT1, CAT2, and CAT3.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Parts & Question Slots */}
      <div className="rounded-lg border border-[#3A3A38] bg-[#1F1F1E] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-2 border-b border-[#3A3A38]/50">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8C8A]">
              Parts &amp; Question Slots
            </h2>
            <p className="text-[12px] text-[#8C8C8A] mt-0.5">
              Define question divisions (Part A, B, C) and question slot structures.
            </p>
          </div>
          <button
            type="button"
            onClick={addPart}
            disabled={formData.parts.length >= 5}
            className="flex items-center justify-center gap-1.5 rounded-md border border-[#4A4A48] bg-[#2C2C2A] px-3 py-1.5 text-[12px] font-medium text-[#ECECEA] transition-colors hover:bg-[#333331] disabled:opacity-40 min-h-[36px]"
          >
            <Plus size={14} /> Add Part
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {formData.parts.map((part, pIdx) => (
            <div key={pIdx} className="rounded-lg border border-[#3A3A38] bg-[#2C2C2A] p-3.5 sm:p-4">
              {/* Part Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-3 border-b border-[#3A3A38]/60">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={part.partName}
                    onChange={e => updatePart(pIdx, { partName: e.target.value })}
                    className="rounded-md border border-[#3A3A38] bg-[#1F1F1E] px-3 py-1.5 text-[13px] font-medium text-[#ECECEA] focus:outline-none focus:border-[#4A4A48] min-h-[36px]"
                  >
                    {partNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>

                  <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      checked={part.hasChoice}
                      onChange={e => updatePart(pIdx, { hasChoice: e.target.checked })}
                      className="w-4 h-4 rounded border-[#3A3A38] bg-[#1F1F1E] accent-amber-500"
                    />
                    <span className="text-[12px] text-[#ECECEA]">Questions have (a)/(b) OR choice</span>
                  </label>
                </div>

                {formData.parts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePart(pIdx)}
                    title="Remove Part"
                    aria-label={`Remove ${part.partName}`}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[#8C8C8A] hover:text-red-400 transition-colors self-end sm:self-auto rounded-md hover:bg-[#1F1F1E]"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Allowed RBT Levels */}
              <div className="mb-4">
                <label className="block text-[11px] uppercase tracking-wider text-[#8C8C8A] font-semibold mb-2">
                  Allowed RBT Levels
                </label>
                <div className="flex flex-wrap gap-2">
                  {rbtLevels.map(rbt => {
                    const isSelected = part.allowedRbt?.includes(rbt);
                    return (
                      <button
                        key={rbt}
                        type="button"
                        onClick={() => {
                          const cur = new Set(part.allowedRbt || []);
                          if (cur.has(rbt)) {
                            if (cur.size > 1) cur.delete(rbt);
                          } else {
                            cur.add(rbt);
                          }
                          updatePart(pIdx, { allowedRbt: Array.from(cur).sort() });
                        }}
                        className={`min-h-[34px] px-3 py-1 text-[12px] font-medium rounded-md border transition-all ${
                          isSelected
                            ? 'bg-[#1F1F1E] border-amber-500/60 text-amber-400 font-semibold shadow-sm'
                            : 'bg-[#1F1F1E] border-[#3A3A38] text-[#8C8C8A] hover:bg-[#333331] hover:text-[#ECECEA]'
                        }`}
                      >
                        {rbt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots Section */}
              <div className="rounded-lg border border-[#3A3A38]/70 bg-[#1F1F1E] p-3 sm:p-3.5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[12px] font-medium text-[#ECECEA]">Question Slots</h3>
                  <button
                    type="button"
                    onClick={() => addSlot(pIdx)}
                    disabled={part.slots.length >= 4}
                    className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 disabled:opacity-40 min-h-[32px] px-2"
                  >
                    <Plus size={13} /> Add Slot
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {part.slots.map((slot, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#2C2C2A] border border-[#3A3A38] px-3 py-2 rounded-md"
                    >
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-[#8C8C8A]">Marks:</span>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={slot.marks || ''}
                            onChange={e => updateSlot(pIdx, sIdx, { marks: parseInt(e.target.value, 10) || 0 })}
                            className="w-14 rounded border border-[#3A3A38] bg-[#1F1F1E] px-2 py-1 text-[12px] text-[#ECECEA] focus:outline-none focus:border-[#4A4A48]"
                          />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer border-l border-[#3A3A38] pl-3 py-1">
                          <input
                            type="checkbox"
                            checked={slot.isMcq}
                            onChange={e => updateSlot(pIdx, sIdx, { isMcq: e.target.checked })}
                            className="w-4 h-4 rounded border-[#3A3A38] bg-[#1F1F1E] accent-amber-500"
                          />
                          <span className="text-[12px] text-[#ECECEA]">MCQ</span>
                        </label>
                      </div>

                      <div className="flex justify-end">
                        {part.slots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlot(pIdx, sIdx)}
                            title="Remove Slot"
                            aria-label={`Remove slot ${sIdx + 1}`}
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center text-[#8C8C8A] hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
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
      </div>

      {/* Validation Message below form */}
      {validationError && (
        <div className="text-[12px] text-[#8C8C8A] px-1 flex items-center gap-1.5">
          <AlertCircle size={14} className="text-amber-500/80 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Sticky Bottom Action Bar on Mobile / Standard footer */}
      <div className="sticky bottom-0 z-20 -mx-3 sm:mx-0 px-4 py-3 bg-[#1F1F1E]/95 backdrop-blur-md border-t border-[#3A3A38] sm:rounded-lg sm:border flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 shadow-[0_-8px_16px_rgba(0,0,0,0.3)] sm:shadow-none">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="order-2 sm:order-1 rounded-md border border-[#3A3A38] bg-[#2C2C2A] px-4 py-2 text-[13px] text-[#8C8C8A] hover:text-[#ECECEA] transition-colors hover:bg-[#333331] text-center min-h-[40px]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isValid}
          className="order-1 sm:order-2 flex items-center justify-center gap-2 rounded-md border border-[#4A4A48] bg-amber-600 hover:bg-amber-500 text-white font-medium px-6 py-2 text-[13px] disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[40px] shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {initialData ? 'Save Changes' : 'Create Pattern'}
        </button>
      </div>
    </div>
  );
}
