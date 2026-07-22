"use client";

import React, { useState } from 'react';
import { Download, Building2, Calendar, FileJson, FileSpreadsheet, Database, RefreshCcw, CheckCircle2 } from 'lucide-react';

export default function ExportPage() {
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [format, setFormat] = useState('json');
  const [dateRange, setDateRange] = useState('all-time');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Data Export & Backup</h1>
          <p className="text-gray-500 mt-1">Export platform data or trigger backups per college</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" /> Target College
              </label>
              <select 
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-gray-50/50 text-gray-900"
              >
                <option value="all">All Colleges (Platform Backup)</option>
                <option value="tech">Tech University</option>
                <option value="arts">Arts College</option>
                <option value="science">Institute of Science</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" /> Date Range
              </label>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-gray-50/50 text-gray-900"
              >
                <option value="all-time">All Time</option>
                <option value="last-30">Last 30 Days</option>
                <option value="last-90">Last 90 Days</option>
                <option value="this-year">This Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'json', label: 'JSON', icon: FileJson },
                  { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
                  { id: 'sql', label: 'SQL Dump', icon: Database },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFormat(opt.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      format === opt.id 
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700' 
                        : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <opt.icon className={`h-5 w-5 ${format === opt.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="w-full inline-flex items-center justify-center rounded-lg bg-black px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all disabled:opacity-70"
            >
              {isExporting ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Trigger Export
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recent Exports */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Exports</h3>
          <div className="space-y-4">
            {[
              { file: 'platform_backup_20241015.sql', type: 'SQL Dump', size: '2.4 GB', date: 'Today, 02:00 AM', status: 'ready' },
              { file: 'tech_univ_users.csv', type: 'CSV', size: '14 MB', date: 'Yesterday, 14:30 PM', status: 'ready' },
              { file: 'arts_college_full.json', type: 'JSON', size: '456 MB', date: 'Oct 12, 10:15 AM', status: 'ready' },
            ].map((exportJob, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
                    {exportJob.type === 'SQL Dump' ? <Database className="h-5 w-5" /> : 
                     exportJob.type === 'CSV' ? <FileSpreadsheet className="h-5 w-5" /> : 
                     <FileJson className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{exportJob.file}</p>
                    <p className="text-xs text-gray-500">{exportJob.size} • {exportJob.date}</p>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
