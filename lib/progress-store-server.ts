/**
 * Server-side progress storage adapter.
 *
 * Currently uses an in-memory Map (per-instance, not shared).
 * Swap with Vercel KV (@vercel/kv) or Prisma for production:
 *   1. Replace get/put/del with KV/DB calls
 *   2. Deploy with Vercel KV integration
 */

import type { UserRecord, ProgressRecord, GameProgressRecord } from './db-schema';
import { userKey, progressKey, gameKey } from './db-schema';

// In-memory store (replace with Vercel KV in production)
const store = new Map<string, unknown>();

async function get<T>(key: string): Promise<T | null> {
  // In production, replace with: return await kv.get<T>(key);
  return (store.get(key) as T) ?? null;
}

async function put<T>(key: string, value: T): Promise<void> {
  // In production, replace with: await kv.set(key, value);
  store.set(key, value);
}

async function del(key: string): Promise<void> {
  // In production, replace with: await kv.del(key);
  store.delete(key);
}

// ─── User ────────────────────────────────────────────────

export async function getUser(sessionId: string): Promise<UserRecord | null> {
  return get<UserRecord>(userKey(sessionId));
}

export async function upsertUser(sessionId: string): Promise<UserRecord> {
  const existing = await getUser(sessionId);
  if (existing) {
    existing.lastActiveAt = new Date().toISOString();
    await put(userKey(sessionId), existing);
    return existing;
  }
  const user: UserRecord = {
    id: sessionId,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
  await put(userKey(sessionId), user);
  return user;
}

// ─── Scenario Progress ───────────────────────────────────

export async function getScenarioProgress(
  sessionId: string,
  scenarioId: string,
): Promise<ProgressRecord | null> {
  return get<ProgressRecord>(progressKey(sessionId, scenarioId));
}

export async function saveScenarioProgress(
  sessionId: string,
  record: ProgressRecord,
): Promise<void> {
  await put(progressKey(sessionId, record.scenarioId), record);
}

// ─── Game Progress ───────────────────────────────────────

export async function getGameProgress(sessionId: string): Promise<GameProgressRecord | null> {
  return get<GameProgressRecord>(gameKey(sessionId));
}

export async function saveGameProgress(record: GameProgressRecord): Promise<void> {
  await put(gameKey(record.userId), record);
}

export async function deleteProgress(sessionId: string): Promise<void> {
  // Delete all progress keys for a session
  await del(userKey(sessionId));
  await del(gameKey(sessionId));
  // Delete per-scenario progress (best effort — in production, iterate or use scan)
  for (const key of store.keys()) {
    if (key.startsWith(`progress:${sessionId}:`)) {
      await del(key);
    }
  }
}
