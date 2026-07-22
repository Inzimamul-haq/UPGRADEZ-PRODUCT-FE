"use client";

import React, { useState } from 'react';
import { Users, Search, Filter, MoreVertical, CheckCircle2, XCircle, Shield, GraduationCap, User } from 'lucide-react';
import { TablePagination } from '@/components/ui/TablePagination';

const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@college.edu', role: 'Admin', college: 'Tech University', status: 'Active', joinedAt: '2024-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@college.edu', role: 'Faculty', college: 'Tech University', status: 'Active', joinedAt: '2024-02-20' },
  { id: 3, name: 'Alice Johnson', email: 'alice@student.edu', role: 'Student', college: 'Arts College', status: 'Suspended', joinedAt: '2024-03-10' },
  { id: 4, name: 'Bob Wilson', email: 'bob@admin.edu', role: 'Admin', college: 'Arts College', status: 'Active', joinedAt: '2024-01-10' },
  { id: 5, name: 'Charlie Brown', email: 'charlie@student.edu', role: 'Student', college: 'Tech University', status: 'Active', joinedAt: '2024-04-05' },
];

const RoleIcon = ({ role }: { role: string }) => {
  switch (role) {
    case 'Admin': return <Shield className="h-4 w-4 text-purple-600" />;
    case 'Faculty': return <GraduationCap className="h-4 w-4 text-blue-600" />;
    case 'Student': return <User className="h-4 w-4 text-green-600" />;
    default: return <User className="h-4 w-4 text-gray-600" />;
  }
};

const RoleBadge = ({ role }: { role: string }) => {
  const colors: Record<string, string> = {
    Admin: 'bg-purple-50 text-purple-700 border-purple-200',
    Faculty: 'bg-blue-50 text-blue-700 border-blue-200',
    Student: 'bg-green-50 text-green-700 border-green-200'
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[role] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      <RoleIcon role={role} />
      {role}
    </span>
  );
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Cross-college oversight of admins, faculty, and students</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-gray-50/50"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-gray-500" />
          <select 
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black bg-white"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admins</option>
            <option value="Faculty">Faculty</option>
            <option value="Student">Students</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">College</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center font-medium text-gray-600 border border-gray-200">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {user.college}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                      user.status === 'Active' 
                        ? 'text-green-700 bg-green-50' 
                        : 'text-red-700 bg-red-50'
                    }`}>
                      {user.status === 'Active' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {user.joinedAt}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200">
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
