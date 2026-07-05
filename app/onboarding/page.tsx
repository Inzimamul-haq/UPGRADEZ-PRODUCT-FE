"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const { role, user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    year: '',
    branch: '',
    section: '',
    departmentId: ''
  });

  useEffect(() => {
    if (role === 'faculty') {
      api.get('/api/departments').then(res => setDepartments(res.data.departments || []));
    }
  }, [role]);

  const handleSkip = () => {
    localStorage.setItem('onboardingSkipped', 'true');
    router.push(`/${role === 'super_admin' ? 'super-admin' : role}/dashboard`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/api/auth/me', {
        ...(role === 'student' ? {
          year: parseInt(formData.year),
          branch: formData.branch,
          section: formData.section
        } : {
          departmentId: formData.departmentId
        })
      });
      // Force refresh of user data
      const res = await api.get('/api/auth/me');
      if (setUser) setUser(res.data.user);
      router.push(`/${role === 'super_admin' ? 'super-admin' : role}/dashboard`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#1C1C1B]">
      <div className="w-full max-w-md bg-[#2C2C2A] border border-[#3A3A38] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[var(--theme-color)] mb-2">Complete Profile</h1>
          <p className="text-sm text-[#8C8C8A]">Tell us a bit more about your academics</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'faculty' ? (
            <div>
              <label className="block text-sm text-[#ECECEA] mb-1.5">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                required
              >
                <option value="">Select a department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.branch})</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm text-[#ECECEA] mb-1.5">Branch</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                  placeholder="e.g. CSE"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#ECECEA] mb-1.5">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                    placeholder="1 to 4"
                    min="1"
                    max="4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#ECECEA] mb-1.5">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                    className="w-full bg-[#1F1F1E] border border-[#3A3A38] rounded-xl px-4 py-2.5 text-[#ECECEA] placeholder:text-[#5A5A58] focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                    placeholder="e.g. A"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-4 flex flex-col gap-3">
            <button 
              disabled={loading} 
              type="submit" 
              className="w-full bg-[var(--theme-color)] text-white rounded-xl py-3 px-4 font-medium hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
            <button 
              type="button" 
              onClick={handleSkip}
              className="w-full bg-transparent text-[#8C8C8A] rounded-xl py-2 px-4 text-sm font-medium hover:text-[#ECECEA] transition-colors">
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
