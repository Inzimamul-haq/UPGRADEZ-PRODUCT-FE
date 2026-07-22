import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

export const QuotaStatusDonut = () => {
  const [data, setData] = useState<{ used: number, limit: number, remaining: number, percentUsed: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/admin/dashboard/analytics/quota-status');
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = data ? [
    { name: 'Used', value: data.used, color: '#ECECEA' },
    { name: 'Remaining', value: data.remaining, color: '#2C2C2A' }
  ] : [];

  return (
    <div className="bg-[#242422] border border-[#2E2E2C] rounded-xl p-5 flex flex-col h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[14px] font-medium text-[#ECECEA]">Quota Status</h3>
      </div>
      <div className="flex-1 relative">
        {loading ? (
           <div className="w-full h-full flex items-center justify-center text-[#8C8C8A] text-[12px]">Loading...</div>
        ) : !data ? (
           <div className="w-full h-full flex items-center justify-center text-[#8C8C8A] text-[12px]">No data available</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => new Intl.NumberFormat('en-US').format(value)}
                  contentStyle={{ backgroundColor: '#242422', borderColor: '#2E2E2C', borderRadius: '8px', color: '#ECECEA', fontSize: '12px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none mt-4">
                <span className="text-[24px] font-semibold text-[#ECECEA]">{data.percentUsed}%</span>
                <span className="text-[10px] text-[#8C8C8A]">Used</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
