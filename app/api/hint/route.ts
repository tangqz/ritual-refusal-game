import { NextRequest } from 'next/server';
import { logHintRequest, logHintResponse, logHintError, rid } from '@/lib/llm-logger';

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
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, scenario, lang } = body;
  const language = (lang as string) || 'en';

  const userMessages = (messages as Array<{ role: string; content: string }>) || [];
  const lastFew = userMessages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');

  logHintRequest(requestId, {
    scenario: (scenario as string) || 'unknown',
    lang: language,
    messageCount: userMessages.length,
  });

  const systemPrompt = language === 'en'
    ? `You are a friendly Chinese cultural coach. Based on the conversation so far, give ONE short, practical hint about what would be culturally graceful to say or do next. Focus on the Chinese social norm at play. Keep it to 1-2 sentences. Be warm and encouraging. Never sound judgmental. Reply with just the hint text — no tags, no formatting.`
    : `你是一位友好的中国文化教练。根据目前的对话，给出一个简短实用的提示：下一步说什么或做什么在文化上最得体。聚焦当前的中国社交规范。1-2句话。温暖鼓励，不说教。只回复提示文本——不要标签、不要格式。`;

  const finalMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Scenario: ${scenario}\n\nRecent conversation:\n${lastFew}\n\nGive a short hint:` },
  ];

  try {
    const dsResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages: finalMessages,
        max_tokens: 100,
        temperature: 0.5,
        stream: false,
      }),
    });

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
    logHintError(requestId, { latencyMs: Date.now() - startTime, error: 'Failed to reach API' });
    return new Response(JSON.stringify({ error: 'Failed to reach API' }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }
}
