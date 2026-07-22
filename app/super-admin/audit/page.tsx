"use client";

import React, { useState } from 'react';
import { ClipboardList, Search, Filter, ShieldAlert, Key, UserMinus, Trash2, Calendar, ChevronDown, Download } from 'lucide-react';
import { TablePagination } from '@/components/ui/TablePagination';

const mockLogs = [
  { id: 'AL-901', action: 'Delete College', target: 'Arts College', actor: 'superadmin@system.com', date: '2024-10-15 14:30:22', type: 'destructive', ip: '192.168.1.105' },
  { id: 'AL-902', action: 'API Key Rotation', target: 'Stripe Gateway', actor: 'john@system.com', date: '2024-10-14 09:15:00', type: 'security', ip: '10.0.0.42' },
  { id: 'AL-903', action: 'Suspend User', target: 'alice@student.edu', actor: 'jane@faculty.edu', date: '2024-10-13 16:45:12', type: 'user', ip: '192.168.1.110' },
  { id: 'AL-904', action: 'Delete Theme', target: 'Ocean Blue', actor: 'superadmin@system.com', date: '2024-10-12 11:20:05', type: 'destructive', ip: '192.168.1.105' },
  { id: 'AL-905', action: 'Role Escalation', target: 'bob@admin.edu', actor: 'superadmin@system.com', date: '2024-10-10 08:05:44', type: 'security', ip: '10.0.0.50' },
];

const ActionIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'destructive': return <Trash2 className="h-4 w-4 text-red-600" />;
    case 'security': return <Key className="h-4 w-4 text-amber-600" />;
    case 'user': return <UserMinus className="h-4 w-4 text-blue-600" />;
    default: return <ShieldAlert className="h-4 w-4 text-gray-600" />;
  }
};

const ActionBadge = ({ type }: { type: string }) => {
  const styles: Record<string, string> = {
    destructive: 'bg-red-50 text-red-700 border-red-200',
    security: 'bg-amber-50 text-amber-700 border-amber-200',
    user: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${styles[type] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      <ActionIcon type={type} />
      <span className="capitalize">{type}</span>
    </span>
  );
};

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            Audit Logs
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
              <ShieldAlert className="h-3.5 w-3.5" /> Highly Sensitive
            </span>
          </h1>
          <p className="text-gray-500 mt-1">Immutable trail of destructive actions and security events</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, actor, or target..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-gray-50/50"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select 
              className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black bg-white appearance-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Events</option>
              <option value="destructive">Destructive</option>
              <option value="security">Security</option>
              <option value="user">User Action</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black bg-white appearance-none">
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-mono text-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200 font-sans">
              <tr>
                <th className="px-6 py-4 font-medium">Log ID</th>
                <th className="px-6 py-4 font-medium">Event Type</th>
                <th className="px-6 py-4 font-medium">Action & Target</th>
                <th className="px-6 py-4 font-medium">Actor</th>
                <th className="px-6 py-4 font-medium">IP Address</th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">
                    {log.id}
                  </td>
                  <td className="px-6 py-4">
                    <ActionBadge type={log.type} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{log.action}</div>
                    <div className="text-gray-500 text-xs mt-1">{log.target}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {log.actor}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {log.ip}
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {log.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 font-sans">
          <TablePagination
            page={1}
            total={120}
            rowsPerPage="10"
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
