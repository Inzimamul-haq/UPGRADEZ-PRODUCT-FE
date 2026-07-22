"use client";

import React, { useState } from 'react';
import { Palette, Plus, Search, Edit2, Trash2 } from 'lucide-react';

const mockThemes = [
  { id: 1, name: 'Default Light', primaryColor: '#2563eb', secondaryColor: '#1e40af', type: 'Light', activeColleges: 12 },
  { id: 2, name: 'Midnight Dark', primaryColor: '#6366f1', secondaryColor: '#4f46e5', type: 'Dark', activeColleges: 5 },
  { id: 3, name: 'Forest Green', primaryColor: '#16a34a', secondaryColor: '#15803d', type: 'Light', activeColleges: 2 },
];

export default function ThemesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Theme Management</h1>
          <p className="text-gray-500 mt-1">Manage global themes available across all colleges</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all">
          <Plus className="h-4 w-4 mr-2" />
          Create Theme
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search themes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-gray-50/50"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockThemes.map((theme) => (
          <div key={theme.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200">
            <div className="h-32 w-full relative" style={{ backgroundColor: theme.primaryColor }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div 
                className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-full opacity-50"
                style={{ backgroundColor: theme.secondaryColor }}
              />
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{theme.name}</h3>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 mt-1">
                    {theme.type}
                  </span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Active in {theme.activeColleges} colleges</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty state / add new card */}
        <button className="h-full min-h-[280px] rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-900 transition-all group">
          <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-white flex items-center justify-center group-hover:shadow-sm transition-all">
            <Plus className="h-6 w-6" />
          </div>
          <span className="font-medium">Create New Theme</span>
        </button>
      </div>
    </div>
  );
}
