import React, { useState, useEffect } from 'react';
import { StreakEntry, fetchStreaks } from '../services/events';
import { Trophy, Flame, Shield, Target } from 'lucide-react';
import clsx from 'clsx';

export const Achievements: React.FC = () => {
  const [streaks, setStreaks] = useState<StreakEntry[]>([]);

  useEffect(() => {
    loadStreaks();
    const interval = setInterval(loadStreaks, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStreaks = async () => {
    try {
      const data = await fetchStreaks();
      setStreaks(data);
    } catch (error) {
      console.error('Failed to load streaks:', error);
    }
  };

  // Mock achievements for now - in real implementation, these would come from events
  const achievements = [
    { id: 'first_fix', name: 'First Fix', icon: Trophy, color: 'text-yellow-400' },
    { id: 'critical_slayer', name: 'Critical Slayer', icon: Flame, color: 'text-red-400' },
    { id: 'no_reopen', name: 'No Reopen Streak', icon: Shield, color: 'text-green-400' },
    { id: 'cleanup_crew', name: 'Cleanup Crew', icon: Target, color: 'text-blue-400' },
  ];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-neon-pink" />
        <h2 className="text-xl font-bold">Achievements & Streaks</h2>
      </div>

      {/* Streaks */}
      {streaks.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-bold text-neutral-400 mb-3 uppercase">Active Streaks</div>
          <div className="space-y-2">
            {streaks.slice(0, 5).map((streak) => (
              <div
                key={streak.solver}
                className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg border border-neutral-700"
              >
                <div>
                  <div className="font-bold text-white">{streak.solver}</div>
                  <div className="text-xs text-neutral-400">
                    {streak.current_streak} fixes without reopen
                  </div>
                </div>
                <div className="text-2xl font-black text-neon-pink">{streak.current_streak}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div>
        <div className="text-sm font-bold text-neutral-400 mb-3 uppercase">Achievements</div>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700 text-center"
              >
                <Icon className={clsx('w-8 h-8 mx-auto mb-2', achievement.color)} />
                <div className="text-sm font-bold text-white">{achievement.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

