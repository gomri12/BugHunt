import React, { useState, useEffect } from 'react';
import { useBugs, GLOBAL_SESSION_ID } from '../services/db';
import { BugSeverity, BugStatus } from '../types';
import { AlertTriangle, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import clsx from 'clsx';

export const BossCounter: React.FC = () => {
  const { bugs } = useBugs(GLOBAL_SESSION_ID);
  const [criticalCount, setCriticalCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isBossMode, setIsBossMode] = useState(false);

  useEffect(() => {
    if (!bugs) return;

    const critical = bugs.filter(
      (b) => b.severity === BugSeverity.CRITICAL && b.status !== BugStatus.RESOLVED
    );
    const newCount = critical.length;
    const oldCount = criticalCount;

    if (newCount !== oldCount) {
      // Trigger shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);

      // Check for boss mode (3 or fewer critical bugs)
      setIsBossMode(newCount <= 3 && newCount > 0);

      // Celebrate if all critical bugs are fixed
      if (newCount === 0 && oldCount > 0) {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#ff00ff', '#00ff9d', '#00ccff', '#ffffff', '#764abc'],
          startVelocity: 50,
          gravity: 0.8,
          ticks: 300,
        });
      }
    }

    setCriticalCount(newCount);
  }, [bugs, criticalCount]);

  const highCount = bugs?.filter(
    (b) => b.severity === BugSeverity.HIGH && b.status !== BugStatus.RESOLVED
  ).length ?? 0;

  const totalOpen = bugs?.filter((b) => b.status !== BugStatus.RESOLVED).length ?? 0;

  return (
    <div
      className={clsx(
        'bg-gradient-to-br rounded-xl p-6 border-2 transition-all duration-500',
        isBossMode
          ? 'from-red-900/50 to-purple-900/50 border-red-500/50 shadow-red-500/20 shadow-2xl'
          : 'from-neutral-900 to-neutral-800 border-neutral-700'
      )}
    >
      {isBossMode && (
        <div className="text-center mb-4 animate-pulse">
          <div className="text-2xl font-black text-red-400 mb-2">⚔️ BOSS FIGHT MODE ⚔️</div>
          <div className="text-sm text-red-300">Final {criticalCount} Critical Bug{criticalCount !== 1 ? 's' : ''} Remaining!</div>
        </div>
      )}

      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <div
            className={clsx(
              'text-6xl font-black mb-2 transition-all',
              isShaking && 'animate-bounce',
              criticalCount === 0
                ? 'text-green-400'
                : criticalCount <= 3
                ? 'text-red-400'
                : 'text-orange-400'
            )}
          >
            {criticalCount}
          </div>
          <div className="text-sm font-bold text-neutral-400 uppercase flex items-center justify-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Critical Left
          </div>
        </div>

        <div className="h-16 w-px bg-neutral-700" />

        <div className="text-center">
          <div className="text-4xl font-black mb-2 text-orange-400">{highCount}</div>
          <div className="text-sm font-bold text-neutral-400 uppercase">High Left</div>
        </div>

        <div className="h-16 w-px bg-neutral-700" />

        <div className="text-center">
          <div className="text-4xl font-black mb-2 text-blue-400">{totalOpen}</div>
          <div className="text-sm font-bold text-neutral-400 uppercase">Total Open</div>
        </div>
      </div>

      {criticalCount === 0 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-green-400 font-bold">
            <Trophy className="w-5 h-5" />
            All Critical Bugs Eliminated!
          </div>
        </div>
      )}
    </div>
  );
};

