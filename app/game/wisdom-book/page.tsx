'use client';
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Language } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { getAllCollectedInsightIds } from '@/lib/game-progress-store';
import { AUNTIE_WISDOMS, TOTAL_INSIGHTS } from '@/lib/cultural-insights';

function WisdomBookContent() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('en');
  const collectedIds = getAllCollectedInsightIds();
  const collected = AUNTIE_WISDOMS.filter((w) => collectedIds.includes(w.id));
  const uncollected = AUNTIE_WISDOMS.filter((w) => !collectedIds.includes(w.id));

  return (
    <div className="min-h-screen bg-stone-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6 pt-4">
          <button onClick={() => router.push('/game')} className="text-stone-400 hover:text-stone-600 text-sm">← {lang === 'en' ? 'Back to Journey' : '返回旅程'}</button>
          <LanguageToggle lang={lang} onToggle={setLang} />
        </div>

        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">📖</span>
          <h1 className="text-2xl font-bold text-stone-900">{t('wisdom.collectionTitle', lang)}</h1>
          <div className="max-w-xs mx-auto mt-4 text-left">
            <ProgressBar
              value={collected.length}
              max={TOTAL_INSIGHTS}
              label={`${t('wisdom.of', lang)} ${TOTAL_INSIGHTS} ${lang === 'en' ? 'collected' : '已收集'}`}
              color="bg-gradient-to-r from-amber-400 to-amber-500"
            />
          </div>
        </div>

        {collected.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-stone-700 mb-3 text-sm">{t('wisdom.collected', lang)} ({collected.length})</h2>
            <div className="space-y-2">
              {collected.map((wisdom) => (
                <div key={wisdom.id} className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{wisdom.icon}</span>
                    <div>
                      <h3 className="font-semibold text-stone-900">{lang === 'en' ? wisdom.titleEn : wisdom.titleZh}</h3>
                      <p className="text-sm text-stone-500 mt-1">{lang === 'en' ? wisdom.textEn : wisdom.textZh}</p>
                      <span className="inline-block mt-2 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{wisdom.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {uncollected.length > 0 && (
          <div>
            <h2 className="font-semibold text-stone-300 mb-3 text-sm">{lang === 'en' ? 'Yet to Discover' : '尚未发现'} ({uncollected.length})</h2>
            <div className="space-y-1.5 opacity-30">
              {uncollected.map((wisdom) => (
                <div key={wisdom.id} className="bg-white rounded-xl p-3 border border-stone-100">
                  <div className="flex items-center gap-3"><span className="text-xl grayscale">{wisdom.icon}</span><p className="text-sm text-stone-400">???</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {collected.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">🔍</span>
            <p className="text-stone-400">{t('wisdom.collectionEmpty', lang)}</p>
            <button onClick={() => router.push('/game')} className="mt-4 px-6 py-2.5 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors">{lang === 'en' ? 'Start Exploring' : '开始探索'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WisdomBookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="text-stone-400">{t('common.loading', 'en')}</div></div>}>
      <WisdomBookContent />
    </Suspense>
  );
}
