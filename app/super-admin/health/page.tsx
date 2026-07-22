"use client";

import React from 'react';
import { Activity, Server, Database, HardDrive, Cpu, Network, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, trend, status = 'good' }: any) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${status === 'good' ? 'bg-emerald-50 text-emerald-600' : status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div>
        <h3 className="text-gray-500 font-medium text-sm mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default function SystemHealthPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            System Health 
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              All Systems Operational
            </span>
          </h1>
          <p className="text-gray-500 mt-1">Real-time monitoring for BullMQ, Redis, and overall infrastructure</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all">
          <Activity className="h-4 w-4 mr-2" />
          Run Diagnostics
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="API Latency" value="45ms" icon={Network} trend={-12} status="good" />
        <MetricCard title="Redis Memory" value="2.4 GB" icon={Database} trend={5} status="warning" />
        <MetricCard title="CPU Usage" value="34%" icon={Cpu} trend={-2} status="good" />
        <MetricCard title="Disk Space" value="68%" icon={HardDrive} trend={1} status="good" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Status */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Services</h3>
          <div className="space-y-4">
            {[
              { name: 'Core API', status: 'Operational', uptime: '99.99%' },
              { name: 'PostgreSQL Database', status: 'Operational', uptime: '99.95%' },
              { name: 'Redis Cache', status: 'Operational', uptime: '100%' },
              { name: 'BullMQ Workers', status: 'Degraded', uptime: '98.50%', warning: true },
              { name: 'Storage Bucket', status: 'Operational', uptime: '99.99%' },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  {service.warning ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{service.name}</p>
                    <p className="text-xs text-gray-500">{service.uptime} uptime</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                  service.warning ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Queues Monitor */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">BullMQ Queues</h3>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="pb-3 font-medium">Queue Name</th>
                  <th className="pb-3 font-medium">Active</th>
                  <th className="pb-3 font-medium">Waiting</th>
                  <th className="pb-3 font-medium">Failed</th>
                  <th className="pb-3 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { name: 'email-notifications', active: 12, waiting: 45, failed: 2, completed: '12.4k' },
                  { name: 'report-generation', active: 3, waiting: 8, failed: 0, completed: '1.2k' },
                  { name: 'data-sync', active: 1, waiting: 0, failed: 5, completed: '856' },
                  { name: 'image-processing', active: 0, waiting: 0, failed: 0, completed: '5.6k' },
                ].map((queue) => (
                  <tr key={queue.name} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{queue.name}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {queue.active}
                      </span>
                    </td>
                    <td className="py-4 text-gray-600">{queue.waiting}</td>
                    <td className="py-4">
                      {queue.failed > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                          {queue.failed}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="py-4 text-gray-600">{queue.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
