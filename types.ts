export enum BugSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum BugStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

export interface Bug {
  id?: number; // Auto-incremented by Dexie
  sessionId: string;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  reporterName: string;
  solverName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string; // UUID
  name: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
}

// For Chart Data
export interface LeaderboardEntry {
  name: string;
  count: number;
}
