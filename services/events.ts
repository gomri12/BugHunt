import { supabase } from './supabaseClient';
import { Bug, BugSeverity } from '../types';

export type BugEventType = 
  | 'bug_opened'
  | 'bug_triaged'
  | 'bug_fixed'
  | 'bug_reopened'
  | 'bug_closed_invalid'
  | 'bug_marked_duplicate';

export interface BugEvent {
  id?: string;
  createdAt: Date;
  type: BugEventType;
  bugId: number;
  severity: BugSeverity;
  feature?: string;
  reporter: string;
  solver?: string;
  meta?: {
    repro?: boolean;
    logs?: boolean;
    tests?: boolean;
    rca?: boolean;
  };
}

export interface LeaderboardEntry {
  person: string;
  score_total: number;
  score_positive: number;
  score_negative: number;
  events_count: number;
}

export interface FeatureHeatmapEntry {
  feature: string;
  opened_count: number;
  fixed_count: number;
  critical_count: number;
  high_count: number;
}

export interface StreakEntry {
  solver: string;
  current_streak: number;
  last_fix_at: Date;
}

/**
 * Record a bug event
 */
export const recordEvent = async (event: Omit<BugEvent, 'id' | 'createdAt'>): Promise<void> => {
  const { error } = await supabase.from('bug_events').insert({
    type: event.type,
    bug_id: event.bugId,
    severity: event.severity,
    feature: event.feature ?? null,
    reporter: event.reporter,
    solver: event.solver ?? null,
    meta: event.meta ?? {},
  });
  
  if (error) {
    console.error('Failed to record event:', error);
    throw error;
  }
};

/**
 * Record bug opened event
 */
export const recordBugOpened = async (bug: Bug): Promise<void> => {
  await recordEvent({
    type: 'bug_opened',
    bugId: bug.id!,
    severity: bug.severity,
    reporter: bug.reporterName,
    meta: {},
  });
};

/**
 * Record bug fixed event
 */
export const recordBugFixed = async (
  bug: Bug,
  solver: string,
  meta?: { tests?: boolean; rca?: boolean }
): Promise<void> => {
  await recordEvent({
    type: 'bug_fixed',
    bugId: bug.id!,
    severity: bug.severity,
    feature: (bug as any).feature,
    reporter: bug.reporterName,
    solver,
    meta,
  });
};

/**
 * Record bug reopened event
 */
export const recordBugReopened = async (bug: Bug): Promise<void> => {
  await recordEvent({
    type: 'bug_reopened',
    bugId: bug.id!,
    severity: bug.severity,
    feature: (bug as any).feature,
    reporter: bug.reporterName,
    solver: bug.solverName,
  });
};

/**
 * Fetch leaderboard
 */
export const fetchLeaderboard = async (
  timeFilter: 'today' | 'this_hunt' | 'all_time' = 'all_time'
): Promise<LeaderboardEntry[]> => {
  let query = supabase.from('v_leaderboard').select('*');
  
  // Note: Time filtering would need to be done in the view or with a custom query
  // For now, we'll fetch all and filter client-side if needed
  const { data, error } = await query.order('score_total', { ascending: false });
  
  if (error) {
    console.error('Failed to fetch leaderboard:', error);
    throw error;
  }
  
  return (data ?? []).map((row: any) => ({
    person: row.person,
    score_total: row.score_total ?? 0,
    score_positive: row.score_positive ?? 0,
    score_negative: row.score_negative ?? 0,
    events_count: row.events_count ?? 0,
  }));
};

/**
 * Fetch feature heatmap
 */
export const fetchFeatureHeatmap = async (): Promise<FeatureHeatmapEntry[]> => {
  const { data, error } = await supabase
    .from('v_feature_heatmap')
    .select('*')
    .order('opened_count', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Failed to fetch feature heatmap:', error);
    throw error;
  }
  
  return (data ?? []).map((row: any) => ({
    feature: row.feature,
    opened_count: row.opened_count ?? 0,
    fixed_count: row.fixed_count ?? 0,
    critical_count: row.critical_count ?? 0,
    high_count: row.high_count ?? 0,
  }));
};

/**
 * Fetch streaks
 */
export const fetchStreaks = async (): Promise<StreakEntry[]> => {
  const { data, error } = await supabase
    .from('v_streaks')
    .select('*')
    .order('current_streak', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Failed to fetch streaks:', error);
    throw error;
  }
  
  return (data ?? []).map((row: any) => ({
    solver: row.solver,
    current_streak: row.current_streak ?? 0,
    last_fix_at: new Date(row.last_fix_at),
  }));
};

/**
 * Fetch recent events for live feed
 */
export const fetchRecentEvents = async (limit: number = 20): Promise<BugEvent[]> => {
  const { data, error } = await supabase
    .from('bug_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Failed to fetch recent events:', error);
    throw error;
  }
  
  return (data ?? []).map((row: any) => ({
    id: row.id,
    createdAt: new Date(row.created_at),
    type: row.type as BugEventType,
    bugId: row.bug_id,
    severity: row.severity as BugSeverity,
    feature: row.feature,
    reporter: row.reporter,
    solver: row.solver,
    meta: row.meta ?? {},
  }));
};

/**
 * Subscribe to new events for live feed
 */
export const subscribeToEvents = (
  onEvent: (event: BugEvent) => void
): (() => void) => {
  const channel = supabase
    .channel('bug_events_live')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bug_events',
      },
      (payload) => {
        const row = payload.new;
        const event: BugEvent = {
          id: row.id,
          createdAt: new Date(row.created_at),
          type: row.type as BugEventType,
          bugId: row.bug_id,
          severity: row.severity as BugSeverity,
          feature: row.feature,
          reporter: row.reporter,
          solver: row.solver,
          meta: row.meta ?? {},
        };
        onEvent(event);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
};

