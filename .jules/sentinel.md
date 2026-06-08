## 2024-05-24 - [CRITICAL] Fix Rate Limit Bypass via x-session-id Spoofing
**Vulnerability:** The application was using a client-controlled `x-session-id` header as the primary key for rate limiting API endpoints (`/api/chat`, `/api/fim-complete`, `/api/hint`, `/api/debrief`).
**Learning:** Because `x-session-id` is generated client-side (e.g., using `crypto.randomUUID()` in `localStorage`), an attacker can easily bypass the rate limit by rotating the session ID on every request. This exposes the system to Denial of Service (DoS) attacks and significant cost overruns from unbounded upstream API calls.
**Prevention:** Always use a server-determined identifier, primarily the client's IP address (`request.ip` or `x-forwarded-for` from trusted proxies), as the basis for rate limiting to prevent client-side circumvention.

## 2024-05-24 - [MEDIUM] Prevent Upstream API Error Details Leakage
**Vulnerability:** Upstream API error details (such as the raw error text from DeepSeek) were being passed directly to the client in the `details` field of the API response.
**Learning:** Exposing internal error messages from upstream providers to the client leaks sensitive operational information, potentially including API usage limits, token lengths, prompt patterns, or architectural details, which could assist an attacker in crafting specific payloads.
**Prevention:** Catch upstream API errors server-side, log the detailed error for debugging (as is already done with `logChatError`), and return a generic error message or omit the `details` field entirely when responding to the client.
## 2026-06-08 - [IP Spoofing Bypass in Rate Limiter]
**Vulnerability:** Rate limiting relied primarily on the `x-forwarded-for` and `x-real-ip` headers, which can be easily spoofed by malicious clients. This allowed bypassing the rate limit controls for all LLM-backed API endpoints.
**Learning:** Next.js provides `request.ip` for securely getting the client's IP from the edge infrastructure. Trusting user-provided headers for security checks is an anti-pattern.
**Prevention:** Always prioritize `request.ip` when available in Next.js App Router for security purposes. Fall back to parsing `x-forwarded-for` safely (by taking only the first IP and trimming it) when necessary, but understand the risks.
