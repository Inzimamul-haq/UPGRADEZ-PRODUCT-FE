"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Megaphone, Send, Users, Shield, GraduationCap, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";

export default function BroadcastPage() {
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [broadcastToDelete, setBroadcastToDelete] = useState<any>(null);

  const fetchBroadcasts = async () => {
    try {
      const res = await api.get('/api/superadmin/broadcasts');
      setRecentBroadcasts(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch broadcasts', error);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleSend = async () => {
    try {
      setLoading(true);
      await api.post('/api/superadmin/broadcasts', {
        title,
        message,
        audience: target,
      });
      setTitle('');
      setMessage('');
      fetchBroadcasts();
    } catch (error) {
      console.error('Failed to send broadcast', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!broadcastToDelete) return;
    try {
      await api.delete(`/api/superadmin/broadcasts/${broadcastToDelete.id}`);
      fetchBroadcasts();
      setIsDeleteModalOpen(false);
      setBroadcastToDelete(null);
    } catch (error) {
      console.error('Failed to delete broadcast', error);
    }
  };

  return (
    <div className="px-6 py-6 w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#ECECEA]">Broadcast</h1>
        <p className="text-sm text-[#8C8C8A] mt-1">Send platform-wide notifications and alerts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#2C2C2A] rounded-xl border border-[#3A3A38] overflow-hidden">
            <div className="p-6 space-y-6">
              
              {/* Target Audience */}
              <div>
                <label className="block text-[12px] font-medium text-[#8C8C8A] mb-3 uppercase tracking-wider">Target Audience</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'ALL', label: 'All Users', icon: Users },
                    { id: 'ADMIN', label: 'Admins Only', icon: Shield },
                    { id: 'FACULTY', label: 'Faculty Only', icon: GraduationCap },
                    { id: 'STUDENT', label: 'Students Only', icon: AlertCircle },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTarget(option.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                        target === option.id 
                          ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]' 
                          : 'border-[#3A3A38] bg-[#1F1F1E] text-[#8C8C8A] hover:border-[#10b981]/50'
                      }`}
                    >
                      <option.icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Details */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-[12px] font-medium text-[#8C8C8A] mb-1 uppercase tracking-wider">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Scheduled Maintenance this Sunday"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#3A3A38] focus:outline-none focus:border-[#10b981] transition-all bg-[#1F1F1E] text-[#ECECEA] placeholder-[#5A5A58]"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-[12px] font-medium text-[#8C8C8A] mb-1 uppercase tracking-wider">
                    Message Body
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your announcement here..."
                    className="w-full px-4 py-3 rounded-lg border border-[#3A3A38] focus:outline-none focus:border-[#10b981] transition-all bg-[#1F1F1E] text-[#ECECEA] placeholder-[#5A5A58] resize-y"
                  />
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 bg-[#1F1F1E] border-t border-[#3A3A38] flex justify-end items-center">
              <button 
                onClick={handleSend}
                disabled={!title || !message || loading}
                className="inline-flex items-center justify-center rounded-lg bg-[#10b981] px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#059669] focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:ring-offset-2 focus:ring-offset-[#1F1F1E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#2C2C2A] rounded-xl border border-[#3A3A38] p-6 h-full">
            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="h-5 w-5 text-[#8C8C8A]" />
              <h3 className="text-[#ECECEA] font-medium">Recent Broadcasts</h3>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#3A3A38] scrollbar-track-transparent">
              {recentBroadcasts.length === 0 && (
                <p className="text-sm text-[#8C8C8A]">No broadcasts found.</p>
              )}
              {recentBroadcasts.map((item, i) => (
                <div key={item.id || i} className="p-4 rounded-lg bg-[#1F1F1E] border border-[#3A3A38] space-y-2 relative group">
                  <button 
                    onClick={() => { setBroadcastToDelete(item); setIsDeleteModalOpen(true); }}
                    className="absolute top-3 right-3 text-[#5A5A58] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex justify-between items-start gap-2 pr-6">
                    <span className="text-sm font-medium text-[#ECECEA] line-clamp-2">{item.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] uppercase tracking-wider whitespace-nowrap">
                      {item.audience}
                    </span>
                  </div>
                  <p className="text-xs text-[#8C8C8A] line-clamp-2">{item.message}</p>
                  <div className="flex items-center gap-3 text-xs text-[#5A5A58] pt-2 mt-2 border-t border-[#3A3A38]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 truncate">
                      <Users className="h-3 w-3" /> {item.creator?.name || 'Admin'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Broadcast"
        description={`Are you sure you want to delete the broadcast "${broadcastToDelete?.title}"? This action cannot be undone.`}
        requireSecret={false}
      />
    </div>
  );
}
