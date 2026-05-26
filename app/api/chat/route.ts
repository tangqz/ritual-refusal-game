import { NextRequest } from 'next/server';
import { buildSystemPrompt } from '@/lib/prompts/prompt-builder';
import {
  logChatRequest, logChatResponse, logChatError, rid,
} from '@/lib/llm-logger';

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

  const { messages, scenario, stage, roundNumber, lang, sessionId } = body;
  if (!scenario || !stage) {
    return new Response(JSON.stringify({ error: 'Missing scenario/stage' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const currentRound = (roundNumber as number) || 1;
  const language = (lang as string) || 'en';

  // Count refusals from user messages for pacing context
  const userMessages = (messages as Array<{ role: string; content: string }>) || [];
  const refusalCount = userMessages.filter(m => {
    const t = m.content.toLowerCase();
    return m.role === 'user' && (
      t.includes("can't") || t.includes('cannot') || t.includes('no no') ||
      t.includes('不要') || t.includes('不行') || t.includes('不能') ||
      t.includes("couldn't") || t.includes('keep it') || t.includes('too much') ||
      t.includes('太客气') || t.includes('不好意思')
    );
  }).length;

  const systemPrompt = buildSystemPrompt(
    scenario as string, stage as string, language as 'en' | 'zh',
    currentRound, refusalCount
  );

  const finalMessages = [
    { role: 'system', content: systemPrompt },
    ...userMessages,
  ];

  logChatRequest(requestId, {
    scenario: scenario as string,
    stage: stage as string,
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

  if (sessionId) dsBody.user_id = `cultural-compass-${sessionId}`;

  // Longer timeout for guided mode (deep reasoning takes time)
  const fetchTimeout = stage === 'guided' ? 90000 : 30000;

  let dsResponse: Response;
  try {
    dsResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(dsBody),
      signal: AbortSignal.timeout(fetchTimeout),
    });
  } catch {
    logChatError(requestId, { latencyMs: Date.now() - startTime, error: 'Failed to reach API' });
    return new Response(JSON.stringify({ error: 'Failed to reach API' }), {
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
    logChatError(requestId, { latencyMs: Date.now() - startTime, error: 'No response body' });
    return new Response(JSON.stringify({ error: 'No response body' }), {
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
          error: 'Stream interrupted',
        });
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Stream interrupted' })}\n\n`)
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
