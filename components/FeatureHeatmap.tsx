import React, { useState, useEffect } from 'react';
import { FeatureHeatmapEntry, fetchFeatureHeatmap } from '../services/events';
import { Flame, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

export const FeatureHeatmap: React.FC = () => {
  const [heatmap, setHeatmap] = useState<FeatureHeatmapEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeatmap();
    const interval = setInterval(loadHeatmap, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadHeatmap = async () => {
    try {
      setLoading(true);
      const data = await fetchFeatureHeatmap();
      setHeatmap(data);
    } catch (error) {
      console.error('Failed to load heatmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHeatLevel = (entry: FeatureHeatmapEntry) => {
    const total = entry.opened_count;
    if (total >= 10) return 'high';
    if (total >= 5) return 'medium';
    if (total >= 2) return 'low';
    return 'none';
  };

  const getHeatColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'medium':
        return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
      case 'low':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      default:
        return 'bg-neutral-800 border-neutral-700 text-neutral-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (heatmap.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="text-center py-8 text-neutral-500">No feature data yet</div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-neon-pink" />
        <h2 className="text-xl font-bold">Feature Heatmap</h2>
      </div>

      <div className="space-y-3">
        {heatmap.map((entry) => {
          const heatLevel = getHeatLevel(entry);
          const fixedRate = entry.opened_count > 0 
            ? Math.round((entry.fixed_count / entry.opened_count) * 100) 
            : 0;

          return (
            <div
              key={entry.feature}
              className={clsx(
                'p-4 rounded-lg border transition-all',
                getHeatColor(heatLevel)
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold">{entry.feature}</div>
                <div className="text-sm opacity-70">
                  {fixedRate}% fixed
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <div className="text-neutral-400">Opened</div>
                  <div className="font-bold">{entry.opened_count}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Fixed</div>
                  <div className="font-bold text-green-400">{entry.fixed_count}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Critical</div>
                  <div className="font-bold text-red-400">{entry.critical_count}</div>
                </div>
                <div>
                  <div className="text-neutral-400">High</div>
                  <div className="font-bold text-orange-400">{entry.high_count}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${fixedRate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

