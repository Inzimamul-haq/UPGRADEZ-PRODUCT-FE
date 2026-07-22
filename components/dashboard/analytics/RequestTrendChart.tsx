import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

export const RequestTrendChart = () => {
  const [data, setData] = useState<{ month: string, requestCount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/admin/dashboard/analytics/request-trend');
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-[#242422] border border-[#2E2E2C] rounded-xl p-5 flex flex-col h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[14px] font-medium text-[#ECECEA]">AI Requests Trend</h3>
      </div>
      <div className="flex-1">
        {loading ? (
           <div className="w-full h-full flex items-center justify-center text-[#8C8C8A] text-[12px]">Loading...</div>
        ) : data.length === 0 ? (
           <div className="w-full h-full flex items-center justify-center text-[#8C8C8A] text-[12px]">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#8C8C8A', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8C8C8A', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#2C2C2A' }}
                contentStyle={{ backgroundColor: '#242422', borderColor: '#2E2E2C', borderRadius: '8px', color: '#ECECEA', fontSize: '12px' }} 
              />
              <Bar dataKey="requestCount" fill="#ECECEA" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
