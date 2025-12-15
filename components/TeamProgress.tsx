import React from 'react';
import { useBugs, GLOBAL_SESSION_ID } from '../services/db';
import { BugSeverity, BugStatus } from '../types';
import { Target, TrendingDown, TrendingUp } from 'lucide-react';

export const TeamProgress: React.FC = () => {
  const { bugs } = useBugs(GLOBAL_SESSION_ID);

  if (!bugs) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      </div>
    );
  }

  const criticalLeft = bugs.filter(
    (b) => b.severity === BugSeverity.CRITICAL && b.status !== BugStatus.RESOLVED
  ).length;

  const highLeft = bugs.filter(
    (b) => b.severity === BugSeverity.HIGH && b.status !== BugStatus.RESOLVED
  ).length;

  const totalOpen = bugs.filter((b) => b.status !== BugStatus.RESOLVED).length;
  const totalResolved = bugs.filter((b) => b.status === BugStatus.RESOLVED).length;

  // Today's fixes (bugs resolved today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fixedToday = bugs.filter(
    (b) => b.status === BugStatus.RESOLVED && new Date(b.updatedAt) >= today
  ).length;

  // Goal: All critical bugs fixed
  const goal = 0; // Critical bugs = 0
  const progress = criticalLeft > 0 ? Math.max(0, 100 - (criticalLeft / Math.max(1, criticalLeft + totalResolved)) * 100) : 100;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-neon-pink" />
        <h2 className="text-xl font-bold">Team Progress</h2>
      </div>

      {/* Goal Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-neutral-400">Goal: All Critical Fixed</div>
          <div className="text-sm font-bold text-neon-pink">{Math.round(progress)}%</div>
        </div>
        <div className="h-4 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-neon-pink to-neon-green transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
          <div className="text-xs text-neutral-400 mb-1">Critical Left</div>
          <div className="text-2xl font-black text-red-400">{criticalLeft}</div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
          <div className="text-xs text-neutral-400 mb-1">High Left</div>
          <div className="text-2xl font-black text-orange-400">{highLeft}</div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
          <div className="text-xs text-neutral-400 mb-1">Total Open</div>
          <div className="text-2xl font-black text-blue-400">{totalOpen}</div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
          <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Fixed Today
          </div>
          <div className="text-2xl font-black text-green-400">{fixedToday}</div>
        </div>
      </div>

      {/* Resolution Rate */}
      <div className="mt-6 pt-6 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-400">Resolution Rate</div>
          <div className="text-lg font-bold text-neon-green">
            {bugs.length > 0
              ? Math.round((totalResolved / bugs.length) * 100)
              : 0}
            %
          </div>
        </div>
        <div className="mt-2 h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-neon-green transition-all"
            style={{
              width: `${bugs.length > 0 ? (totalResolved / bugs.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

