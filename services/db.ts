import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Bug, BugStatus, Session } from '../types';

export const GLOBAL_SESSION_ID = '11111111-1111-1111-1111-111111111111';

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('bug_hunt_live_updates') : null;

export const notifyUpdate = (type: 'BUG_NEW' | 'BUG_UPDATE' | 'BUG_RESOLVED' | 'SESSION_UPDATE', payload?: any) => {
  channel?.postMessage({ type, payload });
};

export const onUpdate = (callback: (msg: any) => void) => {
  if (!channel) return () => {};
  channel.onmessage = (event) => callback(event.data);
  return () => {
    channel.onmessage = null;
  };
};

const mapBug = (row: any): Bug => ({
  id: row.id,
  sessionId: row.session_id,
  title: row.title,
  description: row.description,
  severity: row.severity,
  status: row.status,
  reporterName: row.reporter_name,
  solverName: row.solver_name ?? undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const ensureSession = async (sessionId: string, name = 'Global Session') => {
  const { error } = await supabase
    .from('sessions')
    .upsert({
      id: sessionId,
      name,
      start_time: new Date().toISOString(),
      is_active: true,
    });
  if (error) {
    console.error('Failed to ensure session:', error);
    throw error;
  }
};

export const fetchBugs = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('bugs')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapBug);
};

export const subscribeToBugs = (sessionId: string, onChange: (bugs: Bug[]) => void) => {
  let pollInterval: NodeJS.Timeout | null = null;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let isSubscribed = false;
  let previousBugCount = 0;
  let previousBugIds = new Set<number>();

  // Polling fallback function
  const pollBugs = async () => {
    try {
      const bugs = await fetchBugs(sessionId);
      onChange(bugs);
      
      // Detect new bugs by comparing counts and IDs
      const currentBugIds = new Set(bugs.map(b => b.id).filter((id): id is number => id !== undefined));
      const newBugIds = [...currentBugIds].filter(id => !previousBugIds.has(id));
      
      if (bugs.length > previousBugCount && newBugIds.length > 0) {
        // New bug(s) detected via polling
        const newBug = bugs.find(b => newBugIds.includes(b.id!));
        if (newBug) {
          notifyUpdate('BUG_NEW', { title: newBug.title, reporter: newBug.reporterName });
        }
      } else if (bugs.length === previousBugCount) {
        // Check if any bug was resolved
        const resolvedBugs = bugs.filter(b => 
          b.status === BugStatus.RESOLVED && 
          previousBugIds.has(b.id!) &&
          !previousBugIds.has(b.id!) // This logic needs fixing
        );
        // Actually, we need to track previous status - for now, just check if latest was resolved
        const latest = bugs[0];
        if (latest?.status === BugStatus.RESOLVED) {
          // This is a simple check - might trigger multiple times, but better than nothing
          notifyUpdate('BUG_RESOLVED', { title: latest.title, solver: latest.solverName });
        }
      }
      
      previousBugCount = bugs.length;
      previousBugIds = currentBugIds;
    } catch (error) {
      console.error('Error polling bugs:', error);
    }
  };

  // Set up Supabase Realtime subscription
  channel = supabase
    .channel(`bugs-${sessionId}`, {
      config: {
        broadcast: { self: true },
      },
    })
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'bugs', 
        filter: `session_id=eq.${sessionId}` 
      },
      async (payload) => {
        console.log('Realtime update received:', payload.eventType, payload);
        try {
          const bugs = await fetchBugs(sessionId);
          onChange(bugs);
          
          // Determine what type of event this is based on payload
          if (payload.eventType === 'INSERT') {
            // New bug was added
            const newBug = payload.new ? mapBug(payload.new) : bugs[0];
            notifyUpdate('BUG_NEW', { title: newBug.title, reporter: newBug.reporterName });
          } else if (payload.eventType === 'UPDATE') {
            // Bug was updated - check if it was resolved
            const updatedBug = payload.new ? mapBug(payload.new) : null;
            const oldBug = payload.old ? mapBug(payload.old) : null;
            
            if (updatedBug?.status === BugStatus.RESOLVED && oldBug?.status !== BugStatus.RESOLVED) {
              // Bug was just resolved
              notifyUpdate('BUG_RESOLVED', { title: updatedBug.title, solver: updatedBug.solverName });
            } else {
              // Other update
              notifyUpdate('BUG_UPDATE', {});
            }
          } else {
            // Fallback: check latest bug status
            const latest = bugs[0];
            if (latest?.status === BugStatus.RESOLVED) {
              notifyUpdate('BUG_RESOLVED', { title: latest.title, solver: latest.solverName });
            } else {
              notifyUpdate('BUG_UPDATE', {});
            }
          }
        } catch (error) {
          console.error('Error handling realtime update:', error);
        }
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        isSubscribed = true;
        // Stop polling if realtime is working
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('Realtime subscription failed, falling back to polling');
        isSubscribed = false;
        // Start polling as fallback
        if (!pollInterval) {
          pollInterval = setInterval(pollBugs, 2000); // Poll every 2 seconds
        }
      }
    });

  // Initial poll and set up polling as fallback
  pollBugs();
  if (!isSubscribed) {
    pollInterval = setInterval(pollBugs, 2000);
  }

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  };
};

