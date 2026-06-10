'use client';
import { useState, useEffect, useRef, Suspense, useMemo, useCallback} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatBubble } from '@/components/ui/ChatBubble';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { DebriefPanel } from '@/components/game/DebriefPanel';
import { StageSelector } from '@/components/game/StageSelector';
import { LearningStageIndicator } from '@/components/game/LearningStageIndicator';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { PsychologyNote } from '@/components/game/PsychologyNote';
import { FillInInput } from '@/components/game/FillInInput';
import type { ScenarioId, LearningStage } from '@/lib/scenario-config';
import { SCENARIOS } from '@/lib/scenario-config';
import type { Language } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { getScenarioProgress, completeScenarioStage, collectInsight, isStorageAvailable } from '@/lib/game-progress-store';
import { getInsightById } from '@/lib/cultural-insights';
import type { AuntieWisdom } from '@/lib/cultural-insights';
import { StreamParser, type ParsedSections } from '@/lib/stream-parser';
import type { GameTitle } from '@/lib/game-titles';
import { parsedTitleToGameTitle } from '@/lib/game-titles';
import { getObserveScript, chunkForStreaming, type ObserveScript } from '@/lib/observe-script';
import { getScenarioGoal } from '@/lib/scenario-goals';
import { filterLlmOutput } from '@/lib/content-filter';
import type { AnnotationItem } from '@/app/api/debrief/route';

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

interface GameOption {
  text: string;
  isAcceptance: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'context' | 'feedback';
  content: string;
  psychologyNote?: string;   // legacy: LLM-mode combined thoughts
  npcThoughts?: string;      // observe script: NPC-only thoughts
  playerThoughts?: string;   // observe script: Player-only thoughts
  culturalSubtext?: string;  // observe script: shared cultural analysis
  wisdomCard?: AuntieWisdom;
}

