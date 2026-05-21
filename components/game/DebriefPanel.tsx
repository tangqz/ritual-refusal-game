'use client';
import { useRouter } from 'next/navigation';
import type { LearningStage } from '@/lib/scenario-config';
import { SCENARIOS } from '@/lib/scenario-config';
import type { Language } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { getNextStage, STAGES } from '@/lib/learning-progression';
import type { GameTitle } from '@/lib/game-titles';

interface DebriefPanelProps {
  scenarioId: string;
  stage: LearningStage;
  roundsPlayed: number;
  insightsCollected: string[];
  earnedTitle: GameTitle | null;
  onNextStage: () => void;
  onReplay: () => void;
  lang: Language;
}

export function DebriefPanel({ scenarioId, stage, roundsPlayed, insightsCollected, earnedTitle, onNextStage, onReplay, lang }: DebriefPanelProps) {
  const router = useRouter();
  const scenario = SCENARIOS[scenarioId as keyof typeof SCENARIOS];
  const nextStage = getNextStage(stage);
  if (!scenario) return null;
  const nextStageMeta = nextStage ? STAGES[nextStage] : null;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-5">
        <div className="text-center">
          <span className="text-5xl mb-2 block">{scenario.icon}</span>
          <h2 className="text-2xl font-bold text-stone-900">{t('debrief.title', lang)}</h2>
          <p className="text-stone-400 text-sm">{lang === 'en' ? scenario.titleEn : scenario.titleZh}</p>
          {earnedTitle && (
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
          <h3 className="font-semibold text-stone-700 mb-2 text-sm">{t('debrief.keyTakeaways', lang)}</h3>
          <ul className="text-sm text-stone-500 space-y-1">
            <li>{lang === 'en' ? `Explored: ${scenario.conceptsIntroduced.join(', ')}` : `探索了：${scenario.conceptsIntroduced.join('、')}`}</li>
            <li>{lang === 'en' ? `Theme: "${scenario.themeEn}"` : `主题："${scenario.themeZh}"`}</li>
            {insightsCollected.length > 0 && <li>{lang === 'en' ? `Found ${insightsCollected.length} wisdom card(s)` : `发现了${insightsCollected.length}张智慧卡片`}</li>}
          </ul>
        </div>

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
