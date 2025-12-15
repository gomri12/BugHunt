import React, { useMemo, useState } from 'react';
import { Bug, BugSeverity, BugStatus } from '../types';
import { deleteBug } from '../services/db';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface DuplicateSuggestionsProps {
  bugs: Bug[] | null;
}

interface DuplicatePair {
  primary: Bug;
  duplicates: Bug[];
}

// Normalize text for similarity comparison
const normalizeText = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
};

// Simple Jaccard similarity between two strings based on tokens
const similarity = (a: string, b: string): number => {
  const tokensA = new Set(normalizeText(a));
  const tokensB = new Set(normalizeText(b));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  tokensA.forEach((t) => {
    if (tokensB.has(t)) intersection++;
  });

  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

export const DuplicateSuggestions: React.FC<DuplicateSuggestionsProps> = ({ bugs }) => {
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  const suggestions: DuplicatePair[] = useMemo(() => {
    if (!bugs || bugs.length < 2) return [];

    // Only consider open bugs for duplicate detection
    const openBugs = bugs.filter((b) => b.id && b.status !== BugStatus.RESOLVED);
    if (openBugs.length < 2) return [];

    // Build adjacency graph of \"similar\" bugs (by id)
    const adjacency = new Map<number, Set<number>>();

    const addEdge = (idA: number, idB: number) => {
      if (!adjacency.has(idA)) adjacency.set(idA, new Set());
      if (!adjacency.has(idB)) adjacency.set(idB, new Set());
      adjacency.get(idA)!.add(idB);
      adjacency.get(idB)!.add(idA);
    };

    // Pre-index by id for quick lookup
    const byId = new Map<number, Bug>();
    openBugs.forEach((b) => {
      if (b.id != null) byId.set(b.id, b);
    });

    const bugList = Array.from(byId.values());

    // Threshold for considering bugs similar
    const TITLE_THRESHOLD = 0.6;
    const COMBINED_THRESHOLD = 0.5; // title + description, a bit looser

    for (let i = 0; i < bugList.length; i++) {
      for (let j = i + 1; j < bugList.length; j++) {
        const a = bugList[i];
        const b = bugList[j];
        if (!a.id || !b.id) continue;

        // Only compare if severity matches to reduce noise
        if (a.severity !== b.severity) continue;

        const titleScore = similarity(a.title, b.title);
        const combinedScore = similarity(
          `${a.title} ${a.description}`,
          `${b.title} ${b.description}`
        );

        if (titleScore < TITLE_THRESHOLD && combinedScore < COMBINED_THRESHOLD) continue;

        addEdge(a.id, b.id);
      }
    }

    // Find connected components in the similarity graph
    const visited = new Set<number>();
    const groups: DuplicatePair[] = [];

    for (const id of adjacency.keys()) {
      if (visited.has(id)) continue;

      // BFS/DFS to collect a whole similarity cluster
      const queue: number[] = [id];
      const componentIds: number[] = [];
      visited.add(id);

      while (queue.length) {
        const current = queue.shift()!;
        componentIds.push(current);
        const neighbors = adjacency.get(current);
        if (!neighbors) continue;
        neighbors.forEach((n) => {
          if (!visited.has(n)) {
            visited.add(n);
            queue.push(n);
          }
        });
      }

      if (componentIds.length < 2) continue; // need at least 2 to be a duplicate cluster

      const componentBugs = componentIds
        .map((cid) => byId.get(cid))
        .filter((b): b is Bug => !!b);

      if (componentBugs.length < 2) continue;

      // Choose earliest created as primary; others are duplicates
      const sorted = componentBugs.slice().sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const primary = sorted[0];
      const duplicates = sorted.slice(1);

      if (primary.id) {
        groups.push({ primary, duplicates });
      }
    }

    // Only keep groups that actually have duplicates
    return groups.filter((g) => g.duplicates.length > 0);
  }, [bugs]);

  const handleDelete = async (bugId?: number) => {
    if (!bugId) return;
    if (!window.confirm('Delete this duplicate bug? This cannot be undone.')) return;

    setBusyIds((prev) => new Set(prev).add(bugId));
    try {
      await deleteBug(bugId);
    } catch (e) {
      console.error('Failed to delete bug', e);
      alert('Failed to delete bug');
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(bugId);
        return next;
      });
    }
  };

  const handleDeleteGroup = async (group: DuplicatePair) => {
    if (!window.confirm('Delete all duplicates in this group (keeping the primary bug)?')) return;

    const ids = group.duplicates.map((b) => b.id).filter((id): id is number => !!id);
    if (ids.length === 0) return;

    setBusyIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });

    try {
      for (const id of ids) {
        await deleteBug(id);
      }
    } catch (e) {
      console.error('Failed to delete duplicate group', e);
      alert('Failed to delete some duplicates');
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  if (!bugs || suggestions.length === 0) {
    return (
      <div className="bg-neutral-900 border border-dashed border-neutral-800 rounded-xl p-4 text-sm text-neutral-500 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-neutral-500" />
        No strong duplicate suggestions right now. As more bugs arrive, we’ll highlight similar ones here.
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-yellow-300 uppercase tracking-wide">
            Potential Duplicates
          </h3>
        </div>
        <div className="text-xs text-neutral-500 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          Suggestions update automatically as bugs change
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((group) => (
          <div
            key={group.primary.id}
            className="border border-neutral-800 rounded-lg p-3 bg-neutral-950/50"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="text-xs text-neutral-500 uppercase mb-1">Primary Bug</div>
                <div className="font-semibold text-white text-sm">{group.primary.title}</div>
                <div className="text-xs text-neutral-500">
                  {group.primary.severity} • Reported by {group.primary.reporterName}
                </div>
              </div>
              {group.duplicates.length > 0 && (
                <button
                  onClick={() => handleDeleteGroup(group)}
                  disabled={[...busyIds].some((id) => group.duplicates.some((b) => b.id === id))}
                  className={clsx(
                    'px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 border transition-colors',
                    'border-red-500/40 text-red-400 hover:bg-red-600/20 disabled:opacity-50'
                  )}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Duplicates
                </button>
              )}
            </div>

            <div className="text-xs text-neutral-500 mb-1">Looks similar to:</div>
            <div className="space-y-2">
              {group.duplicates.map((dup) => (
                <div
                  key={dup.id}
                  className="flex items-center justify-between gap-3 px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-neutral-200 truncate">{dup.title}</div>
                    <div className="text-xs text-neutral-500">
                      {dup.severity} • Reported by {dup.reporterName}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(dup.id)}
                    disabled={busyIds.has(dup.id!)}
                    className="px-2 py-1 rounded-md text-xs font-semibold text-red-400 hover:bg-red-600/20 border border-red-500/40 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


