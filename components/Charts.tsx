import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LeaderboardEntry } from '../types';

interface LeaderboardChartProps {
  data: LeaderboardEntry[];
  title: string;
  color: string;
}

export const LeaderboardChart: React.FC<LeaderboardChartProps> = ({ data, title, color }) => {
  if (data.length === 0) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis 
                type="category" 
                dataKey="name" 
                width={80} 
                tick={{ fill: '#a3a3a3', fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
            />
            <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', color: '#fff' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8 + (index * 0.05)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
