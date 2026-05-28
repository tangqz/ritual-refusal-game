import { NextRequest } from 'next/server';

export async function GET(_request: NextRequest) {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {
    service: { status: 'ok' },
  };

  // Check DeepSeek API key configured
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    checks.deepseek = { status: 'error', message: 'DEEPSEEK_API_KEY not configured' };
  } else {
    checks.deepseek = { status: 'ok' };
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok');

  return new Response(JSON.stringify({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }), {
    status: allOk ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  });
}