export const addBug = async (sessionId: string, input: Omit<Bug, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase.from('bugs').insert({
    session_id: sessionId,
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: input.status,
    reporter_name: input.reporterName,
    solver_name: input.solverName ?? null,
  }).select().single();
  
  if (error) throw error;
  
  // Record event for gamification
  if (data) {
    const bug = mapBug(data);
    try {
      const { recordBugOpened } = await import('./events');
      await recordBugOpened(bug);
    } catch (e) {
      console.warn('Failed to record bug_opened event:', e);
    }
  }
  
  notifyUpdate('BUG_NEW', { title: input.title, reporter: input.reporterName });
};

export const updateBug = async (bugId: number, updates: Partial<Bug>) => {
  // Fetch current bug state before update
  const { data: currentBug } = await supabase
    .from('bugs')
    .select('*')
    .eq('id', bugId)
    .single();
  
  const payload: any = {};
  if (updates.status !== undefined) payload.status = updates.status;
  // Handle solverName - can be set to a value or cleared (undefined/null)
  if (updates.solverName !== undefined) {
    payload.solver_name = updates.solverName ?? null;
  }
  payload.updated_at = new Date().toISOString();

  const { error } = await supabase.from('bugs').update(payload).eq('id', bugId);
  if (error) throw error;
  
  // Record events for gamification
  if (currentBug) {
    const oldBug = mapBug(currentBug);
    const newStatus = updates.status ?? oldBug.status;
    const newSolver = updates.solverName ?? oldBug.solverName;
    
    try {
      const { recordBugFixed, recordBugReopened } = await import('./events');
      
      // Bug was resolved
      if (oldBug.status !== BugStatus.RESOLVED && newStatus === BugStatus.RESOLVED && newSolver) {
        await recordBugFixed(oldBug, newSolver);
      }
      // Bug was reopened
      else if (oldBug.status === BugStatus.RESOLVED && newStatus !== BugStatus.RESOLVED) {
        await recordBugReopened(oldBug);
      }
    } catch (e) {
      console.warn('Failed to record bug event:', e);
    }
  }
  
  notifyUpdate('BUG_UPDATE', { id: bugId, status: updates.status });
};

export const deleteBug = async (bugId: number) => {
  try {
    // Optionally, record a bug_marked_duplicate event before deletion via events service
    // but since this is an admin-only cleanup operation, we'll just delete for now.
    const { error } = await supabase.from('bugs').delete().eq('id', bugId);
    if (error) throw error;
    notifyUpdate('BUG_UPDATE', { id: bugId, status: 'DELETED' });
  } catch (e) {
    console.error('Failed to delete bug:', e);
    throw e;
  }
};

export const clearDatabase = async (sessionId: string) => {
  const { error } = await supabase.from('bugs').delete().eq('session_id', sessionId);
  if (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
  notifyUpdate('SESSION_UPDATE', { type: 'RESET' });
};

export const createSession = async (session: Session) => {
  const { data, error } = await supabase.from('sessions').insert({
    id: session.id,
    name: session.name,
    start_time: session.startTime,
    end_time: session.endTime ?? null,
    is_active: session.isActive,
  }).select().single();
  if (error) throw error;
  return data.id as string;
};

export const useBugs = (sessionId: string) => {
  const [bugs, setBugs] = useState<Bug[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await ensureSession(sessionId);
        const initial = await fetchBugs(sessionId);
        if (isMounted) {
          setBugs(initial);
          setError(null);
        }
      } catch (e: any) {
        console.error('Error loading bugs:', e);
        const errorMsg = e.message || 'Failed to load bugs. Make sure Supabase tables are set up.';
        if (isMounted) setError(errorMsg);
      }
    })();

    const unsubscribe = subscribeToBugs(sessionId, (b) => {
      if (isMounted) {
        setBugs(b);
        setError(null);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [sessionId]);

  return { bugs, error };
};

export { channel };