'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ScenarioId, ScenarioConfig, DifficultyTier } from '@/lib/scenario-config';
import { getUnlockedScenarios, getScenariosByTier } from '@/lib/scenario-config';
import { loadProgress, type GameProgress } from '@/lib/game-progress-store';
import { getInsightsByScenario } from '@/lib/cultural-insights';
import type { Language } from '@/lib/i18n';
import { t } from '@/lib/i18n';

interface JourneyMapProps {
  lang: Language;
}

const TIER_CONFIG: Record<DifficultyTier, { en: string; zh: string; dot: string; bar: string }> = {
  beginner: { en: 'Getting Started', zh: '入门', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  intermediate: { en: 'Going Deeper', zh: '深入', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  advanced: { en: 'Mastery', zh: '精通', dot: 'bg-rose-400', bar: 'bg-rose-400' },
};

function ScenarioCard({
  scenario,
  lang,
  onClick,
}: {
  scenario: ScenarioConfig;
  lang: Language;
  onClick: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());
  useEffect(() => { setProgress(loadProgress()); setMounted(true); }, []);

  const sp = progress.scenarioProgress[scenario.id];
  const completedStages = sp?.completedStages ?? [];
  const totalInsights = getInsightsByScenario(scenario.id).length;
  const collectedInsights = sp?.insightsCollected?.length ?? 0;
  const isCompleted = completedStages.length >= 4;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-white rounded-xl border border-stone-200
        hover:border-stone-300 hover:shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl">{scenario.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-stone-900">
              {lang === 'en' ? scenario.titleEn : scenario.titleZh}
            </h3>
            {mounted && isCompleted && (
              <span className="text-emerald-600 text-xs bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                ✓ {t('journey.completed', lang)}
              </span>
            )}
          </div>
          <p className="text-sm text-stone-400 mt-0.5">
            {lang === 'en' ? scenario.subtitleEn : scenario.subtitleZh}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-stone-300">
            {mounted ? (
              <>
                <span>{t('journey.stagesCompleted', lang, { n: completedStages.length })}</span>
                {totalInsights > 0 && (
                  <span>{t('journey.insightsFound', lang, { n: `${collectedInsights}/${totalInsights}` })}</span>
                )}
              </>
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
        </div>
        <span className="text-stone-300 mt-1">→</span>
      </div>
    </button>
  );
}

function LockedCard({ scenario, lang }: { scenario: ScenarioConfig; lang: Language }) {
  return (
    <div className="w-full text-left p-4 bg-stone-50 rounded-xl border border-stone-100 opacity-50 cursor-not-allowed">
      <div className="flex items-start gap-4">
        <span className="text-3xl grayscale">{scenario.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-stone-400">
              {lang === 'en' ? scenario.titleEn : scenario.titleZh}
            </h3>
            <span className="text-stone-300 text-xs">🔒 {t('journey.locked', lang)}</span>
          </div>
          <p className="text-sm text-stone-300 mt-0.5">
            {lang === 'en' ? scenario.subtitleEn : scenario.subtitleZh}
          </p>
        </div>
      </div>
    </div>
  );
}

export function JourneyMap({ lang }: JourneyMapProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());

  useEffect(() => {
    setMounted(true);
    setProgress(loadProgress());
  }, []);

  // Defer scenario unlock logic until client-side mount to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-8 pb-8">
        {(['beginner', 'intermediate', 'advanced'] as DifficultyTier[]).map((tier) => {
          const tierScenarios = getScenariosByTier(tier);
          const cfg = TIER_CONFIG[tier];
          return (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
                  {lang === 'en' ? cfg.en : cfg.zh}
                </h2>
              </div>
              <div className="space-y-2">
                {tierScenarios.map((scenario) => (
                  <div key={scenario.id} className="w-full p-4 bg-white rounded-xl border border-stone-200 animate-pulse">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{scenario.icon}</span>
                      <div className="flex-1">
                        <div className="h-5 bg-stone-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-stone-100 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div className="w-full p-4 bg-white rounded-xl border border-stone-200 animate-pulse">
          <div className="flex items-center gap-4">
            <span className="text-3xl">📖</span>
            <div className="flex-1">
              <div className="h-5 bg-stone-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-stone-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completedIds = progress.completedScenarios as ScenarioId[];
  const unlocked = getUnlockedScenarios(completedIds);
  const tiers: DifficultyTier[] = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="space-y-8 pb-8">
      {tiers.map((tier) => {
        const tierScenarios = getScenariosByTier(tier);
        const cfg = TIER_CONFIG[tier];

        return (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
                {lang === 'en' ? cfg.en : cfg.zh}
              </h2>
            </div>
            <div className="space-y-2">
              {tierScenarios.map((scenario) => {
                const isUnlocked = unlocked.some((s) => s.id === scenario.id);
                return isUnlocked ? (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    lang={lang}
                    onClick={() => router.push(`/game/${scenario.id}`)}
                  />
                ) : (
                  <LockedCard key={scenario.id} scenario={scenario} lang={lang} />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Wisdom Book */}
      <button
        onClick={() => router.push('/game/wisdom-book')}
        className="w-full p-4 bg-white rounded-xl border border-stone-200
          hover:border-amber-300 hover:shadow-sm transition-all text-left focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl">📖</span>
          <div className="flex-1">
            <h3 className="font-semibold text-stone-900">
              {t('journey.wisdomBook', lang)}
            </h3>
            <p className="text-sm text-stone-400">
              {t('journey.wisdomBookDesc', lang)}
            </p>
            <p className="text-xs text-amber-600 mt-1 font-medium">
              {mounted ? (
                <>{progress.totalInsightsCollected} {lang === 'en' ? 'collected' : '条已收集'}</>
              ) : (
                <>&nbsp;</>
              )}
            </p>
          </div>
          <span className="text-stone-300">→</span>
        </div>
      </button>
    </div>
  );
}
