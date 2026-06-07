/**
 * Shared fetch utility with exponential backoff + jitter retry.
 * Used by all API routes that call DeepSeek.
 */

const DEFAULT_MAX_RETRIES = parseInt(process.env.LLM_MAX_RETRIES || '2', 10);

/** Exponential backoff with jitter to prevent thundering herd on API recovery */
function backoffMs(attempt: number): number {
  const base = Math.min(1000 * Math.pow(2, attempt), 8000);
  return base + Math.random() * base * 0.3;
}

export interface FetchWithRetryOptions extends Omit<RequestInit, 'signal'> {
  /**
   * Per-attempt timeout in milliseconds.
   * A fresh AbortSignal is created for each retry attempt, so timeouts from
   * one attempt do not poison subsequent retries.
   */
  timeoutMs?: number;
  /**
   * External AbortSignal to cancel the entire operation (all retries).
   * When this signal aborts, fetchWithRetry stops retrying immediately.
   */
  signal?: AbortSignal;
}

/**
 * Fetch with retry on 5xx errors, network failures, and per-attempt timeouts.
 * Does NOT retry on client errors (4xx).
 * Each retry uses exponential backoff with up to 30% random jitter.
 * A fresh timeout signal is created for each attempt when timeoutMs is set.
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions,
  maxRetries: number = DEFAULT_MAX_RETRIES,
): Promise<Response> {
  const { timeoutMs, signal: externalSignal, ...fetchInit } = options;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check if external signal was already aborted before retrying
    if (externalSignal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }

    // Create a fresh per-attempt AbortController
    const perAttemptController = new AbortController();
    const timeoutId = timeoutMs ? setTimeout(() => perAttemptController.abort(), timeoutMs) : null;

    // If external signal aborts, cancel this attempt too
    const onExternalAbort = () => perAttemptController.abort();
    externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      const response = await fetch(url, {
        ...fetchInit,
        signal: perAttemptController.signal,
      });

      // Clean up timeout
      if (timeoutId) clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);

      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        lastErr = new Error(`API ${response.status}`);
        await new Promise(r => setTimeout(r, backoffMs(attempt)));
        continue;
      }
      return response;
    } catch (err) {
      // Clean up timeout
      if (timeoutId) clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);

      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, backoffMs(attempt)));
      }
    }
  }
  throw lastErr;
}
