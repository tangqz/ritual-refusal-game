## 2024-05-24 - [CRITICAL] Fix Rate Limit Bypass via x-session-id Spoofing
**Vulnerability:** The application was using a client-controlled `x-session-id` header as the primary key for rate limiting API endpoints (`/api/chat`, `/api/fim-complete`, `/api/hint`, `/api/debrief`).
**Learning:** Because `x-session-id` is generated client-side (e.g., using `crypto.randomUUID()` in `localStorage`), an attacker can easily bypass the rate limit by rotating the session ID on every request. This exposes the system to Denial of Service (DoS) attacks and significant cost overruns from unbounded upstream API calls.
**Prevention:** Always use a server-determined identifier, primarily the client's IP address (`request.ip` or `x-forwarded-for` from trusted proxies), as the basis for rate limiting to prevent client-side circumvention.

## 2024-05-25 - [MEDIUM] Prevent upstream API error text leakage in API endpoints
**Vulnerability:** Upstream DeepSeek API error text was being returned to the client in the `details` field of error responses on `/api/chat`, `/api/fim-complete`, `/api/debrief`, and `/api/hint` routes.
**Learning:** This exposes internal API details (like the upstream provider, raw error messages, rate limit text, or infrastructure info) to the client, which is a security risk. Error handling must fail securely.
**Prevention:** Always log full error details server-side using structured loggers, but return generic error messages (e.g., `API 502`) to the client without the raw `errText`.
