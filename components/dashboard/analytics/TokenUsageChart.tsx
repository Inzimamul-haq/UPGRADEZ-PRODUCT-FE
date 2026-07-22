import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

type Range = 'day' | 'week' | 'month' | 'year';

export const TokenUsageChart = () => {
  const [range, setRange] = useState<Range>('month');
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<{ label: string, tokensUsed: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/admin/dashboard/analytics/token-usage?range=${range}${range === 'year' ? `&year=${year}` : ''}`);
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range, year]);

  return (
    <div className="bg-[#242422] border border-[#2E2E2C] rounded-xl p-5 flex flex-col h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[14px] font-medium text-[#ECECEA]">Token Usage</h3>
        <div className="flex gap-2">
          {['day', 'week', 'month', 'year'].map(r => (
            <button 
              key={r}
              onClick={() => setRange(r as Range)}
              className={`text-[12px] px-2 py-1 rounded-md transition-colors ${range === r ? 'bg-[#3A3A38] text-[#ECECEA]' : 'text-[#8C8C8A] hover:bg-[#2C2C2A]'}`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
          {range === 'year' && (
             <select 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-[#2C2C2A] text-[12px] text-white border border-[#2E2E2C] rounded-md px-2 py-1 outline-none"
             >
                {[year-1, year, year+1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
             </select>
          )}
        </div>
      </div>
      <div className="flex-1">
        {loading ? (
           <div className="w-full h-full flex items-center justify-center text-[#8C8C8A] text-[12px]">Loading...</div>
        ) : data.length === 0 ? (
           <div className="w-full h-full flex items-center justify-center text-[#8C8C8A] text-[12px]">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: '#8C8C8A', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8C8C8A', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
              <Tooltip 
                cursor={{ stroke: '#2C2C2A', strokeWidth: 1 }}
                contentStyle={{ backgroundColor: '#242422', borderColor: '#2E2E2C', borderRadius: '8px', color: '#ECECEA', fontSize: '12px' }} 
              />
              <Line type="monotone" dataKey="tokensUsed" stroke="#ECECEA" strokeWidth={2} dot={{ r: 4, fill: '#ECECEA' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
