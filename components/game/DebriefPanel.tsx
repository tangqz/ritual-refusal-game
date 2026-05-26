'use client';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import type { LearningStage } from '@/lib/scenario-config';
import { SCENARIOS } from '@/lib/scenario-config';
import type { Language } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { getNextStage, STAGES } from '@/lib/learning-progression';
import type { GameTitle } from '@/lib/game-titles';
import type { AnnotationItem } from '@/app/api/debrief/route';

interface Message {
  role: string;
  content: string;
}

interface DebriefPanelProps {
  scenarioId: string;
  stage: LearningStage;
  roundsPlayed: number;
  insightsCollected: string[];
  earnedTitle: GameTitle | null;
  messages: Message[];
  debriefTitle: string | null;
  debriefSummary: string;
  annotations: AnnotationItem[];
  onNextStage: () => void;
  onReplay: () => void;
  lang: Language;
}

/** Highlight user message text with annotation markers.
 *  Falls back to showing unmatched annotations as notes below. */
function HighlightedText({ text, annotations, msgIndex, lang }: {
  text: string;
  annotations: AnnotationItem[];
  msgIndex: number;
  lang: Language;
}) {
  const msgAnnotations = annotations.filter(a => a.userMsgIndex === msgIndex);
  if (msgAnnotations.length === 0) return <span>{text}</span>;

  interface Segment {
    start: number;
    end: number;
    type: 'good' | 'improve';
    explanation: string;
  }

  const segments: Segment[] = [];
  const unmatched: AnnotationItem[] = [];

  for (const ann of msgAnnotations) {
    // Try exact match first, then case-insensitive, then substring-contains
    let idx = text.indexOf(ann.phrase);
    if (idx === -1) {
      idx = text.toLowerCase().indexOf(ann.phrase.toLowerCase());
    }
    // Try matching just the first 3+ chars (LLM may slightly alter the phrase)
    if (idx === -1 && ann.phrase.length >= 3) {
      const shortPhrase = ann.phrase.slice(0, Math.max(3, Math.floor(ann.phrase.length * 0.7)));
      idx = text.indexOf(shortPhrase);
      if (idx === -1) idx = text.toLowerCase().indexOf(shortPhrase.toLowerCase());
    }
    if (idx === -1) {
      unmatched.push(ann);
      continue;
    }
    segments.push({ start: idx, end: idx + ann.phrase.length, type: ann.type, explanation: ann.explanation });
  }

  // Sort and deduplicate overlaps
  segments.sort((a, b) => a.start - b.start);
  const filtered: Segment[] = [];
  for (const seg of segments) {
    const overlaps = filtered.some(f => seg.start < f.end && seg.end > f.start);
    if (!overlaps) filtered.push(seg);
  }

  // Build highlighted JSX
  const result: React.ReactNode[] = [];
  let lastEnd = 0;
  for (const seg of filtered) {
    if (seg.start > lastEnd) {
      result.push(<span key={`txt-${lastEnd}`}>{text.slice(lastEnd, seg.start)}</span>);
    }
    const isGood = seg.type === 'good';
    result.push(
      <span
        key={`hl-${seg.start}`}
        className="relative group cursor-help"
        style={{
          backgroundColor: isGood ? 'rgba(34,197,94,0.25)' : 'rgba(250,204,21,0.35)',
          borderBottom: isGood ? '2px solid rgba(22,163,74,0.6)' : '2px solid rgba(234,179,8,0.6)',
          borderRadius: '2px',
          padding: '0 1px',
        }}
      >
        {text.slice(seg.start, seg.end)}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[100] w-64 pointer-events-none">
          <span className="block bg-stone-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg leading-relaxed">
            <span className={`font-semibold block mb-0.5 ${isGood ? 'text-green-300' : 'text-yellow-300'}`}>
              {isGood ? (lang === 'en' ? '🌟 Well said!' : '🌟 说得好！') : (lang === 'en' ? '💡 Smoother way' : '💡 可以更圆融')}
            </span>
            {seg.explanation}
          </span>
          <span className="block w-2 h-2 bg-stone-800 rotate-45 mx-auto -mt-1" />
        </span>
      </span>
    );
    lastEnd = seg.end;
  }
  if (lastEnd < text.length) {
    result.push(<span key={`txt-${lastEnd}`}>{text.slice(lastEnd)}</span>);
  }

  // Show unmatched annotations as notes below
  if (unmatched.length > 0) {
    result.push(
      <span key="unmatched-notes" className="block mt-2 space-y-1">
        {unmatched.map((ann, i) => (
          <span key={i} className={`block text-xs px-2 py-1 rounded ${
            ann.type === 'good'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            <span className="font-medium">"{ann.phrase}"</span> — {ann.explanation}
          </span>
        ))}
      </span>
    );
  }

  return <>{result}</>;
}

export function DebriefPanel({ scenarioId, stage, roundsPlayed, insightsCollected, earnedTitle, messages, debriefTitle, debriefSummary, annotations, onNextStage, onReplay, lang }: DebriefPanelProps) {
  const router = useRouter();
  const scenario = SCENARIOS[scenarioId as keyof typeof SCENARIOS];
  const nextStage = getNextStage(stage);
  if (!scenario) return null;
  const nextStageMeta = nextStage ? STAGES[nextStage] : null;

  const hasLlmDebrief = !!debriefTitle || !!debriefSummary;
  const hasAnnotations = annotations.length > 0;

  // Extract user messages with their indices for annotation display
  const userMessagesWithIndex = useMemo(() => {
    let userIdx = 0;
    return messages
      .map((m, i) => ({ ...m, origIndex: i }))
      .filter(m => m.role === 'user')
      .map(m => ({ ...m, userIdx: userIdx++ }));
  }, [messages]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-5">
        <div className="text-center">
          <span className="text-5xl mb-2 block">{scenario.icon}</span>
          <h2 className="text-2xl font-bold text-stone-900">{t('debrief.title', lang)}</h2>
          <p className="text-stone-400 text-sm">{lang === 'en' ? scenario.titleEn : scenario.titleZh}</p>
          {/* LLM-generated personalized title (primary for non-observe modes) */}
          {debriefTitle && (
            <div className="mt-4 inline-block px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-base font-semibold shadow-md">
              🏆 {debriefTitle}
            </div>
          )}
          {/* Fallback: END tag title (observe mode or when debrief unavailable) */}
          {!debriefTitle && earnedTitle && (
            <div className={`inline-block mt-3 px-4 py-2 rounded-full bg-gradient-to-r ${earnedTitle.color} text-white text-sm font-medium`}>
              {earnedTitle.emoji} {lang === 'en' ? earnedTitle.nameEn : earnedTitle.nameZh}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-stone-50 rounded-xl p-3"><div className="text-xl font-bold text-stone-800">{roundsPlayed}</div><div className="text-xs text-stone-400">{lang === 'en' ? 'Exchanges' : '轮数'}</div></div>
          <div className="bg-stone-50 rounded-xl p-3"><div className="text-xl font-bold text-amber-600">{insightsCollected.length}</div><div className="text-xs text-stone-400">{lang === 'en' ? 'Insights' : '智慧'}</div></div>
        </div>

        <div className="bg-amber-50 rounded-xl p-4">
          <h3 className="font-semibold text-stone-700 mb-3 text-sm flex items-center gap-2">
            <span>🦉</span>
            {lang === 'en' ? "Auntie's Recap" : '阿姨的总结'}
          </h3>
          {hasLlmDebrief ? (
            <div className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{debriefSummary}</div>
          ) : (
            <ul className="text-sm text-stone-500 space-y-1">
              <li>{lang === 'en' ? `Explored: ${scenario.conceptsIntroduced.join(', ')}` : `探索了：${scenario.conceptsIntroduced.join('、')}`}</li>
              <li>{lang === 'en' ? `Theme: "${scenario.themeEn}"` : `主题："${scenario.themeZh}"`}</li>
              {insightsCollected.length > 0 && <li>{lang === 'en' ? `Found ${insightsCollected.length} wisdom card(s)` : `发现了${insightsCollected.length}张智慧卡片`}</li>}
            </ul>
          )}
        </div>

        {/* ── Phrase-by-Phrase Coaching ── */}
        {hasAnnotations && (
          <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-stone-700 text-sm flex items-center gap-2">
                <span>🔍</span>
                {t('debrief.phraseCoaching', lang)}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
                {t('debrief.phraseCoachingDesc', lang)}
              </p>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(34,197,94,0.35)', borderBottom: '2px solid rgba(22,163,74,0.6)' }} />
                {lang === 'en' ? 'Great choice' : '表达得体'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(250,204,21,0.4)', borderBottom: '2px solid rgba(234,179,8,0.6)' }} />
                {lang === 'en' ? 'Could be smoother' : '可以更圆融'}
              </span>
            </div>

            {/* Annotated user messages */}
            <div className="space-y-3 pr-1">
              {userMessagesWithIndex.map((msg) => {
                const msgAnnotations = annotations.filter(a => a.userMsgIndex === msg.userIdx);
                if (msgAnnotations.length === 0) return null;
                return (
                  <div key={msg.origIndex} className="bg-stone-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">
                        {lang === 'en' ? 'You said' : '你说'}
                      </span>
                      <span className="text-xs text-stone-300">#{msg.userIdx + 1}</span>
                    </div>
                    <p className="text-sm text-stone-700 leading-relaxed">
                      <HighlightedText
                        text={msg.content}
                        annotations={annotations}
                        msgIndex={msg.userIdx}
                        lang={lang}
                      />
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {nextStageMeta && (
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-600 mb-0.5">{t('debrief.tryNextStage', lang)}</p>
              <p className="text-sm font-medium text-emerald-800">{nextStageMeta.icon} {lang === 'en' ? nextStageMeta.labelEn : nextStageMeta.labelZh}</p>
            </div>
          )}
          <button onClick={onNextStage} className="w-full py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors">
            {nextStageMeta
              ? (lang === 'en' ? `Try ${nextStageMeta.labelEn} →` : `尝试${nextStageMeta.labelZh} →`)
              : (lang === 'en' ? 'Replay Stage' : '重玩本阶段')}
          </button>
          <button onClick={() => router.push('/game')} className="w-full py-2.5 text-stone-400 hover:text-stone-600 text-sm transition-colors">{t('debrief.backToJourney', lang)}</button>
          <button onClick={onReplay} className="w-full py-2 text-stone-300 hover:text-stone-500 text-xs transition-colors">{t('debrief.replay', lang)}</button>
        </div>
      </div>
    </div>
  );
}
