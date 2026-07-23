"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Trash2, Key, UserMinus, Calendar, ChevronDown } from 'lucide-react';
import { TableShell, ColumnDef } from '@/components/ui/TableShell';
import { TablePagination } from '@/components/ui/TablePagination';
import api from '@/lib/api';

interface College {
  id: string;
  name: string;
  shortName: string | null;
}

const ACTION_OPTIONS = [
  'SUBJECT_CREATE', 'SUBJECT_EDIT', 'SUBJECT_DELETE',
  'QUESTION_PAPER_EDIT_EXAM_DATE',
  'DEPARTMENT_CREATE', 'DEPARTMENT_EDIT', 'DEPARTMENT_DELETE',
  'STUDENT_EDIT', 'STUDENT_DELETE', 'STUDENT_BULK_PROMOTE',
  'FACULTY_EDIT', 'FACULTY_DELETE',
  'COLLEGE_CREATE', 'COLLEGE_EDIT', 'COLLEGE_DELETE',
  'SUPERADMIN_USER_EDIT', 'SUPERADMIN_USER_DELETE',
  'BROADCAST_CREATE'
];

const ActionBadge = ({ type }: { type: string }) => {
  const styles: Record<string, string> = {
    destructive: 'bg-red-500/10 text-red-500 border-red-500/20',
    security: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    user: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  const Icon = type === 'destructive' ? Trash2 : type === 'security' ? Key : UserMinus;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${styles[type] || 'bg-[#3A3A38] text-text-primary border-border-default'}`}>
      <Icon className="w-3 h-3" />
      <span className="capitalize">{type}</span>
    </span>
  );
};

export default function AuditLogsPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedDays, setSelectedDays] = useState('');
  const [actorId, setActorId] = useState('');

  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState("20");

  useEffect(() => {
    api.get('/api/superadmin/users/filters/colleges')
      .then(res => setColleges(Array.isArray(res.data) ? res.data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit,
        });
        if (selectedCollege) query.append('collegeId', selectedCollege);
        if (selectedType) query.append('type', selectedType);
        if (selectedAction) query.append('action', selectedAction);
        if (selectedDays) query.append('days', selectedDays);
        if (actorId) query.append('actorId', actorId);

        const res = await api.get(`/api/superadmin/audit-logs?${query.toString()}`);
        setData(res.data?.data || []);
        setTotal(res.data?.total || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [selectedCollege, selectedType, selectedAction, selectedDays, actorId, page, limit]);

  const columns: ColumnDef[] = [
    { label: "Action", width: "250px" },
    { label: "Actor", width: "250px" },
    { label: "College", width: "150px" },
    { label: "Time", width: "200px" },
    { label: "Type", width: "120px", align: "right" },
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          Audit Logs
        </h1>
        <p className="text-text-muted text-sm">Immutable trail of platform actions and security events</p>
      </div>

      <div className="p-4 bg-panel border border-border-default rounded-lg space-y-4">
        {/* Search Bar for Actor */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search by Actor ID..." 
            value={actorId}
            onChange={(e) => {
              setActorId(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-[#2C2C2A] border border-border-default rounded-md text-sm text-text-primary outline-none focus:border-text-muted transition-colors"
          />
        </div>

        {/* Grid Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs text-text-muted uppercase font-semibold tracking-wider">Type</label>
            <select 
              value={selectedType} 
              onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
              className="bg-[#2C2C2A] border border-border-default rounded-md text-sm text-text-primary px-3 py-2 outline-none focus:border-text-muted transition-colors appearance-none"
            >
              <option value="">All Events</option>
              <option value="destructive">Destructive</option>
              <option value="security">Security</option>
              <option value="user">User Action</option>
            </select>
            <ChevronDown className="absolute right-3 bottom-2.5 h-4 w-4 text-text-muted pointer-events-none" />
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs text-text-muted uppercase font-semibold tracking-wider">College</label>
            <select 
              value={selectedCollege} 
              onChange={(e) => { setSelectedCollege(e.target.value); setPage(1); }}
              className="bg-[#2C2C2A] border border-border-default rounded-md text-sm text-text-primary px-3 py-2 outline-none focus:border-text-muted transition-colors appearance-none"
            >
              <option value="">All Colleges (Platform)</option>
              {colleges.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 bottom-2.5 h-4 w-4 text-text-muted pointer-events-none" />
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs text-text-muted uppercase font-semibold tracking-wider">Action</label>
            <select 
              value={selectedAction} 
              onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
              className="bg-[#2C2C2A] border border-border-default rounded-md text-sm text-text-primary px-3 py-2 outline-none focus:border-text-muted transition-colors appearance-none"
            >
              <option value="">All Actions</option>
              {ACTION_OPTIONS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 bottom-2.5 h-4 w-4 text-text-muted pointer-events-none" />
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs text-text-muted uppercase font-semibold tracking-wider">Date Range</label>
            <select 
              value={selectedDays} 
              onChange={(e) => { setSelectedDays(e.target.value); setPage(1); }}
              className="bg-[#2C2C2A] border border-border-default rounded-md text-sm text-text-primary px-3 py-2 outline-none focus:border-text-muted transition-colors appearance-none"
            >
              <option value="">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <ChevronDown className="absolute right-3 bottom-2.5 h-4 w-4 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      <TableShell
        columns={columns}
        isLoading={isLoading}
        isEmpty={data.length === 0}
        emptyIcon={ShieldAlert}
        emptyHeading="No audit log entries match these filters."
        emptySubtext="Try adjusting your filters to see more results."
        minWidth="1000px"
      >
        {data.map((log) => {
          const college = colleges.find(c => c.id === log.collegeId);
          const collegeName = log.collegeId ? (college?.shortName || college?.name || 'Unknown') : 'Platform';

          return (
            <div key={log.id} className="flex items-center px-4 py-3 border-b border-[#2E2E2C] last:border-0 hover:bg-[#2C2C2A]/50 transition-colors text-sm text-text-primary">
              <div style={{ width: "250px" }} className="flex flex-col pr-2">
                <span className="font-medium">{log.action}</span>
                {log.targetId && <span className="text-text-muted text-xs truncate">Target: {log.targetId}</span>}
              </div>
              <div style={{ width: "250px" }} className="text-text-muted truncate pr-2">{log.actor}</div>
              <div style={{ width: "150px" }} className="truncate pr-2">{collegeName}</div>
              <div style={{ width: "200px" }} className="text-text-muted">{formatDate(log.createdAt)}</div>
              <div style={{ width: "120px" }} className="text-right">
                <ActionBadge type={log.type} />
              </div>
            </div>
          );
        })}
      </TableShell>

      {total > 0 && (
        <TablePagination
          page={page}
          total={total}
          rowsPerPage={limit}
          onPageChange={setPage}
          onRowsPerPageChange={(v) => {
            setLimit(v);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
