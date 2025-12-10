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
  const channel = supabase
    .channel(`bugs-${sessionId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bugs', filter: `session_id=eq.${sessionId}` },
      async () => {
        const bugs = await fetchBugs(sessionId);
        onChange(bugs);
        const latest = bugs[0];
        if (latest?.status === BugStatus.RESOLVED) {
          notifyUpdate('BUG_RESOLVED', { title: latest.title, solver: latest.solverName });
        } else {
          notifyUpdate('BUG_UPDATE', {});
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const addBug = async (sessionId: string, input: Omit<Bug, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { error } = await supabase.from('bugs').insert({
    session_id: sessionId,
    title: input.title,
    description: input.description,
    severity: input.severity,
    status: input.status,
    reporter_name: input.reporterName,
    solver_name: input.solverName ?? null,
  });
  if (error) throw error;
  notifyUpdate('BUG_NEW', { title: input.title, reporter: input.reporterName });
};

export const updateBug = async (bugId: number, updates: Partial<Bug>) => {
  const payload: any = {};
  if (updates.status) payload.status = updates.status;
  if (updates.solverName) payload.solver_name = updates.solverName;
  payload.updated_at = new Date().toISOString();

  const { error } = await supabase.from('bugs').update(payload).eq('id', bugId);
  if (error) throw error;
  notifyUpdate('BUG_UPDATE', { id: bugId, status: updates.status });
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