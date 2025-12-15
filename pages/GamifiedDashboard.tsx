import React, { useState } from 'react';
import { LiveFeed } from '../components/LiveFeed';
import { BossCounter } from '../components/BossCounter';
import { GamifiedLeaderboard } from '../components/GamifiedLeaderboard';
import { FeatureHeatmap } from '../components/FeatureHeatmap';
import { TeamProgress } from '../components/TeamProgress';
import { Achievements } from '../components/Achievements';
import { Volume2, VolumeX } from 'lucide-react';

export const GamifiedDashboard: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white via-purple-200 to-neon-pink bg-clip-text text-transparent">
            🎮 Gamified Dashboard
          </h1>
          <p className="text-neutral-400">
            Real-time bug hunting with achievements, streaks, and leaderboards
          </p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="px-4 py-2 border border-neutral-700 hover:bg-neutral-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-neutral-400 hover:text-white"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {soundEnabled ? 'Sound On' : 'Sound Off'}
        </button>
      </div>

      {/* Boss Counter - Always visible at top */}
      <div className="mb-6">
        <BossCounter />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Feed */}
          <LiveFeed soundEnabled={soundEnabled} />

          {/* Team Progress */}
          <TeamProgress />

          {/* Feature Heatmap */}
          <FeatureHeatmap />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <GamifiedLeaderboard />

          {/* Achievements */}
          <Achievements />
        </div>
      </div>

      {/* Mini Challenges Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Mini Challenges
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
            <div className="font-bold text-white mb-1">Fix 1 Critical Bug</div>
            <div className="text-sm text-neutral-400">Double points for 15 minutes</div>
            <div className="mt-2 text-xs text-neon-pink">Active</div>
          </div>
          <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
            <div className="font-bold text-white mb-1">Find 2 Duplicates</div>
            <div className="text-sm text-neutral-400">Help clean up the bug list</div>
            <div className="mt-2 text-xs text-neutral-500">In Progress</div>
          </div>
          <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
            <div className="font-bold text-white mb-1">Fix 1 Bug in Feature X</div>
            <div className="text-sm text-neutral-400">Target specific area</div>
            <div className="mt-2 text-xs text-neutral-500">Available</div>
          </div>
        </div>
      </div>
    </div>
  );
};

