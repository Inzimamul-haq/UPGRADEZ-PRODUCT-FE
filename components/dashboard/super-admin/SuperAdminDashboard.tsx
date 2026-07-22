"use client"

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Building2, Users, Database, Zap, AlertTriangle, ArrowUpRight, Shield } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardData {
  stats: {
    totalColleges: number;
    totalUsers: number;
    totalTokens: number;
    totalRequests: number;
    nearOrOverQuota: number;
  };
  quotaHealth: {
    critical: number;
    warning: number;
    healthy: number;
  };
  collegeUsages: {
    id: string;
    name: string;
    used: number;
    limit: number;
    percentUsed: number;
  }[];
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981']; // Red, Yellow, Green

const StatCard = ({ title, value, icon: Icon, highlight = false }: any) => (
  <div className={`p-5 rounded-lg border flex flex-col justify-between ${highlight ? 'bg-[#3a2020] border-red-900/50' : 'bg-[#2C2C2A] border-[#3A3A38]'}`}>
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2 rounded-md bg-[#1F1F1E] border border-[#3A3A38]`}>
        <Icon className={`h-4 w-4 ${highlight ? 'text-red-400' : 'text-[#8C8C8A]'}`} />
      </div>
    </div>
    <div>
      <p className={`text-[12px] font-medium mb-1 uppercase tracking-wider ${highlight ? 'text-red-400' : 'text-[#8C8C8A]'}`}>{title}</p>
      <h3 className={`text-[20px] font-medium ${highlight ? 'text-red-300' : 'text-[#ECECEA]'}`}>{value}</h3>
    </div>
  </div>
);

export const SuperAdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tokenTrend, setTokenTrend] = useState<any[]>([]);
  const [requestTrend, setRequestTrend] = useState<any[]>([]);
  const [tokenRange, setTokenRange] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // We handle simple fallbacks if backend routes are not fully ready yet
        const [statsRes, tokenRes, reqRes] = await Promise.all([
          api.get('/api/super-admin/dashboard/stats'),
          api.get(`/api/super-admin/dashboard/analytics/token-usage?range=${tokenRange}`),
          api.get('/api/super-admin/dashboard/analytics/request-trend')
        ]);

        setData(statsRes.data.data);
        setTokenTrend(tokenRes.data.data);
        setRequestTrend(reqRes.data.data);
      } catch (err: any) {
        console.log(err);
        console.log(err.response);
        console.log(err.response?.status);
        console.log(err.response?.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tokenRange]);

  if (loading || !data) {
    return <div className="p-8 flex items-center justify-center min-h-[500px] text-[#8C8C8A]">Loading dashboard...</div>;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const donutData = [
    { name: 'Critical (>90%)', value: data.quotaHealth.critical },
    { name: 'Warning (70-90%)', value: data.quotaHealth.warning },
    { name: 'Healthy (<70%)', value: data.quotaHealth.healthy },
  ];

  return (
    <div className="px-6 py-6 w-full max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-[16px] font-medium text-[#ECECEA]">Platform Dashboard</h1>
        <p className="text-[12px] text-[#8C8C8A] mt-0.5">Super Admin</p>
      </div>

      {/* Top Row: Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          title="Active Colleges"
          value={data.stats.totalColleges}
          icon={Building2}
        />
        <StatCard
          title="Total Users"
          value={formatNumber(data.stats.totalUsers)}
          icon={Users}
        />
        <StatCard
          title="Tokens (Month)"
          value={formatNumber(data.stats.totalTokens)}
          icon={Database}
        />
        <StatCard
          title="AI Requests"
          value={formatNumber(data.stats.totalRequests)}
          icon={Zap}
        />
        <StatCard
          title="Near/Over Quota"
          value={data.stats.nearOrOverQuota}
          icon={AlertTriangle}
          highlight={data.stats.nearOrOverQuota > 0}
        />
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Token Usage Chart */}
        <div className="lg:col-span-2 bg-[#2C2C2A] p-5 rounded-lg border border-[#3A3A38]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[14px] font-medium text-[#ECECEA]">Platform Token Usage</h3>
              <p className="text-[12px] text-[#8C8C8A] mt-1">Aggregate consumption across all tenants</p>
            </div>
            <div className="flex bg-[#1F1F1E] p-1 rounded-md border border-[#3A3A38]">
              {['day', 'week', 'month'].map(r => (
                <button
                  key={r}
                  onClick={() => setTokenRange(r)}
                  className={`px-3 py-1 text-[11px] font-medium rounded uppercase tracking-wider transition-all ${tokenRange === r ? 'bg-[#3A3A38] text-[#ECECEA]' : 'text-[#8C8C8A] hover:text-[#B0B0AE]'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tokenTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3A3A38" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8C8C8A' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8C8C8A' }} tickFormatter={(val) => formatNumber(val)} />
                <Tooltip
                  cursor={{ fill: '#3A3A38' }}
                  contentStyle={{ borderRadius: '6px', border: '1px solid #3A3A38', backgroundColor: '#1F1F1E', color: '#ECECEA', fontSize: '12px' }}
                  formatter={(value: any) => [Number(value).toLocaleString(), 'Tokens Used']}
                />
                <Bar dataKey="tokensUsed" fill="#B0B0AE" radius={[2, 2, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Request Volume Chart */}
        <div className="lg:col-span-1 bg-[#2C2C2A] p-5 rounded-lg border border-[#3A3A38]">
          <div className="mb-6">
            <h3 className="text-[14px] font-medium text-[#ECECEA]">Request Volume</h3>
            <p className="text-[12px] text-[#8C8C8A] mt-1">Monthly AI interaction frequency</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={requestTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3A3A38" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8C8C8A' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8C8C8A' }} tickFormatter={(val) => formatNumber(val)} />
                <Tooltip
                  contentStyle={{ borderRadius: '6px', border: '1px solid #3A3A38', backgroundColor: '#1F1F1E', color: '#ECECEA', fontSize: '12px' }}
                  formatter={(value: any) => [Number(value).toLocaleString(), 'Requests']}
                />
                <Line type="monotone" dataKey="requestCount" stroke="#8C8C8A" strokeWidth={2} dot={{ r: 3, fill: '#8C8C8A', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#ECECEA' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Triage Table */}
        <div className="lg:col-span-2 bg-[#2C2C2A] rounded-lg border border-[#3A3A38] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#3A3A38]">
            <h3 className="text-[14px] font-medium text-[#ECECEA]">Colleges Ranked by Usage</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-[13px] text-left">
              <thead className="text-[11px] text-[#8C8C8A] uppercase tracking-wider bg-[#1F1F1E]">
                <tr>
                  <th className="px-4 py-3 font-medium">College Name</th>
                  <th className="px-4 py-3 font-medium">Tokens Used</th>
                  <th className="px-4 py-3 font-medium">Limit</th>
                  <th className="px-4 py-3 font-medium w-48">Usage Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A3A38]">
                {data.collegeUsages.map((c) => (
                  <tr key={c.id} className="hover:bg-[#333331] transition-colors">
                    <td className="px-4 py-3 text-[#ECECEA]">{c.name}</td>
                    <td className="px-4 py-3 text-[#B0B0AE]">{c.used.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#8C8C8A]">{formatNumber(c.limit)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-[#1F1F1E] rounded-full h-1.5 border border-[#3A3A38]">
                          <div
                            className={`h-1.5 rounded-full ${c.percentUsed >= 90 ? 'bg-red-500' : c.percentUsed >= 70 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(c.percentUsed, 100)}%` }}
                          />
                        </div>
                        <span className={`text-[11px] font-medium w-10 text-right ${c.percentUsed >= 90 ? 'text-red-400' : c.percentUsed >= 70 ? 'text-yellow-400' : 'text-[#8C8C8A]'}`}>
                          {c.percentUsed.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quota Health Donut */}
        <div className="lg:col-span-1 bg-[#2C2C2A] p-5 rounded-lg border border-[#3A3A38] flex flex-col">
          <div className="mb-2">
            <h3 className="text-[14px] font-medium text-[#ECECEA]">Health Distribution</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center min-h-[200px]">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '6px', border: '1px solid #3A3A38', backgroundColor: '#1F1F1E', color: '#ECECEA', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col gap-2 w-full max-w-[200px] mt-4">
              {donutData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-[#8C8C8A]">{entry.name}</span>
                  </div>
                  <span className="font-medium text-[#ECECEA]">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

