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

interface GameOption {
  text: string;
  isAcceptance: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'context' | 'feedback';
  content: string;
  psychologyNote?: string;
  wisdomCard?: AuntieWisdom;
}

function genId(): string { return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }

const SAFETY_MAX_ROUNDS = 20;

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

  // Streaming state
  const [liveNpc, setLiveNpc] = useState('');
  const [livePlayer, setLivePlayer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const liveNpcRef = useRef('');

  const [streamError, setStreamError] = useState(false);
  const [earnedTitle, setEarnedTitle] = useState<GameTitle | null>(null);
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

  // Warn before leaving mid-game + cleanup abort on unmount
  useEffect(() => {
    if (!stage || gameOver) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      abortRef.current?.abort();
    };
  }, [stage, gameOver]);

  const startGame = (s: LearningStage) => {
    if (gameInitRef.current) return;
    gameInitRef.current = true;
    setStage(s); stageRef.current = s;
    setIsLoading(true);
    streamFetch([], s, 1);
  };

  const streamFetch = async (history: Message[], currentStage: LearningStage, nextRound: number, attempt = 0) => {
    if (endingRef.current) return;
    abortRef.current?.abort();
    currentRoundRef.current = nextRound;
    setIsLoading(true); setObserveWaiting(false); setStreamError(false); setHintText('');
    setConversationEndAvailable(false);
    setLiveNpc(''); setLivePlayer('');
    setIsStreaming(true); setIsThinking(false);

    const controller = new AbortController(); abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const startPrompt = lang === 'en' ? scenario?.startPromptEn : scenario?.startPromptZh;
      let msgsToSend: Array<{ role: string; content: string }>;
      if (history.length === 0) {
        msgsToSend = [{ role: 'user', content: startPrompt }];
      } else if (currentStage === 'observe') {
        msgsToSend = history.filter(m => m.role === 'assistant').map(m => ({ role: m.role, content: m.content }));
      } else {
        msgsToSend = history.filter(m => m.role !== 'context').map(m => ({ role: m.role, content: m.content }));
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

    // Add NPC message with optional wisdom card
    const npcMsg: Message = {
      id: genId(), role: 'assistant', content: result.npcText,
      psychologyNote: result.psychologyText || undefined,
      wisdomCard,
    };
    setMessages(p => { const updated = [...p, npcMsg]; messagesRef.current = updated; return updated; });
    setCurrentRound(nextRound);
    currentRoundRef.current = nextRound;

    // Guided mode: show cultural feedback after player's choice
    if (result.feedbackText) {
      setMessages(p => {
        const updated = [...p, { id: genId(), role: 'feedback' as const, content: result.feedbackText }];
        messagesRef.current = updated; return updated;
      });
    }

    // Observe mode: add player message, handle isEnd
    if (currentStage === 'observe') {
      if (result.playerText) {
        const playerMsg: Message = {
          id: genId(), role: 'user' as const, content: result.playerText,
          psychologyNote: result.psychologyText || undefined,
        };
        setMessages(p => { const updated = [...p, playerMsg]; messagesRef.current = updated; return updated; });
      }
      if (result.isEnd || nextRound >= SAFETY_MAX_ROUNDS) {
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

    // Handle isEnd in non-observe modes
    if (result.isEnd) {
      setTimeout(() => endGame('natural_end'), 500);
      return;
    }

    if (nextRound >= SAFETY_MAX_ROUNDS) {
      setTimeout(() => endGame('max_rounds'), 500);
    }
  };

  const handleObserveNext = () => {
    if (isLoading || endingRef.current) return;
    const round = currentRoundRef.current;
    if (round >= SAFETY_MAX_ROUNDS) { endGame('max_rounds'); return; }
    streamFetch(messagesRef.current, stageRef.current!, round + 1);
  };

  const handleOptionClick = async (option: GameOption) => {
    if (endingRef.current || isLoading) return;
    const userMsg: Message = { id: genId(), role: 'user', content: option.text };
    setMessages(p => { const updated = [...p, userMsg]; messagesRef.current = updated; return updated; });
    setOptions([]);
    // Acceptance option → immediately end, no API call
    if (option.isAcceptance) {
      setTimeout(() => endGame('accepted'), 600);
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
      const msgs = messagesRef.current.filter(m => m.role !== 'context').map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/hint', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, scenario: scenarioId, lang }),
      });
      if (res.ok) {
        const data = await res.json();
        setHintText(data.hint || '');
      }
    } catch { /* ignore */ }
    finally { setIsFetchingHint(false); }
  };

  const handleEndConversation = () => {
    if (endingRef.current || isLoading) return;
    endGame('user_ended');
  };

  const endGame = (reason: string) => {
    if (endingRef.current) return;
    endingRef.current = true; setOptions([]);
    const st = stageRef.current;
    if (st) completeScenarioStage(scenarioId as ScenarioId, st, { roundsPlayed: currentRoundRef.current, endReason: reason });
    setGameOver(true);
  };

  const togglePsychology = (msgId: string) => {
    setExpandedNotes(prev => {
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
    const progress = getScenarioProgress(scenarioId as ScenarioId);
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

  if (gameOver) {
    const nextSt = stage;
    return (
      <DebriefPanel
        scenarioId={scenarioId} stage={nextSt!} roundsPlayed={currentRound}
        insightsCollected={collectedInsights} earnedTitle={earnedTitle}
        onNextStage={() => { gameInitRef.current = false; endingRef.current = false; setStage(null); setGameOver(false); setMessages([]); setOptions([]); setCurrentRound(0); setCollectedInsights([]); setObserveWaiting(false); setConversationEndAvailable(false); setHintText(''); setLiveNpc(''); setLivePlayer(''); setPendingWisdom(null); setEarnedTitle(null); setIsStreaming(false); setIsThinking(false); setStreamError(false); }}
        onReplay={() => { gameInitRef.current = false; endingRef.current = false; setStage(nextSt); setGameOver(false); setMessages([]); setOptions([]); setCurrentRound(0); setCollectedInsights([]); setObserveWaiting(false); setConversationEndAvailable(false); setHintText(''); setLiveNpc(''); setLivePlayer(''); setPendingWisdom(null); setEarnedTitle(null); setIsStreaming(false); setIsThinking(false); setStreamError(false); startGame(nextSt!); }}
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
        <LearningStageIndicator currentStage={stage} completedStages={getScenarioProgress(scenarioId as ScenarioId).completedStages} lang={lang} />
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
                      {lang === 'en' ? 'Cultural Insight' : '文化洞察'}
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
              {/* Psychology note for observe mode */}
              {isObserve && m.psychologyNote && (
                <PsychologyNote
                  text={m.psychologyNote}
                  isExpanded={expandedNotes.has(m.id)}
                  onToggle={() => togglePsychology(m.id)}
                  labelEn="What were they thinking?"
                  labelZh="角色在想什么？"
                  hideEn="Hide thoughts"
                  hideZh="收起想法"
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
        {isStreaming && liveNpc && <ChatBubble content={liveNpc + '▌'} isUser={false} avatar={scenario.npcAvatar} />}
        {isStreaming && livePlayer && <ChatBubble content={livePlayer} isUser={true} />}
        {isStreaming && !isThinking && !liveNpc && <div className="text-center text-stone-400 text-sm animate-pulse py-2">{scenario.npcAvatar} {t('common.typing', lang)}</div>}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom bar: text input for practice mode */}
      {!isObserve && (isPractice || isChallenge) && !gameOver && !isLoading && messages.length > 0 && (
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
              <p className="text-center text-xs text-amber-600 font-medium">
                {lang === 'en' ? 'The conversation feels complete...' : '对话已经差不多了...'}
              </p>
            )}
            <button
              onClick={conversationEndAvailable ? handleEndConversation : handleObserveNext}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-medium transition-colors disabled:opacity-40 ${
                conversationEndAvailable
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-stone-800 text-white hover:bg-stone-700'
              }`}
            >
              {conversationEndAvailable
                ? (lang === 'en' ? 'End Conversation →' : '结束对话 →')
                : t('common.continue', lang)}
            </button>
            {!conversationEndAvailable && (
              <button
                onClick={handleEndConversation}
                className="w-full py-2 text-stone-400 hover:text-stone-500 text-sm transition-colors"
              >
                {lang === 'en' ? 'End Conversation' : '结束对话'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* End button for non-observe modes */}
      {!isObserve && !gameOver && !isLoading && messages.length > 0 && (
        <div className="bg-white border-t border-stone-200 p-2">
          <div className="max-w-lg mx-auto">
            {conversationEndAvailable && (
              <p className="text-center text-xs text-amber-600 font-medium mb-2">
                {lang === 'en' ? 'The conversation feels complete...' : '对话已经差不多了...'}
              </p>
            )}
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
                : (lang === 'en' ? 'End Conversation' : '结束对话')}
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