function genId(): string { return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

const SAFETY_MAX_ROUNDS = 20;
const OBSERVE_MAX_ROUNDS = 7; // Observe mode should converge within 4-5 rounds; 7 is a safety net

// Client-side fallback titles when LLM debrief is unavailable
function getFallbackTitle(scenarioId: string, stage: string, lang: Language): { title: string; summary: string } {
  const titles: Record<string, { en: string; zh: string }> = {
    hongbao: { en: '🧧 The Red Envelope Apprentice', zh: '🧧 红包学徒' },
    compliment: { en: '🌸 The Graceful Deflector', zh: '🌸 优雅的推辞者' },
    guest: { en: '🍵 The Warm Host', zh: '🍵 温暖的主人' },
    gift: { en: '🎁 The Thoughtful Giver', zh: '🎁 贴心的赠礼者' },
    bill: { en: '🧾 The Bill Whisperer', zh: '🧾 买单高手' },
    dinner: { en: '🍜 The Dinner Diplomat', zh: '🍜 饭局外交家' },
    workplace: { en: '💼 The Guanxi Navigator', zh: '💼 关系导航者' },
    refusal: { en: '🙅 The Artful Refuser', zh: '🙅 委婉的拒绝者' },
  };
  const stageLabels: Record<string, { en: string; zh: string }> = {
    guided: { en: 'You navigated choices thoughtfully', zh: '你深思熟虑地做出了选择' },
    practice: { en: 'You expressed yourself freely', zh: '你自由地表达了自己' },
    challenge: { en: 'You faced real-world conversation', zh: '你面对了真实世界的对话' },
    observe: { en: 'You observed cultural rhythms', zh: '你观察了文化的节奏' },
  };
  const t = titles[scenarioId] || { en: '🌟 Cultural Explorer', zh: '🌟 文化探索者' };
  const s = stageLabels[stage] || { en: 'You completed the journey', zh: '你完成了旅程' };
  return {
    title: lang === 'en' ? t.en : t.zh,
    summary: lang === 'en'
      ? `${s.en} in this scenario. Each interaction is a step toward understanding the beautiful complexity of Chinese social culture. Keep exploring — every conversation reveals a new layer of meaning.`
      : `${s.zh}。每一次互动都是理解中国社交文化之美的一步。继续探索——每次对话都会揭示新的意义层次。`,
  };
}

// Graceful degradation: warm NPC closing messages per scenario when API is unavailable.
// The NPC gently ends the conversation without breaking character or referencing the error.
function getFallbackNpcClosing(scenarioId: string, lang: Language): string {
  const closings: Record<string, { en: string; zh: string }> = {
    hongbao: {
      en: '(smiles warmly, tucking the red envelope into your hand) Ai ya, Auntie is so happy you came today. Next time, come visit again — the door is always open for you. Take care on your way home!',
      zh: '（温暖地笑着，把红包轻轻放进你手里）哎呀，阿姨今天真高兴你来了。下次再来玩——家门永远为你开着。路上小心！',
    },
    compliment: {
      en: '(chuckles softly, eyes crinkling with warmth) You\'re so modest — that\'s exactly what makes you lovely. Auntie won\'t tease you anymore. Go on now, and don\'t forget to eat well!',
      zh: '（轻声笑着，眼角满是温暖）你太谦虚了——这正是你可爱的地方。阿姨不逗你了。快去吧，别忘了好好吃饭！',
    },
    guest: {
      en: '(nods with satisfaction, adjusting the teacups) You\'ve been such a wonderful guest. Auntie feels so happy hosting you. The tea will still be warm when you come next time.',
      zh: '（满意地点点头，整理着茶杯）你真是个好客人。阿姨招待你特别开心。下次来茶还是热的。',
    },
    gift: {
      en: '(beams, pressing your hands gently) The thought behind your gift makes it perfect. Auntie will treasure it. Now go on — and don\'t be a stranger!',
      zh: '（笑容满面，轻轻握着你的手）你这礼物的心意让它变得完美。阿姨会好好珍惜的。快去吧——别生分了！',
    },
    bill: {
      en: '(waves dismissively with a grin) Alright, you win this one — but next meal is on you! Auntie had a wonderful time. Drive safe, dear.',
      zh: '（笑着摆摆手）好吧，这次让你赢了——下顿你请！阿姨今天吃得很开心。开车小心，亲爱的。',
    },
    dinner: {
      en: '(pushes back from the table with a contented sigh) What a wonderful meal with wonderful company. Auntie\'s heart is full. Come back soon — the table is always set for you.',
      zh: '（满足地推桌而起）美好的饭菜，美好的陪伴。阿姨心里满满的。快回来——桌上永远有你的位子。',
    },
    workplace: {
      en: '(nods approvingly, standing to see you out) You handled that with real grace. Auntie is proud of you. Remember — in the workplace, relationships are the real currency.',
      zh: '（赞许地点头，起身相送）你处理得真得体。阿姨为你骄傲。记住——在职场上，关系才是真正的货币。',
    },
    refusal: {
      en: '(smiles with understanding) You have a good heart — knowing when to say no is just as important as knowing when to say yes. Auntie respects that deeply.',
      zh: '（理解地微笑）你心地善良——知道什么时候说不和知道什么时候说是同样重要。阿姨深深尊重这一点。',
    },
  };
  const c = closings[scenarioId] || closings.hongbao;
  return lang === 'en' ? c.en : c.zh;
}

function GameContent() {
  const params = useParams(); const router = useRouter();
  const scenarioId = params.scenario as string;
  const scenario = SCENARIOS[scenarioId as ScenarioId];
  const [lang, setLang] = useState<Language>('en');
  const [stage, setStage] = useState<LearningStage | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [options, setOptions] = useState<GameOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [collectedInsights, setCollectedInsights] = useState<string[]>([]);
  const [pendingWisdom, setPendingWisdom] = useState<AuntieWisdom | null>(null);
  const [observeWaiting, setObserveWaiting] = useState(false);
  const [conversationEndAvailable, setConversationEndAvailable] = useState(false);
  const [hintText, setHintText] = useState('');
  const [isFetchingHint, setIsFetchingHint] = useState(false);

  // Expanded psychology notes: set of message IDs
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  // Expanded cultural subtext (separate from per-role thoughts)
  const [expandedCultural, setExpandedCultural] = useState<Set<string>>(new Set());

  // Streaming state
  const [liveNpc, setLiveNpc] = useState('');
  const [livePlayer, setLivePlayer] = useState('');
  const [liveFeedback, setLiveFeedback] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const liveNpcRef = useRef('');

  const [streamError, setStreamError] = useState(false);
  const [earnedTitle, setEarnedTitle] = useState<GameTitle | null>(null);
  // Debrief transition states
  const [isDebriefing, setIsDebriefing] = useState(false);
  const [debriefTitle, setDebriefTitle] = useState<string | null>(null);
  const [debriefSummary, setDebriefSummary] = useState('');
  const [debriefAnnotations, setDebriefAnnotations] = useState<AnnotationItem[]>([]);
  // Debrief loading progress (0=not started, 1=thinking, 2=title, 3=summary, 4=annotations, 5=done)
  const [debriefProgress, setDebriefProgress] = useState(0);
  const debriefProgressRef = useRef(0);
  const [practiceEndAvailable, setPracticeEndAvailable] = useState(false);
  // Client-side only progress to avoid hydration mismatch
  const [clientProgress, setClientProgress] = useState<ReturnType<typeof getScenarioProgress> | null>(null);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const gameInitRef = useRef(false);
  const endingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const currentRoundRef = useRef(0);
  const stageRef = useRef<LearningStage | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const pendingWisdomRef = useRef<AuntieWisdom | null>(null);
  const tabIdRef = useRef(`tab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  // Track whether the current hint fetch should be ignored (superseded by newer request)
  const hintGenerationRef = useRef(0);
  // Track whether client already showed acceptance feedback for this round
  // Prevents duplicate feedback when LLM also generates <<FEEDBACK>> after acceptance
  const acceptanceFeedbackShownRef = useRef(false);

  const isObserve = stage === 'observe';
  const isGuided = stage === 'guided';
  const isPractice = stage === 'practice';
  const isChallenge = stage === 'challenge';

  // Build FIM prompt context for practice mode
  // ⚡ Bolt Optimization: Memoize the prompt generation based on `messages` state
  // to avoid recalculating string `.join()`s on every single token streamed during live text render.
  const fimPrompt = useMemo((): string => {
    const scenarioTitle = lang === 'en' ? scenario?.titleEn : scenario?.titleZh;
    const scenarioSetting = lang === 'en' ? scenario?.settingEn : scenario?.settingZh;
    const npcRole = lang === 'en' ? scenario?.npcRoleEn : scenario?.npcRoleZh;
    // Last few messages as context
    const recentMsgs = messages.slice(-6).map(m => {
      const role = m.role === 'assistant' ? npcRole : (m.role === 'user' ? 'You' : '');
      return role ? `${role}: ${m.content}` : '';
    }).filter(Boolean).join('\n');
    return `[Scene: ${scenarioSetting}]\n[Your role: A Chinese adoptee learning social norms]\n[NPC: ${npcRole}]\n\n${recentMsgs}\nYou:`;
  }, [messages, lang, scenario]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, options, observeWaiting, liveNpc, livePlayer]);

  // Observe mode timeout safety: auto-advance if stuck in waiting state > 15s
  useEffect(() => {
    if (!observeWaiting || gameOver) return;
    const timeout = setTimeout(() => {
      if (endingRef.current) return;
      const round = currentRoundRef.current;
      if (round >= OBSERVE_MAX_ROUNDS) { endGame('max_rounds'); return; }
      const script = getObserveScript(scenarioId, lang);
      if (script && round < script.rounds.length) {
        playObserveRound(script, round);
      } else {
        streamFetch(messagesRef.current, stageRef.current!, round + 1);
      }
    }, 15_000);
    return () => clearTimeout(timeout);
  }, [observeWaiting, gameOver, scenarioId, lang]);

  // Load progress client-side only to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    setClientProgress(getScenarioProgress(scenarioId as ScenarioId));
  }, [scenarioId]);

  // Warn before leaving mid-game + cleanup abort on unmount
  const beforeUnloadHandlerRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);
  useEffect(() => {
    if (!stage || gameOver) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    beforeUnloadHandlerRef.current = handler;
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      beforeUnloadHandlerRef.current = null;
      abortRef.current?.abort();
    };
  }, [stage, gameOver]);

  // Browser tab coordination: detect when the same game is open in multiple tabs
  const [multiTabWarning, setMultiTabWarning] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);

  // Detect localStorage unavailability on mount
  useEffect(() => {
    if (mounted && !isStorageAvailable()) {
      setStorageWarning(true);
    }
  }, [mounted]);
  useEffect(() => {
    if (!stage || gameOver) return;
    let channel: BroadcastChannel;
    try {
      const channelName = `cultural-compass-${scenarioId}-${stage}`;
      channel = new BroadcastChannel(channelName);
      // Announce presence — if another tab hears this, it knows there's a duplicate
      channel.postMessage({ type: 'heartbeat', tabId: tabIdRef.current });
      // Listen for other tabs
      channel.onmessage = (evt) => {
        if (evt.data?.type === 'heartbeat' && evt.data?.tabId !== tabIdRef.current) {
          setMultiTabWarning(true);
        }
      };
    } catch {
      // BroadcastChannel not supported (e.g., older browsers) — gracefully skip
    }
    return () => {
      try { channel?.close(); } catch { /* ignore */ }
    };
  }, [stage, gameOver, scenarioId]);

  const startGame = (s: LearningStage) => {
    if (gameInitRef.current) return;
    gameInitRef.current = true;
    setStage(s); stageRef.current = s;
    setCurrentRound(1); currentRoundRef.current = 1;
    if (s === 'observe') {
      const script = getObserveScript(scenarioId, lang);
      if (script) {
        playObserveRound(script, 0);
        return;
      }
    }
    setIsLoading(true);
    streamFetch([], s, 1);
  };

  const streamFetch = async (history: Message[], currentStage: LearningStage, nextRound: number, attempt = 0) => {
    if (endingRef.current) return;
    abortRef.current?.abort();
    currentRoundRef.current = nextRound;
    setIsLoading(true); setObserveWaiting(false); setStreamError(false); setHintText('');
    setConversationEndAvailable(false);
    setPracticeEndAvailable(false);
    setLiveNpc(''); setLivePlayer(''); setLiveFeedback('');
    setIsStreaming(true); setIsThinking(false);

    const controller = new AbortController(); abortRef.current = controller;
    const timeoutMs = currentStage === 'guided' ? 90000 : 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const startPrompt = lang === 'en' ? scenario?.startPromptEn : scenario?.startPromptZh;
      let msgsToSend: Array<{ role: string; content: string }>;
      if (history.length === 0) {
        // This should only happen on round 1 (game start).
        // If it happens on later rounds, something is wrong with message passing.
        if (nextRound > 1) {
          console.error(`[streamFetch] BUG: history is empty but round=${nextRound}! messagesRef may be stale.`);
        }
        msgsToSend = [{ role: 'user', content: startPrompt }];
      } else if (currentStage === 'observe') {
        // Send both assistant and user messages so the LLM sees the full conversation context
        // Mark user messages as "Player response from previous round" to help the LLM continue
        msgsToSend = history.filter(m => m.role !== 'context' && m.role !== 'feedback').map(m => {
          if (m.role === 'user') {
            return { role: 'user' as const, content: `[Previous player response: ${m.content}]` };
          }
          return { role: m.role as 'user' | 'assistant', content: m.content };
        });
      } else {
        msgsToSend = history.filter(m => m.role !== 'context' && m.role !== 'feedback').map(m => ({ role: m.role, content: m.content }));
      }

      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgsToSend, scenario: scenarioId, stage: currentStage,
          roundNumber: nextRound, lang,
          retryHint: attempt > 0,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        if ((res.status >= 500 || res.status === 429) && attempt < 2) {
          setIsStreaming(false);
          // Exponential backoff with jitter: base 1s, max 4s, ±25% random jitter
          const base = Math.min(1000 * Math.pow(2, attempt), 4000);
          const jitter = base * (0.75 + Math.random() * 0.5);
          await new Promise(r => setTimeout(r, jitter));
          return streamFetch(history, currentStage, nextRound, attempt + 1);
        }
        const fallbackMsg = getFallbackNpcClosing(scenarioId, lang);
        setMessages(p => [...p, { id: genId(), role: 'assistant', content: fallbackMsg }]);
        setConversationEndAvailable(true);
        setStreamError(true); setIsLoading(false); setIsStreaming(false); return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const parser = new StreamParser();
      const decoder = new TextDecoder();
      let sseBuf = '';
      let lineBuf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuf += decoder.decode(value, { stream: true });
        const sseLines = sseBuf.split('\n'); sseBuf = sseLines.pop() || '';

        for (const sseLine of sseLines) {
          if (!sseLine.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(sseLine.slice(6));
            if (evt.type === 'thinking') {
              setIsThinking(true);
              continue;
            }
            if (evt.type === 'chunk' && evt.text) {
              setIsThinking(false);
              lineBuf += evt.text;
              const contentLines = lineBuf.split('\n');
              lineBuf = contentLines.pop() || '';

              let lastParsed = parser.feed('');
              for (const contentLine of contentLines) {
                lastParsed = parser.feed(contentLine);
              }

              const section = parser.activeSection;
              const raw = lineBuf.trim();

              // Live streaming display
              if (lastParsed.liveNpcText) { setLiveNpc(lastParsed.liveNpcText); liveNpcRef.current = lastParsed.liveNpcText; }
              if (section === 'NPC' && raw && !raw.startsWith('<<') && !raw.includes('<</') && !raw.startsWith('</')) {
                setLiveNpc(raw); liveNpcRef.current = raw;
              }
              if (lastParsed.livePlayerText) setLivePlayer(lastParsed.livePlayerText);
              if (section === 'PLAYER' && raw && !raw.startsWith('<<') && !raw.includes('<</') && !raw.startsWith('</')) {
                setLivePlayer(raw);
              }
              if (lastParsed.liveFeedbackText) setLiveFeedback(lastParsed.liveFeedbackText);
              if (section === 'FEEDBACK' && raw && !raw.startsWith('<<') && !raw.includes('<</') && !raw.startsWith('</')) {
                setLiveFeedback(raw);
              }

            } else if (evt.type === 'error') {
              setMessages(p => [...p, { id: genId(), role: 'assistant', content: `${evt.error}` }]);
            }
          } catch { /* skip malformed SSE */ }
        }
      }

      // Feed any remaining partial line
      if (lineBuf.trim()) {
        const result = parser.feed(lineBuf);
        setLiveNpc(result.liveNpcText);
        setLivePlayer(result.livePlayerText);
      }

      const result = parser.getResult();
      setIsStreaming(false);

      // Detect tag-less LLM output: LLM forgot format, output raw text without <<TAG>> wrappers.
      // In guided mode this means no options → player gets stuck. Retry once.
      // Validate LLM output structure against stage requirements
      const validation = parser.validateOutput(currentStage, nextRound);
      if (!validation.valid) {
        console.warn(`[streamFetch] LLM output validation issues for stage=${currentStage} round=${nextRound}:`, validation.issues);
      }

      // Retry once if no recognized tags (LLM produced raw text).
      // In challenge and practice modes, raw text is common and the getResult()
      // fallback handles it well — skip the retry to avoid unnecessary latency.
      // In guided mode, tags are essential (OPTIONS, FEEDBACK) so retry.
      const needsTagRetry = currentStage !== 'challenge' && currentStage !== 'practice';
      if (!result.hasAnyTag && attempt === 0 && result.npcText && needsTagRetry) {
        console.warn('[streamFetch] LLM output has no tags (raw text). Retrying once...');
        await new Promise(r => setTimeout(r, 500));
        return streamFetch(history, currentStage, nextRound, 1);
      }

      processResult(result, currentStage, nextRound, history);
    } catch (e) {
      clearTimeout(timeoutId);
      if (attempt < 2) {
        setIsStreaming(false);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        return streamFetch(history, currentStage, nextRound, attempt + 1);
      }
      const fallbackMsg = getFallbackNpcClosing(scenarioId, lang);
      setMessages(p => [...p, { id: genId(), role: 'assistant', content: fallbackMsg }]);
      setConversationEndAvailable(true);
      setStreamError(true);
    } finally { setIsLoading(false); setIsStreaming(false); }
  };

  // Strip NPC dialogue contamination from feedback text.
  // LLM sometimes leaks action cues and spoken lines into <<FEEDBACK>> that belong in <<NPC>>.
  const cleanFeedbackText = (raw: string): string => {
    // Pattern: trailing parenthetical action followed by dialogue (Chinese/English mixed)
    // e.g. "...grace. (Her face lights up — she reaches out) Hǎo! Hǎo! This is my good girl!..."
    // Strategy: if the text contains a clear split between "feedback commentary" and
    // "NPC action+dialogue", keep only the commentary part.
    const actionDialoguePattern = /(?:^|\s)\([^)]*(?:face|eyes|hand|reach|pat|squeeze|settle|laugh|smile|nod|shake|voice)[^)]*\)\s*(?:[A-ZĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙhǎo][\s\S]*)$/i;
    const match = raw.match(actionDialoguePattern);
    if (match && match.index !== undefined && match.index > 60) {
      // Keep only the portion before the NPC action+dialogue starts
      const cleaned = raw.slice(0, match.index).trim();
      // Only use cleaned version if it still has meaningful content (>30 chars)
      if (cleaned.length > 30) return cleaned.replace(/[—–-]\s*$/, '').trim();
    }
    return raw;
  };

  const processResult = (result: ParsedSections, currentStage: LearningStage, nextRound: number, history: Message[]) => {
    // Track wisdom for later assignment to the NPC message
    let wisdomCard: AuntieWisdom | undefined;
    if (result.wisdom?.id) {
      const card = getInsightById(result.wisdom.id);
      if (card) {
        wisdomCard = card;
        pendingWisdomRef.current = card;
      }
    }

    // Track END_AVAILABLE for UI
    if (result.endAvailable) {
      setConversationEndAvailable(true);
    }

    // Track title from <<END>> tag
    if (result.title) {
      setEarnedTitle(parsedTitleToGameTitle(result.title));
    }

    // Add context message (round 1, centered dimmed)
    if (result.contextText) {
      setMessages(p => {
        const updated = [...p, { id: genId(), role: 'context' as const, content: result.contextText }];
        messagesRef.current = updated; return updated;
      });
    }

    // Show cultural feedback in ALL non-observe modes (guided, practice, challenge)
    // Clean NPC dialogue contamination from feedback (LLM sometimes leaks NPC lines into <<FEEDBACK>>)
    // Skip LLM feedback if client already showed acceptance feedback for this round
    if (currentStage !== 'observe' && result.feedbackText && !acceptanceFeedbackShownRef.current) {
      const cleanedFeedback = cleanFeedbackText(result.feedbackText);
      const filtered = filterLlmOutput(cleanedFeedback);
      if (filtered.text) {
        setMessages(p => {
          const updated = [...p, { id: genId(), role: 'feedback' as const, content: filtered.text }];
          messagesRef.current = updated; return updated;
        });
      }
    }
    // Reset acceptance feedback flag after processing
    acceptanceFeedbackShownRef.current = false;

    // Add NPC message with optional wisdom card — skip if NPC text is empty
    // (LLM may occasionally fail to generate <<NPC>>, which would create a broken empty bubble)
    if (result.npcText && result.npcText.trim()) {
      const filteredNpc = filterLlmOutput(result.npcText);
      const npcMsg: Message = {
        id: genId(), role: 'assistant', content: filteredNpc.text,
        psychologyNote: result.psychologyText || undefined,
        wisdomCard,
      };
      setMessages(p => { const updated = [...p, npcMsg]; messagesRef.current = updated; return updated; });
    }
    setCurrentRound(nextRound);
    currentRoundRef.current = nextRound;

    // Observe mode: add player message, handle isEnd
    if (currentStage === 'observe') {
      if (result.playerText) {
        const playerMsg: Message = {
          id: genId(), role: 'user' as const, content: result.playerText,
          psychologyNote: result.psychologyText || undefined,
        };
        setMessages(p => { const updated = [...p, playerMsg]; messagesRef.current = updated; return updated; });
      }
      if (result.isEnd || nextRound >= OBSERVE_MAX_ROUNDS) {
        setTimeout(() => endGame(result.isEnd ? 'natural_end' : 'max_rounds'), 500);
        return;
      }
      setObserveWaiting(true);
      return;
    }

    // Options — only in guided mode (prevent leaks in other modes)
    if (currentStage === 'guided' && result.options.length > 0) {
      // If LLM generated OPTIONS but no NPC dialogue, warn but still show options.
      // The explicit message-building fix in handleOptionClick should prevent this,
      // but this guard keeps the game playable if it does happen.
      if (!result.npcText || !result.npcText.trim()) {
        console.warn('[processResult] Guided mode: LLM generated OPTIONS without NPC dialogue.');
      }
      setOptions(result.options.map(o => ({ text: o.text, isAcceptance: o.isAcceptance })));
    }

    // Practice/challenge: LLM signalled end → show "End Conversation" button instead of input
    if (result.isEnd && (currentStage === 'practice' || currentStage === 'challenge')) {
      setPracticeEndAvailable(true);
      return;
    }

    // Handle isEnd in guided mode: show "End Conversation" button instead of auto-ending.
    // This lets the player read the NPC's warm closing and end at their own pace,
    // similar to how practice/challenge mode handles conversation end.
    if (result.isEnd && currentStage === 'guided') {
      setConversationEndAvailable(true);
      return;
    }

    // Safety net: guided mode with NPC text but no options → LLM forgot <<OPTIONS>> or <<END>>
    // Show a prominent "End Conversation" button so the player isn't stuck, but let them decide when to end
    if (currentStage === 'guided' && result.options.length === 0 && result.npcText) {
      setConversationEndAvailable(true);
      return;
    }

    if (nextRound >= SAFETY_MAX_ROUNDS) {
      setTimeout(() => endGame('max_rounds'), 500);
    }
  };

  const handleObserveNext = () => {
    if (isLoading || endingRef.current) return;
    const round = currentRoundRef.current;
    if (round >= OBSERVE_MAX_ROUNDS) { endGame('max_rounds'); return; }
    // Use hardcoded script for observe mode; falls back to LLM if no script
    const script = getObserveScript(scenarioId, lang);
    if (script && round < script.rounds.length) {
      playObserveRound(script, round);
      return;
    }
    streamFetch(messagesRef.current, stageRef.current!, round + 1);
  };

  const handleOptionClick = async (option: GameOption) => {
    if (endingRef.current || isLoading) return;
    const userMsg: Message = { id: genId(), role: 'user', content: option.text };

    // Build the updated message list explicitly BEFORE calling streamFetch.
    // This avoids any React batching timing issues where messagesRef.current
    // inside a setState callback might not be read correctly by the async call.
    const updatedMessages = [...messagesRef.current, userMsg];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);
    setOptions([]);

    // Acceptance option → show scenario-specific feedback, then let LLM generate warm closing
    if (option.isAcceptance) {
      acceptanceFeedbackShownRef.current = true;
      const goal = getScenarioGoal(scenarioId);
      const ackFeedback = lang === 'en'
        ? (goal?.acceptanceFeedbackEn || '🦉 You found the rhythm — graceful navigation of Chinese social culture.')
        : (goal?.acceptanceFeedbackZh || '🦉 你找到了节奏——优雅地驾驭了中国社交文化。');

      // Add acceptance feedback immediately so the player sees it right away
      const withFeedback = [
        ...updatedMessages,
        { id: genId(), role: 'feedback' as const, content: ackFeedback },
      ];
      messagesRef.current = withFeedback;
      setMessages(withFeedback);
      setCurrentRound(currentRoundRef.current + 1);
      currentRoundRef.current = currentRoundRef.current + 1;

      // Call LLM to generate NPC's warm closing + END tag
      // LLM will see the [ACCEPT] choice and follow CONVERSATION ENDING rules
      const round = currentRoundRef.current;
      if (round >= SAFETY_MAX_ROUNDS) { setTimeout(() => endGame('accepted'), 1200); return; }
      await streamFetch(messagesRef.current, stageRef.current!, round + 1);
      return;
    }
    const round = currentRoundRef.current;
    if (round >= SAFETY_MAX_ROUNDS) { setTimeout(() => endGame('max_rounds'), 1000); return; }
    await streamFetch(messagesRef.current, stageRef.current!, round + 1);
  };

  /** Detect if a player's free-text message likely represents goal achievement
   *  (accepting the offer, conceding gracefully, etc.) based on the scenario's
   *  interaction pattern and common acceptance language. */
  const detectGoalAchievement = (text: string): boolean => {
    const goal = getScenarioGoal(scenarioId);
    const lower = text.toLowerCase();
    const pattern = goal?.pattern || 'refuse_then_accept';

    switch (pattern) {
      case 'refuse_then_accept':
        // Acceptance: thank, take, accept, gratitude + warmth
        // First check for negation of "accept" to avoid false positives
        // e.g. "can't accept", "won't accept", "don't accept", "not accept"
        if (/\b(?:can'?t|cannot|won'?t|don'?t|not)\s+accept\b/i.test(lower)) {
          return false;
        }
        return /(thank|thanks|take it|accept|收下|拿着|谢谢|xiè|xīnnián|新年|treasure|bless|wish you|happy new)/i.test(lower);
      case 'deflect_and_connect':
        // Deflection + reciprocal warmth achieved
        return /(哪里|nǎlǐ|no.*no|you('re| are).*(kind|nice|beautiful|too)|过奖|夸张|太.*客气)/i.test(lower);
      case 'compete_then_concede':
        // Concession + reciprocation commitment
        return /(next time|下次|i('ll| will).*(pay|treat|get)|my turn|请你|我来)/i.test(lower);
      case 'refuse_indirectly':
        // Indirect refusal achieved
        return /(maybe|perhaps|下次|later|不一定|看情况|不太方便)/i.test(lower);
      default:
        return false;
    }
  };

  const handlePracticeSubmit = async (text: string) => {
    if (endingRef.current || isLoading || !text.trim()) return;
    const userMsg: Message = { id: genId(), role: 'user', content: text.trim() };
    const updatedMessages = [...messagesRef.current, userMsg];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);

    // Client-side goal detection: if the player's text looks like acceptance
    // and the LLM tends to output raw text (no <<END>>), proactively show the
    // end button and let the LLM generate a warm NPC closing in the background.
    if (detectGoalAchievement(text.trim())) {
      const goal = getScenarioGoal(scenarioId);
      const ackFeedback = lang === 'en'
        ? (goal?.acceptanceFeedbackEn || '🦉 You found the rhythm — graceful navigation of Chinese social culture.')
        : (goal?.acceptanceFeedbackZh || '🦉 你找到了节奏——优雅地驾驭了中国社交文化。');
      const withFeedback = [
        ...updatedMessages,
        { id: genId(), role: 'feedback' as const, content: ackFeedback },
      ];
      messagesRef.current = withFeedback;
      setMessages(withFeedback);
      setPracticeEndAvailable(true);
      // Prevent duplicate feedback: LLM's <<FEEDBACK>> should not be shown
      // when client-side acceptance feedback has already been displayed.
      acceptanceFeedbackShownRef.current = true;
    }

    const round = currentRoundRef.current;
    if (round >= SAFETY_MAX_ROUNDS) { setTimeout(() => endGame('max_rounds'), 1000); return; }
    await streamFetch(messagesRef.current, stageRef.current!, round + 1);
  };

  const handleHint = async () => {
    // Request deduplication: increment generation counter so any in-flight
    // request that completes after this one was initiated is ignored.
    const gen = ++hintGenerationRef.current;
    setIsFetchingHint(true); setHintText('');
    try {
      const msgs = messagesRef.current
        .filter(m => m.role !== 'context' && m.role !== 'feedback')
        .map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/hint', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, scenario: scenarioId, lang }),
      });
      // Only apply result if no newer request was made
      if (hintGenerationRef.current !== gen) return;
      if (res.ok) {
        const data = await res.json();
        if (data.hint) {
          setHintText(data.hint);
        } else {
          setHintText(lang === 'en'
            ? 'Consider the rhythm: in Chinese ritual, 2-3 polite refusals before accepting is the sweet spot.'
            : '把握节奏：中式礼仪中，推辞2-3次后接受是最得体的分寸。');
        }
      } else {
        setHintText(lang === 'en'
          ? 'Hint unavailable. As a rule of thumb: refuse twice warmly, then accept with gratitude on the third offer.'
          : '提示暂不可用。记住：温暖地推辞两次，第三次带着感激接受。');
      }
    } catch {
      if (hintGenerationRef.current !== gen) return;
      setHintText(lang === 'en'
        ? 'Hint unavailable. As a rule of thumb: refuse twice warmly, then accept with gratitude on the third offer.'
        : '提示暂不可用。记住：温暖地推辞两次，第三次带着感激接受。');
    } finally {
      if (hintGenerationRef.current === gen) setIsFetchingHint(false);
    }
  };

  const handleEndConversation = () => {
    if (endingRef.current || isLoading) return;
    endGame('user_ended');
  };

  const endGame = async (reason: string) => {
    if (endingRef.current) return;
    endingRef.current = true; setOptions([]); setPracticeEndAvailable(false);
    // Immediately remove beforeunload handler so navigation after game-over is smooth
    if (beforeUnloadHandlerRef.current) {
      window.removeEventListener('beforeunload', beforeUnloadHandlerRef.current);
      beforeUnloadHandlerRef.current = null;
    }
    const st = stageRef.current;

    // Persist progress IMMEDIATELY — before async debrief — so interruption doesn't lose progress
    if (st) completeScenarioStage(scenarioId as ScenarioId, st, { roundsPlayed: currentRoundRef.current, endReason: reason });

    // Non-observe modes: fetch LLM debrief via SSE streaming (progress-driven)
    if (st && st !== 'observe') {
      setIsDebriefing(true);
      setDebriefProgress(1); // Step 1 (thinking) is active immediately
      debriefProgressRef.current = 1;
      let gotTitle = false;
      let gotSummary = false;

      try {
        const msgs = messagesRef.current
          .filter(m => m.role === 'assistant' || m.role === 'user')
          .map(m => ({ role: m.role, content: m.content }));
        const debriefController = new AbortController();
        const debriefTimeout = setTimeout(() => debriefController.abort(), 60000);

        const res = await fetch('/api/debrief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: msgs,
            scenarioId,
            stage: st,
            roundsPlayed: currentRoundRef.current,
            insightsCollected: collectedInsights,
            lang,
          }),
          signal: debriefController.signal,
        });
        clearTimeout(debriefTimeout);

        if (!res.ok || !res.body) {
          console.warn('Debrief API returned', res.status);
          throw new Error('Debrief API failed');
        }

        // Read SSE stream from the response (format: data: {"type":"...","step":N}\n\n)
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (separated by \n\n)
          while (buffer.includes('\n\n')) {
            const idx = buffer.indexOf('\n\n');
            const eventBlock = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);

            for (const line of eventBlock.split('\n')) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const dataStr = trimmed.slice(6);
              if (!dataStr) continue;

              try {
                const parsed = JSON.parse(dataStr);

                if (parsed.type === 'progress' && typeof parsed.step === 'number') {
                  if (parsed.step > debriefProgressRef.current) {
                    debriefProgressRef.current = parsed.step;
                    setDebriefProgress(parsed.step);
                  }
                } else if (parsed.type === 'result') {
                  if (parsed.title && typeof parsed.title === 'string' && parsed.title.trim().length > 2 && !parsed.title.includes('\n')) {
                    setDebriefTitle(parsed.title.trim()); gotTitle = true;
                  }
                  if (parsed.summary && typeof parsed.summary === 'string' && parsed.summary.trim().length >= 60) {
                    setDebriefSummary(parsed.summary.trim()); gotSummary = true;
                  } else if (parsed.summary) {
                    console.warn('Debrief summary too short. Got:', parsed.summary.length, 'chars');
                  }
                  if (parsed.annotations && Array.isArray(parsed.annotations) && parsed.annotations.length > 0) {
                    const validAnnotations: AnnotationItem[] = parsed.annotations.filter(
                      (a: unknown) => a && typeof a === 'object' &&
                        (a as AnnotationItem).type && (a as AnnotationItem).phrase && (a as AnnotationItem).explanation
                    );
                    if (validAnnotations.length > 0) {
                      setDebriefAnnotations(validAnnotations);
                    }
                  }
                } else if (parsed.type === 'error') {
                  console.warn('Debrief stream error:', parsed.error);
                }
              } catch { /* skip unparseable lines */ }
            }
          }
        }
      } catch (err) {
        console.warn('Debrief API failed:', err);
      }

      // Client-side fallback if LLM debrief didn't produce results
      if (!gotTitle || !gotSummary) {
        const fallback = getFallbackTitle(scenarioId, st!, lang);
        if (!gotTitle) setDebriefTitle(fallback.title);
        if (!gotSummary) setDebriefSummary(fallback.summary);
      }

      // Smooth transition: ensure the last visible step completes, then finish
      const isGuidedMode = st === 'guided';
      const finalVisible = isGuidedMode ? 3 : 4;
      const doneStep = isGuidedMode ? 4 : 5;
      if (debriefProgressRef.current < finalVisible) {
        debriefProgressRef.current = finalVisible;
        setDebriefProgress(finalVisible);
        await new Promise(r => setTimeout(r, 500));
      }

      debriefProgressRef.current = doneStep;
      setDebriefProgress(doneStep);
      await new Promise(r => setTimeout(r, 300));
      setIsDebriefing(false);
    }

    setGameOver(true);
  };

  // ─── Observe Mode: Hardcoded Script + Pseudo-Streaming ─────────────

  const playObserveRound = async (script: ObserveScript, roundIndex: number) => {
    if (roundIndex >= script.rounds.length || endingRef.current) return;

    const roundData = script.rounds[roundIndex];
    const roundNum = roundIndex + 1;

    setCurrentRound(roundNum);
    currentRoundRef.current = roundNum;
    setIsLoading(true);
    setIsStreaming(true);
    setObserveWaiting(false);
    setConversationEndAvailable(false);
    setLiveNpc('');
    setLivePlayer('');
    setLiveFeedback('');

    // Simulate "thinking" delay
    setIsThinking(true);
    await delay(600 + Math.random() * 500);
    setIsThinking(false);

    // Stream NPC text in sentence-level chunks
    const npcChunks = chunkForStreaming(roundData.npcText);
    let npcAccum = '';
    for (const chunk of npcChunks) {
      npcAccum += chunk;
      setLiveNpc(npcAccum);
      liveNpcRef.current = npcAccum;
      await delay(40 + Math.random() * 35);
    }

    // Brief beat between speakers
    await delay(300);

    // Stream Player text in chunks
    const playerChunks = chunkForStreaming(roundData.playerText);
    let playerAccum = '';
    for (const chunk of playerChunks) {
      playerAccum += chunk;
      setLivePlayer(playerAccum);
      await delay(35 + Math.random() * 30);
    }

    // Finalise — clear live state
    setIsStreaming(false);
    setLiveNpc('');
    setLivePlayer('');

    // Look up wisdom card
    let wisdomCard: AuntieWisdom | undefined;
    if (roundData.wisdomId) {
      const card = getInsightById(roundData.wisdomId);
      if (card) {
        wisdomCard = card;
        pendingWisdomRef.current = card;
      }
    }

    // Build messages for this round
    const newMsgs: Message[] = [];
    if (roundData.contextText) {
      newMsgs.push({ id: genId(), role: 'context', content: roundData.contextText });
    }
    // NPC message: carries NPC thoughts + cultural subtext + wisdom card
    newMsgs.push({
      id: genId(),
      role: 'assistant',
      content: roundData.npcText,
      npcThoughts: roundData.npcThoughts,
      culturalSubtext: roundData.culturalSubtext,
      wisdomCard,
    });
    // Player message: carries Player thoughts only
    newMsgs.push({
      id: genId(),
      role: 'user',
      content: roundData.playerText,
      playerThoughts: roundData.playerThoughts,
    });

    setMessages(p => {
      const updated = [...p, ...newMsgs];
      messagesRef.current = updated;
      return updated;
    });

    if (roundData.endAvailable) {
      setConversationEndAvailable(true);
    }

    setIsLoading(false);

    // All rounds (including last): wait for user action
    // Last round shows amber "End Conversation" button via conversationEndAvailable
    setObserveWaiting(true);
  };

  // ─── UI helpers ────────────────────────────────────────────────────

  const togglePsychology = useCallback((msgId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId); else next.add(msgId);
      return next;
    });
  }, []);

  const toggleCultural = useCallback((msgId: string) => {
    setExpandedCultural(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId); else next.add(msgId);
      return next;
    });
  }, []);

  // Wisdom popup
  const showWisdomPopup = useCallback((card: AuntieWisdom) => {
    setPendingWisdom(card);
  }, []);

  const handleCollectWisdom = () => {
    if (!pendingWisdom) return;
    collectInsight(scenarioId as ScenarioId, pendingWisdom.id);
    setCollectedInsights([...collectedInsights, pendingWisdom.id]);
    setPendingWisdom(null);
  };

  // --- Render ---
  if (!scenario) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-400">Scenario not found</p>
          <button onClick={() => router.push('/game')} className="mt-4 text-amber-600 underline">Back to Journey</button>
        </div>
      </div>
    );
  }

  if (!stage) {
    const progress = clientProgress || { completedStages: [] as LearningStage[], bestPerformance: null, insightsCollected: [], lastPlayedAt: null };
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="flex justify-end"><LanguageToggle lang={lang} onToggle={setLang} /></div>
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center space-y-4">
            <span className="text-5xl block">{scenario.icon}</span>
            <h1 className="text-2xl font-bold text-stone-900">{lang === 'en' ? scenario.titleEn : scenario.titleZh}</h1>
            <p className="text-sm text-stone-400">{lang === 'en' ? scenario.subtitleEn : scenario.subtitleZh}</p>
            <p className="text-sm text-stone-500 leading-relaxed">{lang === 'en' ? scenario.descriptionEn : scenario.descriptionZh}</p>
          </div>
          <StageSelector completedStages={progress.completedStages} onSelect={startGame} lang={lang} />
          <button onClick={() => router.push('/game')} className="w-full py-2 text-stone-400 hover:text-stone-600 text-sm">← {lang === 'en' ? 'Back' : '返回'}</button>
        </div>
      </div>
    );
  }

  if (isDebriefing) {
    const isGuided = stage === 'guided';
    const progressSteps = isGuided
      ? [
          { step: 1, key: 'loadingStep1' as const, icon: '🤔' },
          { step: 2, key: 'loadingStep2' as const, icon: '🏆' },
          { step: 3, key: 'loadingStep3' as const, icon: '📝' },
        ]
      : [
          { step: 1, key: 'loadingStep1' as const, icon: '🤔' },
          { step: 2, key: 'loadingStep2' as const, icon: '🏆' },
          { step: 3, key: 'loadingStep3' as const, icon: '📝' },
          { step: 4, key: 'loadingStep4' as const, icon: '✨' },
        ];
    const maxSteps = isGuided ? 4 : 5; // guided: 3 visible steps + 1 transition
    const progressPct = Math.min(100, Math.round((debriefProgress / maxSteps) * 100));

    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="max-w-sm w-full px-6 space-y-6">
          {/* Owl animation */}
          <div className="text-center">
            <div className="relative inline-block">
              <span className="text-5xl block animate-bounce">🦉</span>
              {debriefProgress < maxSteps && (
                <span className="absolute -top-1 -right-1 text-lg animate-ping">✨</span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Step indicators */}
            <div className="space-y-2">
              {progressSteps.map(({ step, key, icon }) => {
                const isActive = debriefProgress >= step;
                const isCurrent = debriefProgress === step;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      isActive ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    <span className={`text-lg transition-transform duration-300 ${
                      isCurrent ? 'scale-125 animate-bounce' : ''
                    }`}>
                      {icon}
                    </span>
                    <span className={`text-sm transition-colors duration-300 ${
                      isActive ? 'text-stone-700 font-medium' : 'text-stone-400'
                    }`}>
                      {t(`debrief.${key}`, lang)}
                    </span>
                    {isActive && debriefProgress > step && step < maxSteps && (
                      <span className="text-green-500 text-xs">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current action hint */}
          <p className="text-center text-xs text-stone-400 animate-pulse">
            {debriefProgress < maxSteps
              ? (lang === 'en' ? 'Auntie is working on it... ☕' : '阿姨正在用心准备中…… ☕')
              : (lang === 'en' ? 'Almost ready! ✨' : '马上就好！ ✨')}
          </p>
        </div>
      </div>
    );
  }

  if (gameOver) {
    const nextSt = stage;
    return (
      <DebriefPanel
        scenarioId={scenarioId} stage={nextSt!} roundsPlayed={currentRound}
        insightsCollected={collectedInsights} earnedTitle={earnedTitle}
        messages={messages}
        debriefTitle={debriefTitle}
        debriefSummary={debriefSummary}
        annotations={debriefAnnotations}
        onNextStage={() => { gameInitRef.current = false; endingRef.current = false; setStage(null); setGameOver(false); setMessages([]); setOptions([]); setCurrentRound(0); setCollectedInsights([]); setObserveWaiting(false); setConversationEndAvailable(false); setPracticeEndAvailable(false); setHintText(''); setLiveNpc(''); setLivePlayer(''); setLiveFeedback(''); setPendingWisdom(null); setEarnedTitle(null); setDebriefTitle(null); setDebriefSummary(''); setDebriefAnnotations([]); setDebriefProgress(0); setIsDebriefing(false); setIsStreaming(false); setIsThinking(false); setStreamError(false); setClientProgress(getScenarioProgress(scenarioId as ScenarioId)); }}
        onReplay={() => { gameInitRef.current = false; endingRef.current = false; setStage(nextSt); setGameOver(false); setMessages([]); setOptions([]); setCurrentRound(0); setCollectedInsights([]); setObserveWaiting(false); setConversationEndAvailable(false); setPracticeEndAvailable(false); setHintText(''); setLiveNpc(''); setLivePlayer(''); setLiveFeedback(''); setPendingWisdom(null); setEarnedTitle(null); setDebriefTitle(null); setDebriefSummary(''); setDebriefAnnotations([]); setDebriefProgress(0); setIsDebriefing(false); setIsStreaming(false); setIsThinking(false); setStreamError(false); startGame(nextSt!); }}
        lang={lang}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-stone-100">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{scenario.npcAvatar}</span>
            <div>
              <div className="font-medium text-stone-900 text-sm">{lang === 'en' ? scenario.npcRoleEn : scenario.npcRoleZh}</div>
              <div className="text-xs text-stone-400">{lang === 'en' ? scenario.settingEn : scenario.settingZh}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-300">{t('common.round', lang)} {currentRound}</span>
            <LanguageToggle lang={lang} onToggle={setLang} />
          </div>
        </div>
        <LearningStageIndicator currentStage={stage} completedStages={clientProgress?.completedStages || []} lang={lang} />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {multiTabWarning && (
          <div className="flex justify-center mb-3">
            <div className="max-w-[85%] px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span className="font-medium">
                  {lang === 'en'
                    ? 'This game is open in another tab. Playing in multiple tabs may cause unexpected behavior.'
                    : '此游戏已在另一个标签页中打开。在多个标签页中同时游戏可能会导致意外行为。'}
                </span>
              </div>
            </div>
          </div>
        )}
        {storageWarning && (
          <div className="flex justify-center mb-3">
            <div className="max-w-[85%] px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
              <div className="flex items-center gap-2">
                <span>💾</span>
                <span className="font-medium">
                  {lang === 'en'
                    ? 'Your browser does not support saving progress. Game progress will be lost when you close this page.'
                    : '您的浏览器不支持保存进度。关闭页面后游戏进度将丢失。'}
                </span>
              </div>
            </div>
          </div>
        )}
        {messages.map(m => {
          if (m.role === 'context') {
            return <ChatBubble key={m.id} content={m.content} isUser={false} isContext />;
          }
          if (m.role === 'feedback') {
            return (
              <div key={m.id} className="flex justify-center mb-3">
                <div className="max-w-[85%] px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-stone-600 leading-relaxed">
                  <div className="flex items-center gap-2 mb-1">
                    <span>🦉</span>
                    <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                      {lang === 'en' ? 'Feedback' : '反馈'}
                    </span>
                  </div>
                  {m.content}
                </div>
              </div>
            );
          }
          return (
            <ChatBubble
              key={m.id}
              content={m.content}
              isUser={m.role === 'user'}
              avatar={m.role === 'assistant' ? scenario.npcAvatar : undefined}
              wisdomIcon={m.wisdomCard ? '🦉' : undefined}
              onWisdomClick={m.wisdomCard ? () => showWisdomPopup(m.wisdomCard!) : undefined}
            >
              {/* Observe mode: per-role thoughts + cultural subtext */}
              {isObserve && m.role === 'assistant' && (m.npcThoughts || m.psychologyNote) && (
                <PsychologyNote
                  text={m.npcThoughts || m.psychologyNote || ''}
                  isExpanded={expandedNotes.has(m.id)}
                  onToggle={() => togglePsychology(m.id)}
                  labelEn="What was she thinking?"
                  labelZh="她当时在想什么？"
                  hideEn="Hide"
                  hideZh="收起"
                  lang={lang}
                />
              )}
              {isObserve && m.role === 'assistant' && m.culturalSubtext && (
                <div className="mt-1">
                  <button
                    onClick={() => toggleCultural(m.id)}
                    className={`text-xs flex items-center gap-1 transition-colors ${
                      expandedCultural.has(m.id)
                        ? 'text-amber-600 hover:text-amber-700'
                        : 'text-amber-500 hover:text-amber-600'
                    }`}
                  >
                    <span>{expandedCultural.has(m.id) ? '📖' : '📕'}</span>
                    <span>
                      {expandedCultural.has(m.id)
                        ? (lang === 'en' ? 'Hide subtext' : '收起潜台词')
                        : (lang === 'en' ? 'Cultural subtext' : '文化潜台词')}
                    </span>
                  </button>
                  {expandedCultural.has(m.id) && (
                    <div className="mt-2 pl-4 border-l-2 border-amber-300 text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">
                      {m.culturalSubtext}
                    </div>
                  )}
                </div>
              )}
              {isObserve && m.role === 'user' && (m.playerThoughts || m.psychologyNote) && (
                <PsychologyNote
                  text={m.playerThoughts || m.psychologyNote || ''}
                  isExpanded={expandedNotes.has(m.id)}
                  onToggle={() => togglePsychology(m.id)}
                  labelEn="What were you thinking?"
                  labelZh="你当时在想什么？"
                  hideEn="Hide"
                  hideZh="收起"
                  lang={lang}
                />
              )}
            </ChatBubble>
          );
        })}

        {/* Live streaming display */}
        {isThinking && (
          <div className="flex items-center justify-center gap-2 py-3 text-amber-600 animate-pulse">
            <span className="text-lg">🤔</span>
            <span className="text-sm font-medium">
              {lang === 'en' ? 'Thinking deeply about the options...' : '正在深入思考选项...'}
            </span>
          </div>
        )}
        {isStreaming && liveFeedback && (
          <div className="flex justify-center mb-3">
            <div className="max-w-[85%] px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-stone-600 leading-relaxed">
              <div className="flex items-center gap-2 mb-1">
                <span>🦉</span>
                <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                  {lang === 'en' ? 'Feedback' : '反馈'}
                </span>
              </div>
              {liveFeedback}▌
            </div>
          </div>
        )}
        {isStreaming && liveNpc && <ChatBubble content={liveNpc + '▌'} isUser={false} avatar={scenario.npcAvatar} />}
        {isStreaming && livePlayer && <ChatBubble content={livePlayer} isUser={true} />}
        {isStreaming && !isThinking && !liveNpc && <div className="text-center text-stone-400 text-sm animate-pulse py-2">{scenario.npcAvatar} {t('common.typing', lang)}</div>}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom bar: text input for practice mode */}
      {!isObserve && (isPractice || isChallenge) && !gameOver && !isLoading && messages.length > 0 && !practiceEndAvailable && (
        <div className="bg-white border-t border-stone-200 p-4 pb-8">
          <div className="max-w-lg mx-auto space-y-2">
            {/* Hint button — practice mode only */}
            {isPractice && (
              <div>
                <button
                  onClick={handleHint}
                  disabled={isFetchingHint}
                  className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-40"
                >
                  <span>💡</span>
                  <span>{isFetchingHint
                    ? (lang === 'en' ? 'Thinking...' : '思考中...')
                    : (lang === 'en' ? 'Get a hint' : '获取提示')}</span>
                </button>
                {hintText && (
                  <p className="mt-1.5 text-xs text-stone-500 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
                    {hintText}
                  </p>
                )}
              </div>
            )}
            <FillInInput
              placeholder={lang === 'en' ? 'Type your response...' : '输入你的回应...'}
              disabled={isLoading}
              onSubmit={handlePracticeSubmit}
              fimPrompt={fimPrompt}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* Practice/challenge: LLM signalled conversation end → End button replaces input */}
      {!isObserve && (isPractice || isChallenge) && practiceEndAvailable && !gameOver && !isLoading && (
        <div className="bg-white border-t border-stone-200 p-4 pb-8">
          <div className="max-w-lg mx-auto space-y-3">
            <p className="text-center text-amber-600 font-medium text-sm">
              {lang === 'en'
                ? '✨ The conversation has naturally concluded.'
                : '✨ 对话已自然结束。'}
            </p>
            <button
              onClick={handleEndConversation}
              className="w-full py-3.5 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
            >
              {lang === 'en' ? '🛑 Stop & See Review' : '🛑 停止对话并查看复盘'}
            </button>
          </div>
        </div>
      )}
      {!isObserve && (isPractice || isChallenge) && practiceEndAvailable && !gameOver && isLoading && (
        <div className="bg-white border-t border-stone-200 p-4 pb-8">
          <div className="max-w-lg mx-auto text-center text-stone-400 text-sm">
            {lang === 'en' ? 'Ending conversation...' : '正在结束对话...'}
          </div>
        </div>
      )}

      {/* Bottom bar: options for guided only */}
      {!isObserve && isGuided && options.length > 0 && !gameOver && (
        <div className="bg-white border-t border-stone-200 p-4 pb-8">
          <div className="space-y-2 max-w-lg mx-auto">
            {options.map((opt, i) => (
              <ChoiceButton key={`o_${i}`} text={opt.text} onClick={() => handleOptionClick(opt)} disabled={isLoading} />
            ))}
          </div>
        </div>
      )}

      {isObserve && observeWaiting && !gameOver && (
        <div className="bg-white border-t border-stone-200 p-4 pb-8">
          <div className="max-w-lg mx-auto space-y-2">
            {conversationEndAvailable && (
              <p className="text-center text-amber-600 font-medium text-sm">
                {lang === 'en' ? '✨ The conversation feels complete...' : '✨ 对话已经差不多了...'}
              </p>
            )}
            <button
              onClick={conversationEndAvailable ? handleEndConversation : handleObserveNext}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-medium transition-colors disabled:opacity-40 ${
                conversationEndAvailable
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
                  : 'bg-stone-800 text-white hover:bg-stone-700'
              }`}
            >
              {conversationEndAvailable
                ? (lang === 'en' ? '🛑 Stop & See Review' : '🛑 停止对话并查看复盘')
                : t('common.continue', lang)}
            </button>
            {!conversationEndAvailable && (
              <button
                onClick={handleEndConversation}
                className="w-full py-2 text-stone-400 hover:text-stone-500 text-sm transition-colors"
              >
                {lang === 'en' ? 'End Conversation Early' : '提前结束对话'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Subtle end button for non-observe modes — only when no prominent end signal is active */}
      {!isObserve && !gameOver && !isLoading && messages.length > 0 && !practiceEndAvailable && options.length === 0 && (
        <div className="bg-white border-t border-stone-200 p-2">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleEndConversation}
              className={`w-full py-2 rounded-xl text-sm transition-colors ${
                conversationEndAvailable
                  ? 'bg-amber-500 text-white hover:bg-amber-600 font-medium py-3'
                  : 'text-stone-400 hover:text-stone-500'
              }`}
            >
              {conversationEndAvailable
                ? (lang === 'en' ? 'End Conversation →' : '结束对话 →')
                : (lang === 'en' ? 'End Conversation Early' : '提前结束对话')}
            </button>
          </div>
        </div>
      )}

      {/* Network error */}
      {streamError && !gameOver && (
        <div className="bg-white border-t border-amber-200 p-4 pb-8">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-amber-600 text-sm mb-3">
              {lang === 'en'
                ? 'Auntie had a little trouble connecting just now, but she left you with a warm goodbye above. You can end the conversation or try reconnecting.'
                : '阿姨刚才有点连不上，但她在上面留了温暖的告别。你可以结束对话或尝试重新连接。'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => streamFetch(messagesRef.current, stageRef.current!, currentRoundRef.current)}
                className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors text-sm"
              >
                {lang === 'en' ? 'Retry' : '重试'}
              </button>
              <button
                onClick={handleEndConversation}
                className="px-6 py-2.5 bg-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-300 transition-colors text-sm"
              >
                {t('endConversation.button', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wisdom popup (same as before) */}
      {pendingWisdom && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl animate-card-flip">
            <span className="text-4xl block mb-3">{pendingWisdom.icon}</span>
            <p className="text-amber-600 text-xs font-medium mb-1">{t('wisdom.found', lang)}</p>
            <h3 className="text-xl font-bold text-stone-900 mb-2">{lang === 'en' ? pendingWisdom.titleEn : pendingWisdom.titleZh}</h3>
            <p className="text-sm text-stone-500 mb-4">{lang === 'en' ? pendingWisdom.textEn : pendingWisdom.textZh}</p>
            <div className="flex gap-2">
              <button onClick={handleCollectWisdom} className="flex-1 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none">{t('wisdom.collect', lang)}</button>
              <button onClick={() => { setPendingWisdom(null); pendingWisdomRef.current = null; }} className="px-4 py-3 text-stone-400 hover:text-stone-600 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none" aria-label={lang === 'en' ? 'Dismiss' : '关闭'}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GameScenarioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="text-stone-400">{t('common.loading', 'en')}</div></div>}>
      <GameContent />
    </Suspense>
  );
}
