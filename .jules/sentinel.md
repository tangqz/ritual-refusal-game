## 2024-05-24 - [CRITICAL] Fix Rate Limit Bypass via x-session-id Spoofing
**Vulnerability:** The application was using a client-controlled `x-session-id` header as the primary key for rate limiting API endpoints (`/api/chat`, `/api/fim-complete`, `/api/hint`, `/api/debrief`).
**Learning:** Because `x-session-id` is generated client-side (e.g., using `crypto.randomUUID()` in `localStorage`), an attacker can easily bypass the rate limit by rotating the session ID on every request. This exposes the system to Denial of Service (DoS) attacks and significant cost overruns from unbounded upstream API calls.
**Prevention:** Always use a server-determined identifier, primarily the client's IP address (`request.ip` or `x-forwarded-for` from trusted proxies), as the basis for rate limiting to prevent client-side circumvention.

## 2024-05-24 - [MEDIUM] Prevent Upstream API Error Details Leakage
**Vulnerability:** Upstream API error details (such as the raw error text from DeepSeek) were being passed directly to the client in the `details` field of the API response.
**Learning:** Exposing internal error messages from upstream providers to the client leaks sensitive operational information, potentially including API usage limits, token lengths, prompt patterns, or architectural details, which could assist an attacker in crafting specific payloads.
**Prevention:** Catch upstream API errors server-side, log the detailed error for debugging (as is already done with `logChatError`), and return a generic error message or omit the `details` field entirely when responding to the client.

## 2025-06-05 - Rate Limit Bypass via Header Spoofing
**Vulnerability:** API routes relied directly on client-controlled HTTP headers (`x-forwarded-for` and `x-real-ip`) for rate-limiting IP identification. This allowed attackers to bypass rate limits by spoofing these headers in their requests.
**Learning:** Next.js securely populates `request.ip` from trusted proxy headers (e.g., when deployed on Vercel). Using raw `x-forwarded-for` headers directly without verifying the proxy chain is insecure.
**Prevention:** Always prioritize `request.ip` for IP identification in Next.js API routes. Only fallback to `x-forwarded-for` if `request.ip` is unavailable and the environment's proxy setup is well understood and secured.
