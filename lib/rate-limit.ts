/**
 * In-memory rate limiter for API routes.
 * Uses a sliding-window approach. Suitable for single-instance deployments.
 * For production multi-instance: swap with @upstash/ratelimit + Redis.
 */

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => now - t < 60_000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

interface RateLimitConfig {
  /** Max requests allowed in the window (default: 30) */
  maxRequests?: number;
  /** Window size in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = {},
): RateLimitResult {
  const { maxRequests = 30, windowMs = 60_000 } = config;
  const now = Date.now();
  cleanup();

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

  const remaining = Math.max(0, maxRequests - entry.timestamps.length);

  if (remaining <= 0) {
    const oldest = entry.timestamps[0];
    const reset = Math.ceil((oldest + windowMs) / 1000);
    return { allowed: false, remaining: 0, reset };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: remaining - 1,
    reset: Math.ceil((now + windowMs) / 1000),
  };
}

/** Rate limit presets per endpoint type */
export const RATE_LIMITS = {
  chat: { maxRequests: 30, windowMs: 60_000 },
  debrief: { maxRequests: 10, windowMs: 60_000 },
  hint: { maxRequests: 20, windowMs: 60_000 },
  fim: { maxRequests: 30, windowMs: 60_000 },
} as const;
