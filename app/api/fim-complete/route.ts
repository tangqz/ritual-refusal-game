import { NextRequest } from 'next/server';
import { logFimRequest, logFimResponse, logFimError, rid } from '@/lib/llm-logger';

export async function POST(request: NextRequest) {
  const requestId = rid();
  const startTime = Date.now();

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { prompt, suffix, stop } = body;
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Missing prompt' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  logFimRequest(requestId, {
    promptLength: (prompt as string).length,
    suffixLength: (suffix as string)?.length || 0,
  });

  const dsBody: Record<string, unknown> = {
    model: 'deepseek-v4-pro',
    prompt: prompt as string,
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
    logFimError(requestId, { latencyMs: Date.now() - startTime, error: 'Failed to reach FIM API' });
    return new Response(JSON.stringify({ error: 'Failed to reach FIM API' }), {
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
    return new Response(JSON.stringify({ error: `FIM API ${dsResponse.status}`, details: errText }), {
      status: dsResponse.status < 500 && dsResponse.status !== 429 ? dsResponse.status : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Stream the completion back — forward SSE text chunks
  const reader = dsResponse.body?.getReader();
  if (!reader) {
    logFimError(requestId, { latencyMs: Date.now() - startTime, error: 'No response body' });
    return new Response(JSON.stringify({ error: 'No response body' }), {
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
          error: 'Stream interrupted',
        });
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Stream interrupted' })}\n\n`)
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
