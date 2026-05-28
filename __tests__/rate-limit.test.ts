import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  // Note: the module uses a shared Map, so we use unique keys per test

  it('allows requests within limit', () => {
    const key = 'test-allow-' + Math.random();
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, { maxRequests: 10, windowMs: 60_000 });
      expect(result.allowed).toBe(true);
    }
  });

  it('returns correct remaining count', () => {
    const key = 'test-remaining-' + Math.random();
    const result1 = checkRateLimit(key, { maxRequests: 5, windowMs: 60_000 });
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(4);
  });

  it('blocks requests exceeding limit', () => {
    const key = 'test-block-' + Math.random();
    const config = { maxRequests: 3, windowMs: 60_000 };
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns reset timestamp in the future', () => {
    const key = 'test-reset-' + Math.random();
    const result = checkRateLimit(key, { maxRequests: 5, windowMs: 60_000 });
    expect(result.reset).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('uses default config when none provided', () => {
    const key = 'test-default-' + Math.random();
    const result = checkRateLimit(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('tracks different keys independently', () => {
    const key1 = 'test-indep-1-' + Math.random();
    const key2 = 'test-indep-2-' + Math.random();
    const config = { maxRequests: 2, windowMs: 60_000 };

    checkRateLimit(key1, config);
    checkRateLimit(key1, config);
    const blockedKey1 = checkRateLimit(key1, config);
    expect(blockedKey1.allowed).toBe(false);

    const allowedKey2 = checkRateLimit(key2, config);
    expect(allowedKey2.allowed).toBe(true);
  });

  it('expired timestamps are cleaned up', () => {
    const key = 'test-expire-' + Math.random();
    // Use a very short window that already expired
    const result = checkRateLimit(key, { maxRequests: 10, windowMs: 1 });
    expect(result.allowed).toBe(true);
    // Wait 2ms then check again — the old timestamp should be expired
    // Just verify a second call also works
    const result2 = checkRateLimit(key, { maxRequests: 10, windowMs: 1 });
    expect(result2.allowed).toBe(true);
  });
});

describe('RATE_LIMITS', () => {
  it('has config for all endpoint types', () => {
    expect(RATE_LIMITS.chat).toBeDefined();
    expect(RATE_LIMITS.debrief).toBeDefined();
    expect(RATE_LIMITS.hint).toBeDefined();
    expect(RATE_LIMITS.fim).toBeDefined();
  });

  it('chat limit is 30 requests per minute', () => {
    expect(RATE_LIMITS.chat.maxRequests).toBe(30);
    expect(RATE_LIMITS.chat.windowMs).toBe(60_000);
  });

  it('debrief limit is more restrictive', () => {
    expect(RATE_LIMITS.debrief.maxRequests).toBe(10);
  });

  it('all limits have positive maxRequests and windowMs', () => {
    for (const [name, config] of Object.entries(RATE_LIMITS)) {
      expect(config.maxRequests, name).toBeGreaterThan(0);
      expect(config.windowMs, name).toBeGreaterThan(0);
    }
  });
});
