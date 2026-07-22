"use client";

import React, { useState } from 'react';
import { Megaphone, Send, Users, Shield, GraduationCap, AlertCircle, History, Clock } from 'lucide-react';

export default function BroadcastPage() {
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('all');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Broadcast</h1>
          <p className="text-gray-500 mt-1">Send platform-wide notifications and alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compose Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
              
              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Target Audience</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'all', label: 'All Users', icon: Users },
                    { id: 'admins', label: 'Admins Only', icon: Shield },
                    { id: 'faculty', label: 'Faculty Only', icon: GraduationCap },
                    { id: 'urgent', label: 'Urgent Alert', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTarget(option.id)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        target === option.id 
                          ? option.border || 'border-black bg-gray-900 text-white' 
                          : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <option.icon className={`h-6 w-6 ${target === option.id && !option.color ? 'text-white' : option.color || ''}`} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Details */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Scheduled Maintenance this Sunday"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-gray-50/50"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message Body
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your announcement here..."
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-gray-50/50 resize-y"
                  />
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                This will be sent to approximately <strong className="text-gray-900">4,520</strong> users.
              </span>
              <button 
                disabled={!title || !message}
                className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Broadcast
              </button>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6 text-gray-900 font-semibold">
              <History className="h-5 w-5 text-gray-400" />
              <h3>Recent Broadcasts</h3>
            </div>
            
            <div className="space-y-6">
              {[
                { title: 'System Update Completed', date: '2 hours ago', target: 'All Users', type: 'info' },
                { title: 'Downtime Notice', date: 'Yesterday', target: 'Admins Only', type: 'urgent' },
                { title: 'New Features Released', date: 'Oct 12, 2024', target: 'Faculty Only', type: 'info' },
              ].map((item, i) => (
                <div key={i} className="relative pl-6 border-l-2 border-gray-100 last:border-transparent pb-6 last:pb-0">
                  <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ${item.type === 'urgent' ? 'bg-red-500' : 'bg-blue-500'}`} />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-900">{item.title}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {item.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {item.target}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
