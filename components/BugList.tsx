import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, notifyUpdate, GLOBAL_SESSION_ID } from '../services/db';
import { Bug, BugSeverity, BugStatus } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Check, Clock, User, ArrowRight, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface BugListProps {
  readonly?: boolean;
  username?: string;
}

export const BugList: React.FC<BugListProps> = ({ readonly = false, username }) => {
  const bugs = useLiveQuery(() => 
    db.bugs.where('sessionId').equals(GLOBAL_SESSION_ID).reverse().sortBy('createdAt')
  );

  if (!bugs) return <div className="text-center py-8 text-neutral-500">Loading bugs...</div>;
  if (bugs.length === 0) return <div className="text-center py-12 text-neutral-500 border border-dashed border-neutral-800 rounded-xl">No bugs reported yet. Start hunting!</div>;

  const handleStatusChange = async (bug: Bug, newStatus: BugStatus) => {
    if (!bug.id) return;
    
    const updates: Partial<Bug> = { 
      status: newStatus, 
      updatedAt: new Date() 
    };

    await db.bugs.update(bug.id, updates);
    notifyUpdate('BUG_UPDATE', { id: bug.id, status: newStatus });
  };

  const handleResolve = async (bug: Bug) => {
    if (!bug.id || !username) return;

    await db.bugs.update(bug.id, {
        status: BugStatus.RESOLVED,
        solverName: username,
        updatedAt: new Date()
    });
    
    // Check if this solver hit a milestone
    const solvedCount = await db.bugs
        .where('sessionId').equals(GLOBAL_SESSION_ID)
        .filter(b => b.solverName === username && b.status === BugStatus.RESOLVED)
        .count();

    if (solvedCount % 5 === 0) {
        notifyUpdate('SESSION_UPDATE', { type: 'MILESTONE', solver: username, count: solvedCount });
    } else {
        notifyUpdate('BUG_RESOLVED', { title: bug.title, solver: username });
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

  return (
    <div className="space-y-4">
      {bugs.map(bug => (
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
                {bug.solverName && (
                  <div className="flex items-center gap-1 text-neon-green">
                    <Check className="w-4 h-4" />
                    Solved by <span className="font-bold">{bug.solverName}</span>
                  </div>
                )}
              </div>
            </div>

            {!readonly && bug.status !== BugStatus.RESOLVED && (
              <div className="flex flex-col gap-2 min-w-[200px] border-l border-neutral-800 pl-4">
                <p className="text-xs font-bold text-neutral-500 uppercase">Actions</p>
                
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
                        title={username ? `Resolve as ${username}` : "Log in to resolve"}
                    >
                        <Check className="w-4 h-4" /> Resolve Bug
                    </button>
                </div>
              </div>
            )}
            
            {!readonly && bug.status === BugStatus.RESOLVED && (
                 <div className="flex flex-col justify-center border-l border-neutral-800 pl-4">
                    <button 
                        onClick={() => handleStatusChange(bug, BugStatus.IN_PROGRESS)}
                        className="text-neutral-500 hover:text-white text-sm flex items-center gap-1"
                    >
                        <XCircle className="w-4 h-4" /> Re-open
                    </button>
                 </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};