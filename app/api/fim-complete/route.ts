import { NextRequest } from 'next/server';
import { logFimRequest, logFimResponse, logFimError, rid } from '@/lib/llm-logger';
import { fimCompleteRequestSchema } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { apiMsg } from '@/lib/i18n';

export async function POST(request: NextRequest) {
  const requestId = rid();
  const startTime = Date.now();

  // Rate limiting: by IP (x-session-id is client-controlled and easily spoofed)
  // SECURITY: Prioritize request.ip to prevent IP spoofing via headers
  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'anonymous';
  const { allowed, remaining } = checkRateLimit(`fim:${ip}`, RATE_LIMITS.fim);
  if (!allowed) {
    return new Response(JSON.stringify({ error: apiMsg('tooManyRequests', 'en') }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'X-RateLimit-Remaining': String(remaining),
      },
    });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: apiMsg('apiKeyNotConfigured', 'en') }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: apiMsg('invalidJsonBody', 'en') }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Zod validation
  const parsed = fimCompleteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({
      error: apiMsg('validationFailed', 'en'),
      details: parsed.error.flatten().fieldErrors,
    }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { prompt, suffix, stop } = parsed.data;

  logFimRequest(requestId, {
    promptLength: prompt.length,
    suffixLength: suffix?.length || 0,
  });

  const dsBody: Record<string, unknown> = {
    model: 'deepseek-v4-pro',
    prompt,
    max_tokens: 20,
    temperature: 0.3,
    stream: true,
  };

  if (suffix) dsBody.suffix = suffix;
  if (stop) dsBody.stop = stop;

  let dsResponse: Response;
  try {
    dsResponse = await fetch('https://api.deepseek.com/beta/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(dsBody),
    });
  } catch {
    logFimError(requestId, { latencyMs: Date.now() - startTime, error: apiMsg('failedToReachApi', 'en') });
    return new Response(JSON.stringify({ error: apiMsg('failedToReachApi', 'en') }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!dsResponse.ok) {
    const errText = await dsResponse.text();
    logFimError(requestId, {
      latencyMs: Date.now() - startTime,
      error: `FIM API ${dsResponse.status}`,
      status: dsResponse.status,
    });
    return new Response(JSON.stringify({ error: `FIM API ${dsResponse.status}` }), {
      status: dsResponse.status < 500 && dsResponse.status !== 429 ? dsResponse.status : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Stream the completion back — forward SSE text chunks
  const reader = dsResponse.body?.getReader();
  if (!reader) {
    logFimError(requestId, { latencyMs: Date.now() - startTime, error: apiMsg('noResponseBody', 'en') });
    return new Response(JSON.stringify({ error: apiMsg('noResponseBody', 'en') }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  let completionLength = 0;
  let completionText = '';

  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          while (buffer.includes('\n\n')) {
            const idx = buffer.indexOf('\n\n');
            const eventBlock = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);

            for (const line of eventBlock.split('\n')) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;

              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(dataStr);
                const text = parsed.choices?.[0]?.text;
                if (text) {
                  completionLength += (text as string).length;
                  completionText += text;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'chunk', text })}\n\n`
                    )
                  );
                }
              } catch {
                // Skip non-JSON
              }
            }
          }
        }

        logFimResponse(requestId, {
          latencyMs: Date.now() - startTime,
          completionLength,
          completion: completionText,
        });

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        );
      } catch (e) {
        console.error('FIM stream error:', e);
        logFimError(requestId, {
          latencyMs: Date.now() - startTime,
          error: apiMsg('streamInterrupted', 'en'),
        });
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: apiMsg('streamInterrupted', 'en') })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
