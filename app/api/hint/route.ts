import { NextRequest } from 'next/server';
import { logHintRequest, logHintResponse, logHintError, rid } from '@/lib/llm-logger';
import { getScenarioGoal } from '@/lib/scenario-goals';
import { hintRequestSchema } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { apiMsg } from '@/lib/i18n';
import { fetchWithRetry } from '@/lib/fetch-utils';

export async function POST(request: NextRequest) {
  const requestId = rid();
  const startTime = Date.now();

  // Rate limiting
  const sessionId = request.headers.get('x-session-id') || request.headers.get('x-forwarded-for') || 'anonymous';
  const { allowed, remaining } = checkRateLimit(`hint:${sessionId}`, RATE_LIMITS.hint);
  if (!allowed) {
    return new Response(JSON.stringify({ error: apiMsg('tooManyHintRequests', 'en') }), {
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
  const parsed = hintRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({
      error: apiMsg('validationFailed', 'en'),
      details: parsed.error.flatten().fieldErrors,
    }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, scenario, lang } = parsed.data;
  const language = lang || 'en';
  const goal = getScenarioGoal(scenario);

  const lastFew = messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');

  logHintRequest(requestId, {
    scenario: scenario || 'unknown',
    lang: language,
    messageCount: messages.length,
  });

  const hintContextEn = goal?.hintContextEn || 'The player is learning Chinese social etiquette. Guide them toward the culturally appropriate response.';
  const hintContextZh = goal?.hintContextZh || '玩家正在学习中国社交礼仪。引导他们走向文化上得体的回应。';
  const targetMin = goal?.targetRoundRange?.min ?? 2;
  const targetMax = goal?.targetRoundRange?.max ?? 3;

  const systemPrompt = language === 'en'
    ? `You are a Chinese cultural coach. ${hintContextEn}

Based on the conversation so far, count how many rounds of polite refusal/deflection the player has done. The culturally-correct moment to make the goal move is around round ${targetMin}-${targetMax}.

- If the player has done fewer than ${targetMin} polite refusals/deflections: suggest a warm deflection phrase appropriate to the situation.
- If the player has done ${targetMin}-${targetMax}: tell them NOW is the right moment — describe what the culturally-correct action looks like.
- If the goal has already been achieved: praise them warmly.

Give ONE short, specific sentence (max 20 words). Be direct and practical — no fluff. Reply with just the hint text.`
    : `你是一位中国文化教练。${hintContextZh}

根据目前的对话，数一数玩家已经进行了几轮礼貌推辞/转移。文化上正确的目标动作时机大约在第${targetMin}-${targetMax}轮。

- 玩家礼貌推辞/转移少于${targetMin}次：建议一句适合当前情境的温暖客气话。
- 玩家已进行${targetMin}-${targetMax}轮：告诉他们现在正是时候——描述文化上正确的做法是什么。
- 目标已经达成：热情地表扬他们。

给一句简短、具体的提示（最多30字）。直接、实用——不要废话。只回复提示文本。`;

  const finalMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Scenario: ${scenario}\n\nRecent conversation:\n${lastFew}\n\nGive a short hint:` },
  ];

  try {
    const dsResponse = await fetchWithRetry(
      'https://api.deepseek.com/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-v4-pro',
          messages: finalMessages,
          max_tokens: 100,
          temperature: 0.5,
          stream: false,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!dsResponse.ok) {
      const latency = Date.now() - startTime;
      logHintError(requestId, { latencyMs: latency, error: `API ${dsResponse.status}`, status: dsResponse.status });
      return new Response(JSON.stringify({ error: `API ${dsResponse.status}` }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await dsResponse.json();
    const hint = data.choices?.[0]?.message?.content || '';

    logHintResponse(requestId, {
      latencyMs: Date.now() - startTime,
      hintLength: hint.length,
      hint,
    });

    return new Response(JSON.stringify({ hint }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    logHintError(requestId, { latencyMs: Date.now() - startTime, error: apiMsg('failedToReachApi', 'en') });
    return new Response(JSON.stringify({ error: apiMsg('failedToReachApi', language) }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }
}
