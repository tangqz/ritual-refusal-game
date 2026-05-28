import { NextRequest } from 'next/server';
import { buildSystemPrompt } from '@/lib/prompts/prompt-builder';
import {
  logChatRequest, logChatResponse, logChatError, rid,
} from '@/lib/llm-logger';
import { chatRequestSchema } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { filterUserInput } from '@/lib/content-filter';
import { apiMsg } from '@/lib/i18n';
import { fetchWithRetry } from '@/lib/fetch-utils';

const MAX_MESSAGES = 20;

/** Trim conversation history to last N messages, injecting a summary prefix if truncated */
function windowMessages(
  messages: Array<{ role: string; content: string }>,
  lang: string,
): Array<{ role: string; content: string }> {
  if (messages.length <= MAX_MESSAGES) return messages;

  const truncated = messages.slice(messages.length - MAX_MESSAGES);
  const summary = lang === 'en'
    ? '(Earlier conversation summarized for brevity.)'
    : '（先前的对话已为简洁起见进行了概括。）';

  return [{ role: 'system' as const, content: summary }, ...truncated];
}

export async function POST(request: NextRequest) {
  const requestId = rid();
  const startTime = Date.now();

  // Rate limiting: per-session (or fall back to IP)
  const sessionId = request.headers.get('x-session-id') || request.headers.get('x-forwarded-for') || 'anonymous';
  const { allowed, remaining } = checkRateLimit(`chat:${sessionId}`, RATE_LIMITS.chat);
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
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({
      error: apiMsg('validationFailed', 'en'),
      details: parsed.error.flatten().fieldErrors,
    }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages: rawMessages, scenario, stage, roundNumber, lang: langParam } = parsed.data;
  const currentRound = roundNumber;
  const language = langParam || 'en';

  // Content moderation: check the last user message for harmful content
  const lastUserMsg = [...rawMessages].reverse().find(m => m.role === 'user');
  if (lastUserMsg) {
    const filterResult = filterUserInput(lastUserMsg.content);
    if (!filterResult.allowed) {
      return new Response(JSON.stringify({ error: apiMsg('contentBlocked', language) }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Window conversation to prevent token budget overruns
  const windowedMessages = windowMessages(rawMessages, language);

  // Count refusals from user messages for pacing context
  const refusalCount = windowedMessages.filter(m => {
    const t = m.content.toLowerCase();
    return m.role === 'user' && (
      t.includes("can't") || t.includes('cannot') || t.includes('no no') ||
      t.includes('不要') || t.includes('不行') || t.includes('不能') ||
      t.includes("couldn't") || t.includes('keep it') || t.includes('too much') ||
      t.includes('太客气') || t.includes('不好意思')
    );
  }).length;

  const systemPrompt = buildSystemPrompt(
    scenario, stage, language,
    currentRound, refusalCount
  );

  const finalMessages = [
    { role: 'system', content: systemPrompt },
    ...windowedMessages,
  ];

  logChatRequest(requestId, {
    scenario, stage,
    roundNumber: currentRound,
    lang: language,
    refusalCount,
    systemPromptLength: systemPrompt.length,
    messageCount: finalMessages.length,
    messages: finalMessages,
  });

  // Build DeepSeek request body
  const dsBody: Record<string, unknown> = {
    model: 'deepseek-v4-pro',
    messages: finalMessages,
    max_tokens: 4096,
    stream: true,
  };

  // Guided mode: enable deep reasoning for nuanced option generation
  // Use higher token budget to accommodate reasoning + multi-section output (FEEDBACK+NPC+OPTIONS)
  if (stage === 'guided') {
    dsBody.reasoning_effort = 'high';
    dsBody.max_tokens = 8192;
  } else {
    dsBody.thinking = { type: 'disabled' };
  }

  if (parsed.data.sessionId) dsBody.user_id = `cultural-compass-${parsed.data.sessionId}`;

  // Longer timeout for guided mode (deep reasoning takes time)
  const fetchTimeout = stage === 'guided' ? 90000 : 30000;

  let dsResponse: Response;
  try {
    dsResponse = await fetchWithRetry(
      'https://api.deepseek.com/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(dsBody),
        signal: AbortSignal.timeout(fetchTimeout),
      },
    );
  } catch {
    logChatError(requestId, { latencyMs: Date.now() - startTime, error: apiMsg('failedToReachApi', 'en') });
    return new Response(JSON.stringify({ error: apiMsg('failedToReachApi', language) }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!dsResponse.ok) {
    const errText = await dsResponse.text();
    logChatError(requestId, {
      latencyMs: Date.now() - startTime,
      error: `API ${dsResponse.status}`,
      status: dsResponse.status,
    });
    return new Response(JSON.stringify({ error: `API ${dsResponse.status}`, details: errText }), {
      status: dsResponse.status < 500 && dsResponse.status !== 429 ? dsResponse.status : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const reader = dsResponse.body?.getReader();
  if (!reader) {
    logChatError(requestId, { latencyMs: Date.now() - startTime, error: apiMsg('noResponseBody', 'en') });
    return new Response(JSON.stringify({ error: apiMsg('noResponseBody', language) }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  // Accumulators for response logging
  let totalChunks = 0;
  let totalChars = 0;
  let thinkingChars = 0;
  const parsedTags: string[] = [];
  let rawText = '';

  // Track client disconnect to abort upstream fetch
  let clientDisconnected = false;
  request.signal.addEventListener('abort', () => {
    clientDisconnected = true;
    reader.cancel().catch(() => {});
  });

  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          if (clientDisconnected) break;
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
                const delta = parsed.choices?.[0]?.delta;

                // Forward reasoning/thinking content as 'thinking' events
                if (delta?.reasoning_content) {
                  thinkingChars += (delta.reasoning_content as string).length;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'thinking', text: delta.reasoning_content })}\n\n`
                    )
                  );
                }

                // Forward main content as 'chunk' events
                if (delta?.content) {
                  const text = delta.content as string;
                  totalChunks++;
                  totalChars += text.length;
                  rawText += text;
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

        // Detect tags in raw text for logging
        const tagMatches = rawText.match(/<<(\w+)>>/g);
        if (tagMatches) {
          for (const m of tagMatches) {
            const tagName = m.replace(/<|<</g, '').replace(/>/g, '');
            if (!parsedTags.includes(tagName)) parsedTags.push(tagName);
          }
        }

        logChatResponse(requestId, {
          latencyMs: Date.now() - startTime,
          totalChunks,
          totalChars,
          thinkingChars,
          parsedTags,
          rawText,
        });

        // Guard against closed controller (client disconnected)
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );
        } catch {
          // Client disconnected — stream already closed, nothing to do
        }
      } catch (e) {
        console.error('Stream error:', e);
        logChatError(requestId, {
          latencyMs: Date.now() - startTime,
          error: apiMsg('streamInterrupted', 'en'),
        });
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: apiMsg('streamInterrupted', language) })}\n\n`)
          );
        } catch {
          // Client already disconnected
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
