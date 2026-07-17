"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Building2, GraduationCap, ChevronLeft } from 'lucide-react';
import api from '@/lib/api';
import { BRANCH_OPTIONS } from '@/lib/constants';

export default function OnboardingPage() {
  const router = useRouter();
  const { role, user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    year: '',
    branch: '',
    section: '',
    departmentId: '',
    regulation: '',
    batchYear: '',
    rollNo: ''
  });
  const [batchError, setBatchError] = useState('');
  const [rollError, setRollError] = useState('');

  const validateBatchYear = (val: string) => {
    if (!val) return 'Required';
    const match = val.match(/^(\d{4})\s*-\s*(\d{4})$/);
    if (!match) return 'Format should be YYYY-YYYY (e.g. 2022-2026)';
    const start = parseInt(match[1]);
    const end = parseInt(match[2]);
    if (start >= end) return 'End year must be greater than start year';
    if (end - start > 6) return 'Duration cannot exceed 6 years';
    if (start < 2000 || start > 2050) return 'Invalid start year';
    return '';
  };

  const validateRollNo = (val: string) => {
    if (!val) return 'Required';
    if (!/^[A-Za-z0-9]+$/.test(val)) return 'Must contain only letters and numbers';
    const letterCount = (val.match(/[A-Za-z]/g) || []).length;
    if (letterCount > 2) return 'Can contain at most 2 letters';
    if (/^([A-Za-z0-9])\1+$/.test(val)) return 'Invalid repetitive pattern (e.g. 1111)';
    if (val.length < 4) return 'Roll number too short';
    return '';
  };

  useEffect(() => {
    api.get('/api/departments').then(res => setDepartments(res.data.departments || []));
  }, []);

  const handleSkip = () => {
    localStorage.setItem('onboardingSkipped', 'true');
    router.push(`/${role === 'super_admin' ? 'super-admin' : role}/dashboard`);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put('/api/auth/me', {
        ...(role === 'student' ? {
          year: parseInt(formData.year),
          departmentId: formData.departmentId,
          section: formData.section,
          regulation: formData.regulation,
          batchYear: formData.batchYear,
          rollNo: formData.rollNo
        } : {
          departmentId: formData.departmentId
        })
      });
      // Force refresh of user data
      const res = await api.get('/api/auth/me');
      if (setUser) setUser(res.data.user);
      router.push(`/${role === 'super_admin' ? 'super-admin' : role}/dashboard`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 3) {
      const err = validateBatchYear(formData.batchYear);
      if (err) {
        setBatchError(err);
        return;
      }
      setBatchError('');
    }
    setStep(s => s + 1);
  };

  const canProceed = () => {
    if (step === 1) return !!formData.branch;
    if (step === 2) return !!formData.departmentId;
    if (step === 3) return !!formData.batchYear;
    if (step === 4) return !!formData.year;
    if (step === 5) return !!formData.regulation;
    if (step === 6) return !!formData.section;
    if (step === 7) {
      return !!formData.rollNo && !validateRollNo(formData.rollNo);
    }
    return false;
  };

  const getComputedYear = () => {
    if (!formData.batchYear) return 0;
    const match = formData.batchYear.match(/^(\d{4})\s*-\s*(\d{4})$/);
    if (!match) return 0;
    const start = parseInt(match[1]);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    let diff = currentYear - start;
    if (currentMonth >= 6) diff += 1;
    return Math.max(1, Math.min(4, diff));
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#1C1C1B]">
      <div className="w-full max-w-md bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl p-8 shadow-2xl relative">
        
        {role === 'student' && step > 1 && (
          <button 
            type="button"
            onClick={() => setStep(s => s - 1)}
            className="absolute top-6 left-6 p-1 text-[#8C8C8A] hover:text-[#ECECEA] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1F1F1E] border border-[#3A3A38] rounded-xl flex items-center justify-center mx-auto mb-4">
            {role === 'faculty' ? (
              <Building2 size={20} className="text-[var(--theme-color)]" />
            ) : (
              <GraduationCap size={20} className="text-[var(--theme-color)]" />
            )}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--theme-color)] mb-2">
            {role === 'student' ? 'Student Profile' : 'Complete Your Profile'}
          </h1>
          <p className="text-sm text-[#8C8C8A]">
            {role === 'faculty'
              ? 'Select your department to get started. This is required to personalise your experience.'
              : `Step ${step} of 7`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'faculty' ? (
            <div>
              <label className="block text-sm font-medium text-[#ECECEA] mb-1.5">
                Department <span className="text-red-400">*</span>
              </label>
              <p className="text-[12px] text-[#5A5A58] mb-2">Choose the department you belong to</p>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                required
              >
                <option value="">— Select your department —</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.branch} · {d.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="min-h-[90px]">
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <label className="block text-sm text-[#ECECEA] mb-1.5">What is your branch?</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({...formData, branch: e.target.value, departmentId: ''})}
                    className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                  >
                    <option value="">— Select Branch —</option>
                    {BRANCH_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <label className="block text-sm text-[#ECECEA] mb-1.5">Select your specific department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                    className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                  >
                    <option value="">— Select Department —</option>
                    {departments
                      .filter(d => d.branch === formData.branch)
                      .map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                  </select>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <label className="block text-sm text-[#ECECEA] mb-1.5">Admission / Batch Year</label>
                  <input
                    type="text"
                    value={formData.batchYear}
                    onChange={(e) => {
                      setFormData({...formData, batchYear: e.target.value, year: ''});
                      setBatchError('');
                    }}
                    placeholder="e.g. 2022-2026"
                    className={`w-full bg-[#1F1F1E] border ${batchError ? 'border-red-500' : 'border-[#3A3A38]'} rounded-xl px-4 py-2.5 text-[#ECECEA] focus:outline-none focus:border-[var(--theme-color)] transition-colors`}
                  />
                  {batchError && <p className="text-red-500 text-xs mt-1.5">{batchError}</p>}
                </div>
              )}

              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <label className="block text-sm text-[#ECECEA] mb-1.5">What year are you in?</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                  >
                    <option value="">— Select Year —</option>
                    {[1,2,3,4].map(y => {
                      const compYear = getComputedYear();
                      const disabled = compYear > 0 && y !== compYear;
                      return (
                        <option key={y} value={y} disabled={disabled}>
                          {y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {step === 5 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <label className="block text-sm text-[#ECECEA] mb-1.5">What is your regulation?</label>
                  <select
                    value={formData.regulation}
                    onChange={(e) => setFormData({...formData, regulation: e.target.value})}
                    className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                  >
                    <option value="">— Select Regulation —</option>
                    {['R17', 'R19', 'R20', 'R21', 'R22', 'R23', 'R2021', 'R2017'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              {step === 6 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <label className="block text-sm text-[#ECECEA] mb-1.5">What is your section?</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                    className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                  >
                    <option value="">— Select Section —</option>
                    {(departments.find(d => d.id === formData.departmentId)?.sections || []).map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {step === 7 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <label className="block text-sm text-[#ECECEA] mb-1.5">What is your Roll Number?</label>
                  <input
                    type="text"
                    value={formData.rollNo}
                    onChange={(e) => {
                      setFormData({...formData, rollNo: e.target.value.toUpperCase()});
                      setRollError(validateRollNo(e.target.value.toUpperCase()));
                    }}
                    placeholder="e.g. 21X15A0501"
                    className={`w-full bg-[#1F1F1E] border ${rollError ? 'border-red-500' : 'border-[#3A3A38]'} rounded-xl px-4 py-2.5 text-[#ECECEA] focus:outline-none focus:border-[var(--theme-color)] transition-colors`}
                    required
                  />
                  {rollError && <p className="text-red-500 text-xs mt-1.5">{rollError}</p>}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex flex-col gap-3">
            {role === 'student' ? (
              <button 
                type={step === 7 ? "submit" : "button"} 
                onClick={step < 7 ? () => handleNext() : undefined}
                disabled={loading || !canProceed()} 
                className="w-full bg-[var(--theme-color)] text-white rounded-xl py-3 px-4 font-medium hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed">
                {step < 7 ? 'Next' : (loading ? 'Finish Setup' : 'Finish Setup')}
              </button>
            ) : (
              <button 
                disabled={loading || !formData.departmentId} 
                type="submit" 
                className="w-full bg-[var(--theme-color)] text-white rounded-xl py-3 px-4 font-medium hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Saving...' : 'Save & Continue'}
              </button>
            )}
            
            {/* Skip only available for non-faculty roles */}
            {role !== 'faculty' && (
              <button 
                type="button" 
                onClick={handleSkip}
                className="w-full bg-transparent text-[#8C8C8A] rounded-xl py-2 px-4 text-sm font-medium hover:text-[#ECECEA] transition-colors">
                Skip for now
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
