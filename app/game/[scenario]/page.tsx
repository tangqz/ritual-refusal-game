'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
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
import { getScenarioProgress, completeScenarioStage, collectInsight } from '@/lib/game-progress-store';
import { getInsightById } from '@/lib/cultural-insights';
import type { AuntieWisdom } from '@/lib/cultural-insights';
import { StreamParser, type ParsedSections } from '@/lib/stream-parser';
import type { GameTitle } from '@/lib/game-titles';
import { parsedTitleToGameTitle } from '@/lib/game-titles';
import { getObserveScript, chunkForStreaming, type ObserveScript } from '@/lib/observe-script';
import { getScenarioGoal } from '@/lib/scenario-goals';
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

  const isObserve = stage === 'observe';
  const isGuided = stage === 'guided';
  const isPractice = stage === 'practice';
  const isChallenge = stage === 'challenge';

  // Build FIM prompt context for practice mode
  const getFimPrompt = (): string => {
    const scenarioTitle = lang === 'en' ? scenario?.titleEn : scenario?.titleZh;
    const scenarioSetting = lang === 'en' ? scenario?.settingEn : scenario?.settingZh;
    const npcRole = lang === 'en' ? scenario?.npcRoleEn : scenario?.npcRoleZh;
    // Last few messages as context
    const recentMsgs = messagesRef.current.slice(-6).map(m => {
      const role = m.role === 'assistant' ? npcRole : (m.role === 'user' ? 'You' : '');
      return role ? `${role}: ${m.content}` : '';
    }).filter(Boolean).join('\n');
    return `[Scene: ${scenarioSetting}]\n[Your role: A Chinese adoptee learning social norms]\n[NPC: ${npcRole}]\n\n${recentMsgs}\nYou:`;
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, options, observeWaiting, liveNpc, livePlayer]);

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
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        if ((res.status >= 500 || res.status === 429) && attempt < 2) {
          setIsStreaming(false);
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          return streamFetch(history, currentStage, nextRound, attempt + 1);
        }
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setMessages(p => [...p, { id: genId(), role: 'assistant', content: `${err.error || 'Error'}` }]);
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

      processResult(result, currentStage, nextRound, history);
    } catch (e) {
      clearTimeout(timeoutId);
      if (attempt < 2) {
        setIsStreaming(false);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        return streamFetch(history, currentStage, nextRound, attempt + 1);
      }
      setMessages(p => [...p, { id: genId(), role: 'assistant', content: t('common.networkError', lang) }]);
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
    if (currentStage !== 'observe' && result.feedbackText) {
      const cleanedFeedback = cleanFeedbackText(result.feedbackText);
      if (cleanedFeedback) {
        setMessages(p => {
          const updated = [...p, { id: genId(), role: 'feedback' as const, content: cleanedFeedback }];
          messagesRef.current = updated; return updated;
        });
      }
    }

    // Add NPC message with optional wisdom card
    const npcMsg: Message = {
      id: genId(), role: 'assistant', content: result.npcText,
      psychologyNote: result.psychologyText || undefined,
      wisdomCard,
    };
    setMessages(p => { const updated = [...p, npcMsg]; messagesRef.current = updated; return updated; });
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
      setOptions(result.options.map(o => ({ text: o.text, isAcceptance: o.isAcceptance })));
    }

    // Practice/challenge: LLM signalled end → show "End Conversation" button instead of input
    if (result.isEnd && (currentStage === 'practice' || currentStage === 'challenge')) {
      setPracticeEndAvailable(true);
      return;
    }

    // Handle isEnd in guided mode
    if (result.isEnd && currentStage === 'guided') {
      setTimeout(() => endGame('natural_end'), 500);
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
    setMessages(p => { const updated = [...p, userMsg]; messagesRef.current = updated; return updated; });
    setOptions([]);
    // Acceptance option → show scenario-specific feedback then continue to NPC's closing
    if (option.isAcceptance) {
      const goal = getScenarioGoal(scenarioId);
      const ackFeedback = lang === 'en'
        ? (goal?.acceptanceFeedbackEn || '🦉 You found the rhythm — graceful navigation of Chinese social culture.')
        : (goal?.acceptanceFeedbackZh || '🦉 你找到了节奏——优雅地驾驭了中国社交文化。');
      setMessages(p => {
        const updated = [...p, { id: genId(), role: 'feedback' as const, content: ackFeedback }];
        messagesRef.current = updated; return updated;
      });
      // Continue to next round so NPC can give warm closing — then LLM ends with <<END>>
      const round = currentRoundRef.current;
      if (round >= SAFETY_MAX_ROUNDS) { setTimeout(() => endGame('accepted'), 1200); return; }
      await streamFetch(messagesRef.current, stageRef.current!, round + 1);
      return;
    }
    const round = currentRoundRef.current;
    if (round >= SAFETY_MAX_ROUNDS) { setTimeout(() => endGame('max_rounds'), 1000); return; }
    await streamFetch(messagesRef.current, stageRef.current!, round + 1);
  };

  const handlePracticeSubmit = async (text: string) => {
    if (endingRef.current || isLoading || !text.trim()) return;
    const userMsg: Message = { id: genId(), role: 'user', content: text.trim() };
    setMessages(p => { const updated = [...p, userMsg]; messagesRef.current = updated; return updated; });
    const round = currentRoundRef.current;
    if (round >= SAFETY_MAX_ROUNDS) { setTimeout(() => endGame('max_rounds'), 1000); return; }
    await streamFetch(messagesRef.current, stageRef.current!, round + 1);
  };

  const handleHint = async () => {
    if (isFetchingHint) return;
    setIsFetchingHint(true); setHintText('');
    try {
      const msgs = messagesRef.current
        .filter(m => m.role !== 'context' && m.role !== 'feedback')
        .map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/hint', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, scenario: scenarioId, lang }),
      });
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
      setHintText(lang === 'en'
        ? 'Hint unavailable. As a rule of thumb: refuse twice warmly, then accept with gratitude on the third offer.'
        : '提示暂不可用。记住：温暖地推辞两次，第三次带着感激接受。');
    } finally {
      setIsFetchingHint(false);
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

  const togglePsychology = (msgId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId); else next.add(msgId);
      return next;
    });
  };

  const toggleCultural = (msgId: string) => {
    setExpandedCultural(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId); else next.add(msgId);
      return next;
    });
  };

  // Wisdom popup
  const showWisdomPopup = (card: AuntieWisdom) => {
    setPendingWisdom(card);
  };

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
        messages={messagesRef.current}
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
              fimPrompt={getFimPrompt()}
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
        <div className="bg-white border-t border-rose-200 p-4 pb-8">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-rose-500 text-sm mb-3">{t('common.networkError', lang)}</p>
            <button
              onClick={() => streamFetch(messagesRef.current, stageRef.current!, currentRoundRef.current)}
              className="px-6 py-2.5 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors text-sm"
            >
              {lang === 'en' ? 'Retry' : '重试'}
            </button>
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
              <button onClick={handleCollectWisdom} className="flex-1 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700">{t('wisdom.collect', lang)}</button>
              <button onClick={() => { setPendingWisdom(null); pendingWisdomRef.current = null; }} className="px-4 py-3 text-stone-400 hover:text-stone-600">✕</button>
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
