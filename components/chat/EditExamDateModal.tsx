"use client";

import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { EditExamDateModalProps } from '@/lib/types';

export function EditExamDateModal({
  paperId,
  currentDate,
  subjectName,
  examType,
  onClose,
  onSaved,
}: EditExamDateModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(currentDate ?? '');
  const [notifyMode, setNotifyMode] = useState<'silent' | 'postpone'>('silent');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!date) { toast.error('Please select a date'); return; }
    if (date < today) { toast.error('Date cannot be in the past'); return; }

    setSaving(true);
    try {
      await api.patch(`/api/question-papers/${paperId}/exam-date`, {
        examDate: date,
        notify: notifyMode === 'postpone',
      });
      toast.success(
        notifyMode === 'postpone'
          ? 'Exam date updated and students notified'
          : 'Exam date updated silently'
      );
      onSaved(date);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update exam date');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl p-6 w-[420px] shadow-2xl mx-4 text-[#ECECEA]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#8C8C8A]" />
            <h2 className="text-[16px] font-medium">Edit Exam Date</h2>
          </div>
          <button onClick={onClose} className="text-[#5A5A58] hover:text-[#ECECEA] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Subject info */}
        <div className="text-[12px] text-[#8C8C8A] mb-5">
          {subjectName} · {examType}
          {currentDate && (
            <span className="ml-2 text-[#5A5A58]">Current: {currentDate}</span>
          )}
        </div>

        {/* Date input */}
        <div className="mb-5">
          <label className="text-[12px] text-[#8C8C8A] block mb-2">New Exam Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            min={today}
            className="w-full bg-[#1C1C1B] border border-[#3A3A38] rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#5A5A58] transition-colors"
          />
        </div>

        {/* Notification mode */}
        <div className="mb-6">
          <p className="text-[12px] text-[#8C8C8A] mb-3">Update type</p>
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="notifyMode"
                value="silent"
                checked={notifyMode === 'silent'}
                onChange={() => setNotifyMode('silent')}
                className="mt-0.5 accent-orange-500"
              />
              <div>
                <p className="text-[13px] text-[#ECECEA] font-medium">Silent Update</p>
                <p className="text-[12px] text-[#5A5A58]">Update date only. No notification sent. Use for corrections.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="notifyMode"
                value="postpone"
                checked={notifyMode === 'postpone'}
                onChange={() => setNotifyMode('postpone')}
                className="mt-0.5 accent-orange-500"
              />
              <div>
                <p className="text-[13px] text-[#ECECEA] font-medium">Postpone (with notification)</p>
                <p className="text-[12px] text-[#5A5A58]">Update date and notify all students in the assigned cohort.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-[#3A3A38] rounded-xl py-2.5 text-[13px] text-[#8C8C8A] hover:bg-[#333331] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!date || saving}
            className="flex-1 bg-orange-500 rounded-xl py-2.5 text-[13px] font-medium text-white hover:bg-orange-400 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : notifyMode === 'postpone' ? 'Update & Notify' : 'Update Silently'}
          </button>
        </div>
      </div>
    </div>
  );
}
