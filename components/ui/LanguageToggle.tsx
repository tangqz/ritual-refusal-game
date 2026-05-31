'use client';
import type { Language } from '@/lib/i18n';

interface LanguageToggleProps {
  lang: Language;
  onToggle: (lang: Language) => void;
}

export function LanguageToggle({ lang, onToggle }: LanguageToggleProps) {
  return (
    <button
      onClick={() => onToggle(lang === 'en' ? 'zh' : 'en')}
      aria-label={lang === 'en' ? 'Switch to Chinese' : '切换到英文'}
      className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-400
        hover:text-stone-600 hover:bg-stone-100
        focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none transition-colors"
    >
      {lang === 'en' ? '中文' : 'EN'}
    </button>
  );
}
