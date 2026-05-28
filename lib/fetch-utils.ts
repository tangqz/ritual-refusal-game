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

/**
 * Fetch with retry on 5xx errors and network failures.
 * Does NOT retry on client errors (4xx).
 * Each retry uses exponential backoff with up to 30% random jitter.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries: number = DEFAULT_MAX_RETRIES,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, init);
      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        lastErr = new Error(`API ${response.status}`);
        await new Promise(r => setTimeout(r, backoffMs(attempt)));
        continue;
      }
      return response;
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, backoffMs(attempt)));
      }
    }
  }
  throw lastErr;
}
