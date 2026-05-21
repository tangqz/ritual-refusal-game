import type { ParsedTitle } from './stream-parser';

export interface GameTitle {
  id: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  emoji: string;
  color: string;
}

// Learning achievement titles (awarded based on progress milestones, not LLM)
export const LEARNING_TITLES: GameTitle[] = [
  {
    id: 'eager_student',
    nameEn: 'Eager Student',
    nameZh: '好学生',
    descriptionEn: 'Completed all scenarios in Observe mode',
    descriptionZh: '以观察模式完成了所有场景',
    emoji: '📚',
    color: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'brave_explorer',
    nameEn: 'Brave Explorer',
    nameZh: '勇敢探索者',
    descriptionEn: 'Tried Challenge mode for the first time',
    descriptionZh: '首次尝试了挑战模式',
    emoji: '🗺️',
    color: 'from-orange-400 to-red-500',
  },
  {
    id: 'wisdom_seeker',
    nameEn: 'Wisdom Seeker',
    nameZh: '智慧追寻者',
    descriptionEn: 'Collected 20 pieces of Auntie\'s Wisdom',
    descriptionZh: '收集了20条姑妈的智慧',
    emoji: '🦉',
    color: 'from-purple-400 to-pink-500',
  },
  {
    id: 'cultural_navigator',
    nameEn: 'Cultural Navigator',
    nameZh: '文化导航者',
    descriptionEn: 'Completed every scenario across all stages',
    descriptionZh: '用所有阶段完成了每一个场景',
    emoji: '🌟',
    color: 'from-yellow-400 via-orange-400 to-red-500',
  },
];

/** Convert a ParsedTitle from the LLM's END block into a GameTitle for display */
export function parsedTitleToGameTitle(parsed: ParsedTitle): GameTitle {
  return {
    id: `llm_${Date.now()}`,
    nameEn: parsed.nameEn || 'Cultural Explorer',
    nameZh: parsed.nameZh || '文化探索者',
    descriptionEn: parsed.descEn || '',
    descriptionZh: parsed.descZh || '',
    emoji: parsed.emoji || '🌟',
    color: 'from-amber-400 to-orange-500',
  };
}
