'use client';
import type { LearningStage } from '@/lib/scenario-config';
import { STAGES } from '@/lib/learning-progression';
import type { Language } from '@/lib/i18n';

interface Props {
  currentStage: LearningStage;
  completedStages: LearningStage[];
  lang: Language;
}

const ORDER: LearningStage[] = ['observe', 'guided', 'practice', 'challenge'];

export function LearningStageIndicator({ currentStage, completedStages, lang }: Props) {
  return (
    <div className="flex items-center justify-center gap-1 py-1.5">
      {ORDER.map((stage, idx) => {
        const meta = STAGES[stage];
        const isCurrent = stage === currentStage;
        const isCompleted = completedStages.includes(stage);
        return (
          <div key={stage} className="flex items-center">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
              isCurrent ? 'bg-stone-800 text-white font-medium' :
              isCompleted ? 'bg-emerald-50 text-emerald-700' :
              'bg-stone-100 text-stone-300'
            }`} title={lang === 'en' ? meta.descriptionEn : meta.descriptionZh}>
              <span>{meta.icon}</span>
              {isCurrent && <span className="hidden sm:inline">{lang === 'en' ? meta.shortEn : meta.shortZh}</span>}
            </div>
            {idx < ORDER.length - 1 && <div className={`w-3 h-px ${isCompleted ? 'bg-emerald-200' : 'bg-stone-200'}`} />}
          </div>
        );
      })}
    </div>
  );
}
