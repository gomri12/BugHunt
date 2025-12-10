import React, { useEffect, useState, useMemo } from 'react';
import { useBugs, onUpdate, GLOBAL_SESSION_ID } from '../services/db';
import { StatsCards } from '../components/StatsCards';
import { BugList } from '../components/BugList';
import { LeaderboardChart } from '../components/Charts';
import { BugStatus, Bug } from '../types';
import confetti from 'canvas-confetti';
import { playSuccessSound, playMilestoneSound, playGongSound } from '../services/sound';
import { Trophy, Volume2, VolumeX, Download } from 'lucide-react';
import { exportBugsToCSV } from '../services/export';

export const Dashboard: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage to see if the current viewer is logged in (e.g. they might be the admin viewing the dashboard)
    const stored = localStorage.getItem('bughunt_username');
    if (stored) setUsername(stored);
  }, []);
  
  const { bugs, error: bugsError } = useBugs(GLOBAL_SESSION_ID);
  const [previousBugs, setPreviousBugs] = useState<Bug[] | null>(null);

  // Detect bug changes and trigger celebrations
  useEffect(() => {
    if (!bugs || bugs.length === 0) {
      setPreviousBugs(bugs);
      return;
    }

    if (previousBugs === null) {
      // Initial load, just store current bugs
      setPreviousBugs(bugs);
      return;
    }

    // Find new bugs (bugs that weren't in previousBugs)
    const previousBugIds = new Set(previousBugs.map(b => b.id).filter((id): id is number => id !== undefined));
    const newBugs = bugs.filter(b => b.id !== undefined && !previousBugIds.has(b.id));
    
    // Find newly resolved bugs (bugs that changed from non-resolved to resolved)
    const previousBugMap = new Map(previousBugs.map(b => [b.id, b]));
    const newlyResolvedBugs = bugs.filter(b => {
      if (!b.id) return false;
      const prevBug = previousBugMap.get(b.id);
      return b.status === BugStatus.RESOLVED && 
             prevBug && 
             prevBug.status !== BugStatus.RESOLVED;
    });

    // Trigger celebrations for new bugs
    if (newBugs.length > 0) {
      console.log('New bugs detected on Dashboard:', newBugs.length);
      const latestNewBug = newBugs[0];
      if (soundEnabled) {
        playGongSound().catch(err => console.error('Gong sound error:', err));
      }
      if (typeof confetti !== 'undefined') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff00ff', '#00ff9d', '#00ccff', '#ffffff', '#764abc'],
          startVelocity: 30,
          gravity: 0.8,
          ticks: 200,
          shapes: ['circle', 'square'],
        });
      }
    }

    // Trigger celebrations for resolved bugs
    if (newlyResolvedBugs.length > 0) {
      console.log('Resolved bugs detected on Dashboard:', newlyResolvedBugs.length);
      const latestResolved = newlyResolvedBugs[0];
      if (soundEnabled) {
        playGongSound().catch(err => console.error('Gong sound error:', err));
      }
      if (typeof confetti !== 'undefined') {
        // Bigger, more prominent fireworks for resolved bugs
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.7 },
          colors: ['#00ff9d', '#ffffff', '#00ccff'],
          startVelocity: 40,
          gravity: 0.9,
          ticks: 300,
          shapes: ['circle', 'square'],
        });
        // Second burst for extra celebration
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#00ff9d', '#ffffff'],
            startVelocity: 30,
            gravity: 0.8,
            ticks: 200,
          });
        }, 200);
      }
    }

    // Update previous bugs
    setPreviousBugs(bugs);
  }, [bugs, previousBugs, soundEnabled]);

  // Stats calculation
  const stats = useMemo(() => {
    if (!bugs) return { total: 0, open: 0, resolved: 0 };
    return {
      total: bugs.length,
      open: bugs.filter(b => b.status !== BugStatus.RESOLVED).length,
      resolved: bugs.filter(b => b.status === BugStatus.RESOLVED).length
    };
  }, [bugs]);

  const leaderboards = useMemo(() => {
    if (!bugs) return { reporters: [], solvers: [] };
    
    const reporters: Record<string, number> = {};
    const solvers: Record<string, number> = {};

    bugs.forEach(b => {
      reporters[b.reporterName] = (reporters[b.reporterName] || 0) + 1;
      if (b.status === BugStatus.RESOLVED && b.solverName) {
        solvers[b.solverName] = (solvers[b.solverName] || 0) + 1;
      }
    });

    const sortDesc = (a: any, b: any) => b.count - a.count;

    return {
      reporters: Object.entries(reporters).map(([name, count]) => ({ name, count })).sort(sortDesc).slice(0, 10),
      solvers: Object.entries(solvers).map(([name, count]) => ({ name, count })).sort(sortDesc).slice(0, 10)
    };
  }, [bugs]);

  // Effect to handle real-time events (Sound & Animation)
  useEffect(() => {
    const unsub = onUpdate((data) => {
      if (data.type === 'BUG_NEW') {
        if (soundEnabled) {
          playGongSound().catch(err => console.error('Gong sound error:', err));
        }
        if (typeof confetti !== 'undefined') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff00ff', '#00ff9d', '#00ccff', '#ffffff', '#764abc'],
            startVelocity: 30,
            gravity: 0.8,
            ticks: 200,
            shapes: ['circle', 'square'],
          });
        }
      } else if (data.type === 'BUG_RESOLVED') {
        // Play gong sound and show fireworks for resolved bugs
        if (soundEnabled) {
          playGongSound().catch(err => console.error('Gong sound error:', err));
        }
        if (typeof confetti !== 'undefined') {
          // Bigger, more prominent fireworks for resolved bugs
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.7 },
            colors: ['#00ff9d', '#ffffff', '#00ccff'],
            startVelocity: 40,
            gravity: 0.9,
            ticks: 300,
            shapes: ['circle', 'square'],
          });
          // Second burst for extra celebration
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#00ff9d', '#ffffff'],
              startVelocity: 30,
              gravity: 0.8,
              ticks: 200,
            });
          }, 200);
        }
      } else if (data.type === 'SESSION_UPDATE' && data.payload?.type === 'MILESTONE') {
        if (soundEnabled) playMilestoneSound();
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#ff00ff', '#00ff9d', '#00ccff']
        });
      }
    });
    return unsub;
  }, [soundEnabled]);

  const handleExport = () => {
    if (bugs) {
        exportBugsToCSV(bugs, 'Global Session');
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight mb-2">Live Dashboard</h1>
           <p className="text-neutral-400">Real-time bug tracking. Keep the momentum going!</p>
        </div>
        <div className="flex items-center gap-2">
            {username === 'Omri Glam' && (
                <button 
                    onClick={handleExport}
                    className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                    title="Export CSV"
                >
                    <Download className="w-5 h-5" />
                </button>
            )}
            <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
        </div>
      </div>

      <StatsCards {...stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-fast"></span>
                    Live Feed
                </h2>
                <div className="max-h-[600px] overflow-y-auto pr-2">
                     <BugList readonly />
                </div>
            </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-neon-pink mb-2">
             <Trophy className="w-5 h-5" />
             <h2 className="text-lg font-bold uppercase tracking-wider">Top Hunters</h2>
          </div>
          
          <LeaderboardChart 
            data={leaderboards.solvers} 
            title="Top Solvers" 
            color="#00ff9d" 
          />
          
          <LeaderboardChart 
            data={leaderboards.reporters} 
            title="Most Reports" 
            color="#d946ef" 
          />
        </div>
      </div>
    </div>
  );
};