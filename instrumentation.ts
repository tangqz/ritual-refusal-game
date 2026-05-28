/**
 * Startup validation — runs once when the server starts.
 * Validates required environment variables and fails fast with a clear error.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const required = ['DEEPSEEK_API_KEY'] as const;
    const missing: string[] = [];

    for (const key of required) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      const msg = `[CulturalCompass] FATAL: Missing required environment variables: ${missing.join(', ')}. Check your .env.local or Vercel Environment Variables.`;
      console.error(msg);
      // In production, the error will appear in Vercel build logs.
      // The app will still start but API routes will return 500 with a clear message.
    }

    // Warn on optional but recommended vars
    const recommended: Record<string, string> = {
      LLM_DEBUG: 'Set LLM_DEBUG=true for detailed LLM request/response logging.',
      LLM_MAX_RETRIES: 'Controls retry count for API calls (default: 2).',
      NEXT_PUBLIC_SITE_URL: 'Used for OG metadata base URL. Defaults to localhost:3000.',
    };

    for (const [key, hint] of Object.entries(recommended)) {
      if (!process.env[key]) {
        console.warn(`[CulturalCompass] Optional env var ${key} not set. ${hint}`);
      }
    }

    console.log('[CulturalCompass] Environment validation complete.');
  }
}
