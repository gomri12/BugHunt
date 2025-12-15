import React, { useState } from 'react';
import { useBugs, updateBug, GLOBAL_SESSION_ID, deleteBug } from '../services/db';
import { Bug, BugSeverity, BugStatus } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Check, Clock, User, ArrowRight, XCircle, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { BugSearch } from './BugSearch';
import { playGreatSuccessSound } from '../services/sound';

interface BugListProps {
  readonly?: boolean;
  username?: string;
}

export const BugList: React.FC<BugListProps> = ({ readonly = false, username }) => {
  const { bugs, error } = useBugs(GLOBAL_SESSION_ID);
  const [filteredBugs, setFilteredBugs] = useState<Bug[]>([]);

  // Initialize filtered bugs when bugs are first loaded
  React.useEffect(() => {
    if (bugs && bugs.length > 0 && filteredBugs.length === 0) {
      setFilteredBugs(bugs);
    }
  }, [bugs]);

  if (error) {
    return (
      <div className="text-center py-12 border border-red-500/50 bg-red-500/10 rounded-xl p-6">
        <p className="text-red-400 font-bold mb-2">Database Error</p>
        <p className="text-red-300 text-sm">{error}</p>
        <p className="text-red-300/70 text-xs mt-4">Make sure Supabase tables are set up. Check the console for details.</p>
      </div>
    );
  }
  if (!bugs) return <div className="text-center py-8 text-neutral-500">Loading bugs...</div>;
  if (bugs.length === 0) return <div className="text-center py-12 text-neutral-500 border border-dashed border-neutral-800 rounded-xl">No bugs reported yet. Start hunting!</div>;

  const handleStatusChange = async (bug: Bug, newStatus: BugStatus) => {
    if (!bug.id) return;
    // When reopening a resolved bug, clear the solver name
    const updates: Partial<Bug> = { status: newStatus };
    if (bug.status === BugStatus.RESOLVED && newStatus !== BugStatus.RESOLVED) {
      updates.solverName = undefined; // Clear solver when reopening
    }
    await updateBug(bug.id, updates);
  };

  const handleResolve = async (bug: Bug) => {
    if (!bug.id || !username) return;

    await updateBug(bug.id, {
      status: BugStatus.RESOLVED,
      solverName: username,
    });

    // Play \"Great Success\" sound when a bug is resolved
    try {
      await playGreatSuccessSound();
    } catch (e) {
      console.error('Failed to play Great Success sound', e);
    }
  };

  const handleDelete = async (bug: Bug) => {
    if (!bug.id) return;
    if (username !== 'Omri Glam') return; // extra safety – only admin

    const confirmed = window.confirm(
      `Delete bug \"${bug.title}\"?\nThis cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteBug(bug.id);
    } catch (e) {
      console.error('Failed to delete bug', e);
      alert('Failed to delete bug');
    }
  };

  const severityColor = (sev: BugSeverity) => {
    switch (sev) {
      case BugSeverity.CRITICAL: return 'text-red-500 bg-red-500/10 border-red-500/20';
      case BugSeverity.HIGH: return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case BugSeverity.MEDIUM: return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case BugSeverity.LOW: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  // Use filtered bugs for display (BugSearch will initialize it with all bugs)
  // Fallback to bugs if filteredBugs hasn't been initialized yet
  const displayBugs = filteredBugs.length > 0 || (filteredBugs.length === 0 && bugs.length > 0) ? filteredBugs : bugs;
  const hasActiveFilters = filteredBugs.length !== bugs.length && filteredBugs.length > 0;

  return (
    <div className="space-y-4">
      {bugs && bugs.length > 0 && (
        <BugSearch bugs={bugs} onFilteredBugsChange={setFilteredBugs} />
      )}
      
      {displayBugs.length === 0 && bugs.length > 0 ? (
        <div className="text-center py-12 text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
          No bugs match your search criteria.
        </div>
      ) : displayBugs.length > 0 ? (
        <>
          {hasActiveFilters && (
            <div className="text-sm text-neutral-500 mb-4">
              Showing {displayBugs.length} of {bugs.length} bug{bugs.length !== 1 ? 's' : ''}
            </div>
          )}
          {displayBugs.map(bug => (
        <div 
            key={bug.id} 
            className={clsx(
                "bg-neutral-900 border rounded-lg p-4 transition-all",
                bug.status === BugStatus.RESOLVED ? "border-green-900/50 bg-green-950/10" : "border-neutral-800"
            )}
        >
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={clsx("px-2 py-0.5 text-xs font-bold rounded uppercase border", severityColor(bug.severity))}>
                  {bug.severity}
                </span>
                <span className="text-neutral-500 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(bug.createdAt)} ago
                </span>
                {bug.status === BugStatus.RESOLVED && (
                    <span className="text-neon-green text-xs font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> SOLVED
                    </span>
                )}
              </div>
              <h3 className={clsx("text-lg font-semibold mb-1", bug.status === BugStatus.RESOLVED && "line-through text-neutral-500")}>
                {bug.title}
              </h3>
              <p className="text-neutral-400 text-sm mb-3">{bug.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Reported by <span className="text-white font-medium">{bug.reporterName}</span>
                </div>
                {bug.status === BugStatus.RESOLVED && bug.solverName && (
                  <div className="flex items-center gap-1 text-neon-green">
                    <Check className="w-4 h-4" />
                    Solved by <span className="font-bold">{bug.solverName}</span>
                  </div>
                )}
              </div>
            </div>

            {!readonly && (
              <div className="flex flex-col gap-2 min-w-[220px] border-l border-neutral-800 pl-4">
                <p className="text-xs font-bold text-neutral-500 uppercase">Actions</p>

                {bug.status !== BugStatus.RESOLVED && (
                  <>
                    {bug.status === BugStatus.NEW && (
                      <button
                        onClick={() => handleStatusChange(bug, BugStatus.IN_PROGRESS)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-neutral-800 text-sm flex items-center gap-2"
                      >
                        <ArrowRight className="w-4 h-4 text-yellow-500" /> Mark In Progress
                      </button>
                    )}

                    <div className="mt-2 pt-2 border-t border-neutral-800">
                      <button
                        onClick={() => handleResolve(bug)}
                        className="w-full bg-neon-green/20 hover:bg-neon-green/30 text-neon-green border border-neon-green/50 px-3 py-2 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        title={username ? `Resolve as ${username}` : 'Log in to resolve'}
                      >
                        <Check className="w-4 h-4" /> Resolve Bug
                      </button>
                    </div>
                  </>
                )}

                {bug.status === BugStatus.RESOLVED && (
                  <button
                    onClick={() => handleStatusChange(bug, BugStatus.IN_PROGRESS)}
                    className="text-neutral-500 hover:text-white text-sm flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" /> Re-open
                  </button>
                )}

                {username === 'Omri Glam' && (
                  <button
                    onClick={() => handleDelete(bug)}
                    className="mt-2 text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete (Admin)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
        </>
      ) : null}
    </div>
  );
};