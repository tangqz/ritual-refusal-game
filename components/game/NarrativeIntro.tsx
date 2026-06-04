'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import type { Language } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { completeOnboarding } from '@/lib/game-progress-store';

interface NarrativeIntroProps {
  lang: Language;
  onToggleLang: (lang: Language) => void;
}

export function NarrativeIntro({ lang, onToggleLang }: NarrativeIntroProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const stepsEn = [
    { text: "You're visiting China — maybe for the first time, maybe returning to the land of your birth.", img: '🇨🇳' },
    { text: "The streets, the food, the language — they feel strangely familiar. But the unspoken rules of social life? Those feel like a foreign country.", img: '🏮' },
    { text: "Your aunties and uncles are warm, generous, insistent. They offer gifts, meals, compliments — and when you respond naturally, sometimes there's an awkward pause...", img: '🤔' },
    { text: "That pause? It's the gap between two cultural languages. And like any language, it can be learned.", img: '💡' },
    { text: "Welcome to Cultural Compass — a safe space to learn the rhythms of Chinese social life, one interaction at a time.", img: '🧭' },
  ];

  const stepsZh = [
    { text: '你来到中国——也许是第一次，也许是重返你的出生之地。', img: '🇨🇳' },
    { text: '街道、食物、语言——它们感觉奇怪地熟悉。但社交生活的潜规则呢？那些感觉像异国他乡。', img: '🏮' },
    { text: '你的姑姑、叔叔们热情、慷慨、坚持不懈。他们送礼物、留吃饭、给赞美——当你自然地回应时，有时会出现一阵尴尬的停顿...', img: '🤔' },
    { text: '那个停顿？它是两种文化语言之间的鸿沟。而像任何语言一样，它可以被学会。', img: '💡' },
    { text: '欢迎来到文化指南——一个安全的空间，让你一次一个互动地学习中国社交生活的节奏。', img: '🧭' },
  ];

  const steps = lang === 'en' ? stepsEn : stepsZh;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-end">
          <LanguageToggle lang={lang} onToggle={onToggleLang} />
        </div>

        <div className="text-6xl">{current.img}</div>
        <p className="text-xl text-stone-700 leading-relaxed font-light px-4">
          {current.text}
        </p>

        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i <= step ? 'bg-stone-800' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        <div className="space-y-3 pt-4">
          {!isLast ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-8 py-3 bg-stone-800 text-white rounded-xl font-medium
                hover:bg-stone-700 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            >
              {lang === 'en' ? 'Next →' : '继续 →'}
            </button>
          ) : (
            <button
              onClick={() => { completeOnboarding(); router.push('/game'); }}
              className="px-8 py-3 bg-stone-800 text-white rounded-xl font-medium
                hover:bg-stone-700 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            >
              {t('home.startJourney', lang)}
            </button>
          )}
          {step > 0 && (
            <button
              onClick={() => { completeOnboarding(); router.push('/game'); }}
              className="block w-full text-stone-400 hover:text-stone-600 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded-lg py-1"
            >
              {lang === 'en' ? 'Skip intro →' : '跳过介绍 →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
