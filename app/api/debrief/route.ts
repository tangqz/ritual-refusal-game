import { NextRequest } from 'next/server';
import type { ScenarioId } from '@/lib/scenario-config';
import { SCENARIOS } from '@/lib/scenario-config';

export interface AnnotationItem {
  type: 'good' | 'improve';
  /** 0-based index into user messages */
  userMsgIndex: number;
  /** The exact phrase/substring from the user's message to highlight */
  phrase: string;
  /** Explanation (for good) or problem analysis + suggestion (for improve) */
  explanation: string;
}

export async function POST(request: NextRequest) {
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

  const { messages, scenarioId, stage, roundsPlayed, insightsCollected, lang } = body;
  if (!scenarioId || !messages) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const language = (lang as string) || 'en';
  const scenario = SCENARIOS[scenarioId as ScenarioId];
  const scenarioTitle = language === 'en' ? scenario?.titleEn : scenario?.titleZh;
  const scenarioTheme = language === 'en' ? scenario?.themeEn : scenario?.themeZh;

  // Build conversation transcript for the LLM
  const allMessages = (messages as Array<{ role: string; content: string }>)
    .filter(m => m.role === 'assistant' || m.role === 'user');

  // Build a numbered user-message list for annotation reference
  const userMessages = allMessages
    .map((m, i) => ({ index: i, role: m.role, content: m.content }))
    .filter(m => m.role === 'user');
  const userMsgList = userMessages
    .map((m, i) => `[UserMsg#${i}] ${m.content}`)
    .join('\n');

  const transcript = allMessages
    .map(m => {
      const label = m.role === 'assistant'
        ? (language === 'en' ? 'NPC (Auntie/Uncle)' : 'NPC（阿姨/叔叔）')
        : (language === 'en' ? 'Player (You)' : '玩家（你）');
      return `${label}: ${m.content}`;
    })
    .join('\n\n');

  const isGuided = (stage as string) === 'guided';

  const systemPrompt = (() => {
    const baseEn = `You are a warm, insightful cultural debrief assistant for a game called "Cultural Compass" that teaches Chinese social navigation to Chinese adoptees raised abroad.

The player just completed the "${scenarioTitle}" scenario (theme: "${scenarioTheme}") in ${stage} mode, with ${roundsPlayed} exchanges and ${(insightsCollected as string[])?.length || 0} wisdom cards collected.`;

    const baseZh = `你是一个温暖、有洞察力的文化复盘助手，为一款叫"文化指南针"的游戏撰写反馈。这款游戏帮助在海外长大的华裔被收养者学习中国社交礼仪。

玩家刚完成了"${scenarioTitle}"场景（主题："${scenarioTheme}"），模式为${stage}，共${roundsPlayed}轮对话，收集了${(insightsCollected as string[])?.length || 0}张智慧卡片。`;

    // Guided mode: title + summary only (no annotations)
    if (isGuided) {
      if (language === 'en') {
        return `${baseEn}

Below is the conversation transcript. You must respond with TWO parts, separated by "---":

PART 1 — A FUN, PERSONALIZED TITLE (one line only):
Create a short, playful, culturally-flavored title. Examples: "The Graceful Refuser 🌸", "Auntie's Favorite Niece 🧧". Be creative, warm, and specific to what they did.

PART 2 — DEBRIEF SUMMARY (1 short paragraph, ~80 words MAX):
Pick ONE thing the player chose well and ONE gentle growth tip. Be specific but concise. End with a warm, encouraging sentence.

FORMAT:
[Title]
---
[Summary]`;
      }
      return `${baseZh}

以下是对话记录。你必须回复两个部分，用"---"分隔：

第一部分 — 有趣的个性化称号（仅一行）：
创建一个简短、有趣、带有文化色彩的称号。例如："优雅的推辞者 🌸"、"阿姨最爱的侄女 🧧"。

第二部分 — 复盘总结（1个短段落，最多100字）：
挑出玩家选择最好的一个点，和一条温和的成长建议。以一句温暖的鼓励收尾。

格式：
[称号]
---
[总结]`;
    }

    // Non-guided modes: title + summary + annotations
    if (language === 'en') {
      return `${baseEn}

Below is the conversation transcript. You must respond with THREE parts, separated by "---":

PART 1 — A FUN, PERSONALIZED TITLE (one line only):
Create a short, playful, culturally-flavored title. Examples: "The Graceful Refuser 🌸", "Auntie's Favorite Niece 🧧". Be creative, warm, and specific to what they did.

PART 2 — DEBRIEF SUMMARY (1 short paragraph, ~80 words MAX):
Pick ONE thing the player did well and ONE gentle growth tip. Be specific but concise. End with a warm, encouraging sentence. Use pinyin (汉字) for key cultural terms.

PART 3 — PHRASE-LEVEL COACHING:
Below are the player's messages, numbered. For each, identify phrases that show good cultural awareness (GOOD) or could be phrased more harmoniously (IMPROVE).

Rules:
- Each on its own line: GOOD|msg#|exact phrase|warm explanation (1-2 sentences)
- Or: IMPROVE|msg#|exact phrase|gentle suggestion with alternative phrasing
- msg# is the player message number (0, 1, 2...)
- The phrase MUST appear verbatim in that player message
- 3-6 annotations total, mixing GOOD and IMPROVE

FORMAT:
[Title]
---
[Summary]
---
GOOD|0|phrase|Why this shows good EQ...
IMPROVE|1|phrase|Try saying "..." instead because...`;
    }
    return `${baseZh}

以下是对话记录。你必须回复三个部分，用"---"分隔：

第一部分 — 有趣的个性化称号（仅一行）：
创建一个简短、有趣、带有文化色彩的称号。例如："优雅的推辞者 🌸"、"阿姨最爱的侄女 🧧"。

第二部分 — 复盘总结（1个短段落，最多100字）：
挑出玩家做得最好的一个点，和一条温和的成长建议。以一句温暖的鼓励收尾。

第三部分 — 逐句精修指导：
以下是玩家的发言，已按顺序编号。找出体现良好文化意识（GOOD）或可以表达得更得体（IMPROVE）的说法。

规则：
- 每条一行：GOOD|编号|原句原词|温暖解释（1-2句）
- 或：IMPROVE|编号|原句原词|温和建议与替代说法
- "编号"是玩家消息序号（0, 1, 2...）
- 原词必须逐字出现在该玩家消息中
- 总共3-6条，GOOD和IMPROVE混合

格式：
[称号]
---
[总结]
---
GOOD|0|原句片段|为什么这样说显得情商高……
IMPROVE|1|原句片段|试试换成"……"因为……`;
  })();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000); // 50s timeout for streaming

    const dsResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `=== FULL CONVERSATION ===\n${transcript}\n\n=== PLAYER MESSAGES (numbered for annotation) ===\n${userMsgList}` },
        ],
        max_tokens: 4000,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!dsResponse.ok) {
      const errText = await dsResponse.text();
      return new Response(JSON.stringify({ error: `API ${dsResponse.status}`, details: errText }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }

    const dsReader = dsResponse.body?.getReader();
    if (!dsReader) {
      return new Response(JSON.stringify({ error: 'No response body' }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a streaming SSE response — match the exact pattern of the working /api/chat
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(ctrl) {
        const decoder = new TextDecoder();
        let rawContent = '';
        let dsBuffer = '';
        let separatorCount = 0;
        let lastProgressSent = 0; // 0=none, 2=title-done, 3=summary-done, 4=annotations-done
        // Step 1 ("thinking") is implicit — client shows it from the start

        // Force-flush the connection with an SSE comment (keep-alive)
        ctrl.enqueue(encoder.encode(':ok\n\n'));

        function enqueue(obj: Record<string, unknown>) {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        }

        try {
          while (true) {
            const { done, value } = await dsReader.read();
            if (done) break;

            dsBuffer += decoder.decode(value, { stream: true });

            // Process complete SSE events from DeepSeek (delimited by \n\n)
            while (dsBuffer.includes('\n\n')) {
              const idx = dsBuffer.indexOf('\n\n');
              const eventBlock = dsBuffer.slice(0, idx);
              dsBuffer = dsBuffer.slice(idx + 2);

              for (const line of eventBlock.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                const jsonStr = trimmed.slice(6);
                if (jsonStr === '[DONE]') continue;

                try {
                  const evt = JSON.parse(jsonStr);
                  const delta = evt.choices?.[0]?.delta?.content as string | undefined;
                  if (delta) {
                    rawContent += delta;

                    // First token arrived → step 1 (thinking) done, step 2 (title) active
                    if (lastProgressSent < 2) {
                      lastProgressSent = 2;
                      enqueue({ type: 'progress', step: 2 });
                    }

                    // Detect "---" lines to advance progress
                    const sepMatches = rawContent.match(/^---\s*$/gm);
                    const newSepCount = sepMatches ? sepMatches.length : 0;
                    if (newSepCount > separatorCount) {
                      separatorCount = newSepCount;
                      // First "---" → title done, step 3 (summary) active
                      if (separatorCount >= 1 && lastProgressSent < 3) {
                        lastProgressSent = 3;
                        enqueue({ type: 'progress', step: 3 });
                      }
                      // Second "---" → summary done, step 4 (annotations) active
                      if (separatorCount >= 2 && lastProgressSent < 4) {
                        lastProgressSent = 4;
                        enqueue({ type: 'progress', step: 4 });
                      }
                    }
                  }
                } catch { /* skip unparseable */ }
              }
            }
          }
        } catch {
          enqueue({ type: 'error', error: 'Stream interrupted' });
          ctrl.close();
          return;
        }

        // Process any trailing data in buffer
        if (dsBuffer.trim().startsWith('data: ') && dsBuffer.trim() !== 'data: [DONE]') {
          try {
            const evt = JSON.parse(dsBuffer.trim().slice(6));
            const delta = evt.choices?.[0]?.delta?.content as string | undefined;
            if (delta) rawContent += delta;
          } catch { /* ignore */ }
        }

        // Parse final result
        const parts = rawContent.split('---');
        const title = parts[0]?.trim() || null;
        const summary = parts[1]?.trim() || rawContent;
        const annotationsRaw = parts.slice(2).join('---').trim();

        const annotations: AnnotationItem[] = [];
        if (annotationsRaw) {
          const annLines = annotationsRaw.split('\n');
          for (const annLine of annLines) {
            let t = annLine.trim();
            if (!t) continue;
            // Normalize full-width pipes and spaces
            t = t.replace(/｜/g, '|').replace(/\s*\|\s*/g, '|');
            const pipeIdx1 = t.indexOf('|');
            const pipeIdx2 = t.indexOf('|', pipeIdx1 + 1);
            const pipeIdx3 = t.indexOf('|', pipeIdx2 + 1);
            if (pipeIdx1 === -1 || pipeIdx2 === -1 || pipeIdx3 === -1) continue;

            const typeStr = t.slice(0, pipeIdx1).trim().toLowerCase();
            const msgIdxStr = t.slice(pipeIdx1 + 1, pipeIdx2).trim();
            const phrase = t.slice(pipeIdx2 + 1, pipeIdx3).trim();
            const explanation = t.slice(pipeIdx3 + 1).trim();

            const type = typeStr === 'good' ? 'good' : typeStr === 'improve' ? 'improve' : null;
            const userMsgIndex = parseInt(msgIdxStr, 10);
            if (!type || isNaN(userMsgIndex) || !phrase || !explanation) continue;

            annotations.push({ type, userMsgIndex, phrase, explanation });
          }
        }

        // Ensure step 4 sent (fallback if LLM didn't produce second "---")
        if (lastProgressSent < 4) {
          enqueue({ type: 'progress', step: 4 });
        }
        enqueue({ type: 'result', title, summary, annotations });
        ctrl.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to reach API' }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }
}
