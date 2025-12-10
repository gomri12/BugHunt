import Dexie, { Table } from 'dexie';
import { Bug, Session } from '../types';

export const GLOBAL_SESSION_ID = 'global-bug-hunt-session';

// We use Dexie to simulate a full database in the browser.
// This meets the "Persistence" requirement without needing a separate backend server process for this demo.
class BugHuntDatabase extends Dexie {
  bugs!: Table<Bug, number>;
  sessions!: Table<Session, string>;

  constructor() {
    super('BugHuntDB');
    (this as any).version(1).stores({
      sessions: 'id, name, isActive',
      bugs: '++id, sessionId, status, reporterName, solverName, severity'
    });
  }
}

export const db = new BugHuntDatabase();

// Broadcast Channel for Real-time updates across tabs
const channel = new BroadcastChannel('bug_hunt_live_updates');

export const notifyUpdate = (type: 'BUG_NEW' | 'BUG_UPDATE' | 'BUG_RESOLVED' | 'SESSION_UPDATE', payload?: any) => {
  channel.postMessage({ type, payload });
};

export const onUpdate = (callback: (msg: any) => void) => {
  channel.onmessage = (event) => callback(event.data);
  return () => {
    channel.onmessage = null;
  };
};

export const clearDatabase = async () => {
  try {
    // Fix: cast db to any to access transaction method which is inherited from Dexie but not recognized by TS in this context
    await (db as any).transaction('rw', db.bugs, db.sessions, async () => {
      await db.bugs.clear();
      await db.sessions.clear();
    });
    notifyUpdate('SESSION_UPDATE', { type: 'RESET' });
    console.log("Database cleared successfully");
  } catch (error) {
    console.error("Failed to clear database:", error);
    throw error;
  }
};

export { channel };