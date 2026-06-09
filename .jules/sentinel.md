## 2024-05-24 - [CRITICAL] Fix Rate Limit Bypass via x-session-id Spoofing
**Vulnerability:** The application was using a client-controlled `x-session-id` header as the primary key for rate limiting API endpoints (`/api/chat`, `/api/fim-complete`, `/api/hint`, `/api/debrief`).
**Learning:** Because `x-session-id` is generated client-side (e.g., using `crypto.randomUUID()` in `localStorage`), an attacker can easily bypass the rate limit by rotating the session ID on every request. This exposes the system to Denial of Service (DoS) attacks and significant cost overruns from unbounded upstream API calls.
**Prevention:** Always use a server-determined identifier, primarily the client's IP address (`request.ip` or `x-forwarded-for` from trusted proxies), as the basis for rate limiting to prevent client-side circumvention.

## 2024-05-24 - [MEDIUM] Prevent Upstream API Error Details Leakage
**Vulnerability:** Upstream API error details (such as the raw error text from DeepSeek) were being passed directly to the client in the `details` field of the API response.
**Learning:** Exposing internal error messages from upstream providers to the client leaks sensitive operational information, potentially including API usage limits, token lengths, prompt patterns, or architectural details, which could assist an attacker in crafting specific payloads.
**Prevention:** Catch upstream API errors server-side, log the detailed error for debugging (as is already done with `logChatError`), and return a generic error message or omit the `details` field entirely when responding to the client.

## 2026-06-07 - [CRITICAL] Prevent IP Spoofing in Rate Limiting
**Vulnerability:** The rate-limiting logic in Next.js API routes (`/api/chat`, `/api/fim-complete`, `/api/hint`, `/api/debrief`) was extracting the client IP by first reading the `x-forwarded-for` or `x-real-ip` headers, before checking the actual connection IP (`request.ip`).
**Learning:** Client-controlled HTTP headers like `x-forwarded-for` can be trivially spoofed by an attacker, allowing them to bypass IP-based rate limiting entirely and launch Denial of Service (DoS) attacks or run up API costs.
**Prevention:** In Next.js App Router API routes, prioritize the server-determined `request.ip` property. Only fall back to headers if `request.ip` is unavailable, and ideally ensure the application is behind a trusted reverse proxy that correctly normalizes these headers.
