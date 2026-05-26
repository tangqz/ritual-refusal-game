'use client';
import { useState, useEffect, Suspense } from 'react';
import { JourneyMap } from '@/components/game/JourneyMap';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import type { Language } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { loadProgress, type GameProgress } from '@/lib/game-progress-store';

function GameHomeContent() {
  const [lang, setLang] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());

  useEffect(() => {
    setMounted(true);
    setProgress(loadProgress());
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 pt-6">
          <div className="flex justify-end mb-4">
            <LanguageToggle lang={lang} onToggle={setLang} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-2">
              {t('journey.title', lang)}
            </h1>
            <p className="text-sm text-stone-400">
              {t('journey.subtitle', lang)}
            </p>
            {mounted && progress.totalInsightsCollected > 0 && (
              <p className="text-xs text-stone-300 mt-2">
                📖 {progress.totalInsightsCollected}{' '}
                {lang === 'en' ? 'insights' : '条智慧'}
              </p>
            )}
          </div>
        </div>

        <JourneyMap lang={lang} />
      </div>
    </div>
  );
}

export default function GameHomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <div className="text-stone-400">{t('common.loading', 'en')}</div>
        </div>
      }
    >
      <GameHomeContent />
    </Suspense>
  );
}
