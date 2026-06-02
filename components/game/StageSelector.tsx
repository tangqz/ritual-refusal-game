'use client';
import type { LearningStage } from '@/lib/scenario-config';
import { STAGES } from '@/lib/learning-progression';
import { getStagesForScenario } from '@/lib/learning-progression';
import type { Language } from '@/lib/i18n';
import { t } from '@/lib/i18n';

interface StageSelectorProps {
  completedStages: LearningStage[];
  onSelect: (stage: LearningStage) => void;
  lang: Language;
}

export function StageSelector({ completedStages, onSelect, lang }: StageSelectorProps) {
  const { available, locked } = getStagesForScenario(completedStages);

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-stone-900 text-center">
        {t('stageSelector.title', lang)}
      </h3>
      <p className="text-sm text-stone-400 text-center mb-4">
        {t('stageSelector.subtitle', lang)}
      </p>

      {available.map((stage) => {
        const meta = STAGES[stage];
        const isCompleted = completedStages.includes(stage);
        return (
          <button
            key={stage}
            onClick={() => onSelect(stage)}
            className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
              isCompleted
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{meta.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-900">
                    {lang === 'en' ? meta.labelEn : meta.labelZh}
                  </span>
                  {isCompleted && (
                    <span className="text-emerald-600 text-xs">✓ {lang === 'en' ? 'Done' : '已完成'}</span>
                  )}
                </div>
                <p className="text-sm text-stone-400 mt-0.5">
                  {lang === 'en' ? meta.descriptionEn : meta.descriptionZh}
                </p>
              </div>
              <span className="text-stone-300 text-lg">→</span>
            </div>
          </button>
        );
      })}

      {locked.map((stage) => {
        const meta = STAGES[stage];
        return (
          <div
            key={stage}
            className="w-full text-left p-4 rounded-xl bg-stone-50 border border-stone-100 opacity-40 cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl grayscale">{meta.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-400">
                    {lang === 'en' ? meta.labelEn : meta.labelZh}
                  </span>
                  <span className="text-stone-300 text-xs">🔒 {t('stageSelector.locked', lang)}</span>
                </div>
                <p className="text-sm text-stone-300 mt-0.5">
                  {lang === 'en' ? meta.descriptionEn : meta.descriptionZh}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
