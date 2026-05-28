/**
 * Database schema for server-side progress persistence.
 *
 * Designed for Vercel KV (Redis) or Postgres via Prisma.
 * localStorage remains as offline fallback.
 *
 * Migration path:
 *   1. Deploy with server-side persistence + localStorage fallback
 *   2. When auth is added, link anonymous sessionId to user account
 *   3. Migrate localStorage data to server on first authenticated session
 */

export interface UserRecord {
  id: string; // Anonymous session UUID
  createdAt: string; // ISO timestamp
  lastActiveAt: string;
}

export interface ProgressRecord {
  userId: string;
  scenarioId: string;
  completedStages: string[]; // e.g. ['observe', 'guided']
  insightsCollected: string[]; // wisdom card IDs
  bestRoundsPlayed: number;
  bestEndReason: string;
  lastPlayedAt: string;
}

export interface GameProgressRecord {
  userId: string;
  onboardingCompleted: boolean;
  completedScenarios: string[]; // scenario IDs where all 4 stages are done
  totalInsightsCollected: number;
  lastActiveAt: string;
}

// Vercel KV key patterns:
//   user:{sessionId}           → UserRecord
//   progress:{sessionId}:{scenarioId} → ProgressRecord
//   game:{sessionId}            → GameProgressRecord

export function userKey(sessionId: string): string {
  return `user:${sessionId}`;
}

export function progressKey(sessionId: string, scenarioId: string): string {
  return `progress:${sessionId}:${scenarioId}`;
}

export function gameKey(sessionId: string): string {
  return `game:${sessionId}`;
}
