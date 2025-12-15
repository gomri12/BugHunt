import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, fetchLeaderboard } from '../services/events';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

type TimeFilter = 'today' | 'this_hunt' | 'all_time';

export const GamifiedLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all_time');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
    // Refresh every 10 seconds
    const interval = setInterval(loadLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [timeFilter]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await fetchLeaderboard(timeFilter);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return <span className="text-neutral-500 font-bold w-6 text-center">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 2:
        return 'bg-gray-500/10 border-gray-500/30';
      case 3:
        return 'bg-orange-500/10 border-orange-500/30';
      default:
        return 'bg-neutral-800/50 border-neutral-700';
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-neon-pink" />
          <h2 className="text-xl font-bold">Leaderboard</h2>
        </div>
        <div className="flex gap-2">
          {(['today', 'this_hunt', 'all_time'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={clsx(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                timeFilter === filter
                  ? 'bg-neon-pink text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              )}
            >
              {filter === 'today' ? 'Today' : filter === 'this_hunt' ? 'This Hunt' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">No scores yet. Start hunting!</div>
      ) : (
        <div className="space-y-2">
          {leaderboard.slice(0, 10).map((entry, index) => {
            const rank = index + 1;
            return (
              <div
                key={entry.person}
                className={clsx(
                  'flex items-center gap-4 p-4 rounded-lg border transition-all',
                  getRankColor(rank)
                )}
              >
                <div className="flex-shrink-0">{getRankIcon(rank)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{entry.person}</div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {entry.events_count} event{entry.events_count !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {entry.score_negative < 0 && (
                    <div className="text-red-400 text-sm font-bold">
                      {entry.score_negative}
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-lg font-black text-neon-pink">
                      {Math.round(entry.score_total)}
                    </div>
                    <div className="text-xs text-neutral-500">points</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

