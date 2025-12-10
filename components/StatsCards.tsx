import React from 'react';
import { Bug, CheckCircle, CircleDashed } from 'lucide-react';

interface StatsCardsProps {
  total: number;
  open: number;
  resolved: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ total, open, resolved }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Bug className="w-24 h-24 text-blue-500" />
        </div>
        <div className="relative z-10">
          <p className="text-neutral-400 font-medium mb-1">Total Bugs</p>
          <h3 className="text-5xl font-mono font-bold text-white">{total}</h3>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <CircleDashed className="w-24 h-24 text-yellow-500" />
        </div>
        <div className="relative z-10">
          <p className="text-neutral-400 font-medium mb-1">Open / In Progress</p>
          <h3 className="text-5xl font-mono font-bold text-yellow-400">{open}</h3>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <CheckCircle className="w-24 h-24 text-neon-green" />
        </div>
        <div className="relative z-10">
          <p className="text-neutral-400 font-medium mb-1">Resolved</p>
          <h3 className="text-5xl font-mono font-bold text-neon-green">{resolved}</h3>
        </div>
      </div>
    </div>
  );
};