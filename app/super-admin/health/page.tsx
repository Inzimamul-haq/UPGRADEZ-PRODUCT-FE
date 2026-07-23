"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Server, Database, Network, CheckCircle2, AlertTriangle, RotateCw, Layers, Clock, Cpu, XCircle, HelpCircle } from 'lucide-react';
import api from '@/lib/api';

export default function SystemHealthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/superadmin/systemhealth');
      setData(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError("You do not have permission to view system health.");
      } else {
        setError("Failed to fetch system health data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const MetricCard = ({ title, value, icon: Icon, status = 'Running' }: any) => {
    const getStatusColors = (s: string) => {
      switch (s) {
        case 'Running':
        case 'Connected':
        case 'good':
          return 'bg-emerald-500/10 text-emerald-400';
        case 'Warning':
        case 'warning':
          return 'bg-amber-500/10 text-amber-400';
        case 'Failed':
        case 'error':
          return 'bg-red-500/10 text-red-400';
        case 'Stopped':
        case 'Unknown':
        default:
          return 'bg-gray-500/10 text-gray-400';
      }
    };

    return (
      <div className="bg-[#1A1A19] p-4 rounded-xl border border-[#2E2E2C] flex items-center gap-4 hover:border-[#3A3A38] transition-colors">
        <div className={`p-2.5 rounded-lg ${getStatusColors(status)}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{title}</p>
          <p className="text-xl font-bold text-text-primary mt-0.5">
            {loading ? <span className="inline-block animate-pulse bg-[#2C2C2A] h-6 w-20 rounded"></span> : value}
          </p>
        </div>
      </div>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Running':
      case 'Connected':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'Warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'Failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Stopped':
      case 'Unknown':
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    let classes = "";
    switch (status) {
      case 'Running':
      case 'Connected':
        classes = "bg-emerald-500/10 text-emerald-400";
        break;
      case 'Warning':
        classes = "bg-amber-500/10 text-amber-400";
        break;
      case 'Failed':
        classes = "bg-red-500/10 text-red-400";
        break;
      case 'Stopped':
      case 'Unknown':
      default:
        classes = "bg-gray-500/10 text-gray-400";
        break;
    }
    return <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${classes}`}>{status}</span>;
  };

  const isOperational = data?.overallStatus === 'Running';
  const isWarning = data?.overallStatus === 'Warning';
  const isFailed = data?.overallStatus === 'Failed';

  const overallBadgeClasses = isOperational
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : isWarning 
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-red-500/10 text-red-400 border-red-500/20';
  
  const pingColorClasses = isOperational
    ? 'bg-emerald-400'
    : isWarning
      ? 'bg-amber-400'
      : 'bg-red-400';

  const pingBaseClasses = isOperational
    ? 'bg-emerald-500'
    : isWarning
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="h-screen p-6 space-y-5 overflow-hidden animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-3">
            System Health
            {!loading && data && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${overallBadgeClasses}`}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColorClasses}`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pingBaseClasses}`}></span>
                </span>
                {isOperational ? 'All Systems Operational' : isWarning ? 'Degraded Performance' : 'System Critical'}
              </span>
            )}
          </h1>
        </div>
        <button 
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-[#2C2C2A] border border-[#3A3A38] px-3.5 py-1.5 text-xs font-medium text-text-primary hover:bg-[#3A3A38] focus:outline-none transition-all disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard 
              title="API Latency" 
              value={data?.metrics?.latency || '0ms'} 
              icon={Network} 
              status="good" 
            />
            <MetricCard 
              title="Redis Memory" 
              value={data?.metrics?.redisMemory || '0B'} 
              icon={Database} 
              status={data?.metrics?.redisMemory ? 'good' : 'warning'} 
            />
            <MetricCard 
              title="Failure Rate" 
              value={
                data?.queues?.length 
                  ? (data.queues.reduce((acc: number, q: any) => acc + parseFloat(q.failureRate || "0"), 0) / data.queues.length).toFixed(1) + '%' 
                  : '0%'
              } 
              icon={Activity} 
              status="good" 
            />
            <MetricCard 
              title="Waiting Jobs" 
              value={data?.queues?.reduce((acc: number, q: any) => acc + (q.waiting || 0), 0) || 0} 
              icon={Layers} 
              status="good" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1">
            {/* Services Status */}
            <div className="lg:col-span-1 bg-[#1A1A19] rounded-xl border border-[#2E2E2C] p-4">
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Services</h3>
              <div className="space-y-2">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-[#2C2C2A] h-12 rounded-lg"></div>
                  ))
                ) : (
                  data?.services?.map((service: any) => (
                    <div key={service.name} className="flex items-center justify-between p-2.5 rounded-lg bg-[#141413] border border-[#2E2E2C]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getStatusIcon(service.status)}
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary text-xs truncate">{service.name}</p>
                          {(service.uptime || service.memory) && (
                            <p className="text-[10px] text-text-muted mt-0.5">
                              {service.uptime && <span className="mr-1.5">Up: {service.uptime}</span>}
                              {service.memory && <span>Mem: {service.memory}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Queues Monitor */}
            <div className="lg:col-span-3 bg-[#1A1A19] rounded-xl border border-[#2E2E2C] p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">BullMQ Queues</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-text-muted uppercase border-b border-[#2E2E2C]">
                    <tr>
                      <th className="pb-2 font-medium">Queue Name</th>
                      <th className="pb-2 font-medium">Active / Wait</th>
                      <th className="pb-2 font-medium">Workers</th>
                      <th className="pb-2 font-medium">Failure Rate</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2E2E2C]">
                    {loading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5} className="py-3"><div className="animate-pulse bg-[#2C2C2A] h-6 rounded"></div></td>
                        </tr>
                      ))
                    ) : data?.queues?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-text-muted text-xs">No queues registered</td>
                      </tr>
                    ) : (
                      data?.queues?.map((queue: any) => (
                        <tr key={queue.name} className="hover:bg-[#2C2C2A]/30 transition-colors">
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <Server className="h-3.5 w-3.5 text-text-muted" />
                              <span className="font-medium text-text-primary text-xs">{queue.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5">
                            <span className="text-text-primary text-xs mr-1">{queue.active}</span>
                            <span className="text-text-muted text-[10px]">/ {queue.waiting}</span>
                          </td>
                          <td className="py-2.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${queue.workersOnline > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {queue.workersOnline}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${parseFloat(queue.failureRate) > 5 ? 'bg-red-500/10 text-red-400' : 'text-text-muted'}`}>
                              {queue.failureRate}%
                            </span>
                            <span className="text-[10px] text-text-muted ml-1.5">({queue.failed} fail / {queue.completed} done)</span>
                          </td>
                          <td className="py-2.5">
                            {getStatusBadge(queue.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}