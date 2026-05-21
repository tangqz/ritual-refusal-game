'use client';
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { NarrativeIntro } from '@/components/game/NarrativeIntro';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import type { Language } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { loadProgress, hasProgress } from '@/lib/game-progress-store';

function HomeContent() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const [showIntro, setShowIntro] = useState(false);
  const progress = loadProgress();
  const hasExistingProgress = hasProgress();

  if (showIntro) {
    return <NarrativeIntro lang={lang} onToggleLang={setLang} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-end">
          <LanguageToggle lang={lang} onToggle={setLang} />
        </div>

        <div>
          <div className="text-6xl mb-6">🧭</div>
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight mb-3">
            {t('home.title', lang)}
          </h1>
          <p className="text-lg text-stone-500 font-light leading-relaxed max-w-xs mx-auto">
            {t('home.subtitle', lang)}
          </p>
        </div>

        <p className="text-sm text-stone-400 leading-relaxed max-w-sm mx-auto">
          {t('home.narrativeIntro', lang)}
        </p>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => setShowIntro(true)}
            className="w-full py-3.5 bg-stone-800 text-white rounded-xl font-medium
              hover:bg-stone-700 active:bg-stone-900 transition-colors"
          >
            {hasExistingProgress
              ? t('home.continueJourney', lang)
              : t('home.startJourney', lang)}
          </button>

          {hasExistingProgress && (
            <button
              onClick={() => router.push('/game')}
              className="w-full py-3 text-stone-400 hover:text-stone-600 text-sm transition-colors"
            >
              {lang === 'en' ? 'Skip to Journey Map' : '直接进入旅程地图'}
            </button>
          )}
        </div>

        {hasExistingProgress && (
          <p className="text-xs text-stone-300">
            {lang === 'en'
              ? `${progress.completedScenarios.length} scenarios · ${progress.totalInsightsCollected} insights`
              : `已探索 ${progress.completedScenarios.length} 个场景 · 收集 ${progress.totalInsightsCollected} 条智慧`}
          </p>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <div className="text-stone-400">{t('common.loading', 'en')}</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
