import type { LearningStage } from './scenario-config';

export interface StageMeta {
  id: LearningStage;
  labelEn: string; labelZh: string;
  shortEn: string; shortZh: string;
  icon: string;
  descriptionEn: string; descriptionZh: string;
  promptModifierEn: string; promptModifierZh: string;
  order: number;
}

export const STAGES: Record<LearningStage, StageMeta> = {
  observe: {
    id: 'observe',
    labelEn: 'Watch & Learn', labelZh: '观察学习',
    shortEn: 'Observe', shortZh: '观察',
    icon: '👀',
    descriptionEn: 'Watch a culturally authentic dialogue unfold. Tap 💭 below each message to reveal what characters are really thinking.',
    descriptionZh: '观看一段正宗的对话。点击每条消息下的💭查看角色的真实内心想法。',
    promptModifierEn: 'STAGE: OBSERVE. Every response: <<NPC>>, <<PLAYER>>, <<PSYCHOLOGY>>. Put brief actions in parentheses inside dialogue. <<CONTEXT>> only in round 1. <<WISDOM>> every 2-3 rounds by card ID. <<END_AVAILABLE>> after the 3rd exchange (acceptance round). No <<OPTIONS>>.',
    promptModifierZh: '阶段：观察。每个回复：<<NPC>>、<<PLAYER>>、<<PSYCHOLOGY>>。动作用括号简写在对话中。仅第一轮有<<CONTEXT>>。每2-3轮用卡片ID输出<<WISDOM>>。第三轮（接受）后输出<<END_AVAILABLE>>。不要<<OPTIONS>>。',
    order: 0,
  },
  guided: {
    id: 'guided',
    labelEn: 'Guided Practice', labelZh: '引导练习',
    shortEn: 'Guided', shortZh: '引导',
    icon: '🔍',
    descriptionEn: 'Make your own choices. The NPC will gently guide you.',
    descriptionZh: '自己选择回应，NPC会温和地引导你。',
    promptModifierEn: 'STAGE: GUIDED. <<NPC>>, <<OPTIONS>>. Put brief actions in parentheses. <<WISDOM>> when culturally relevant (card IDs only). Plain options. <<END_AVAILABLE>> after ritual completes. Patient and encouraging NPC.',
    promptModifierZh: '阶段：引导。<<NPC>>、<<OPTIONS>>。动作用括号简写。文化相关时用卡片ID输出<<WISDOM>>。纯文本选项。仪式完成后输出<<END_AVAILABLE>>。耐心鼓励的NPC。',
    order: 1,
  },
  practice: {
    id: 'practice',
    labelEn: 'Free Response', labelZh: '自由填空',
    shortEn: 'Free', shortZh: '填空',
    icon: '✍️',
    descriptionEn: 'Type your own responses freely. AI will suggest completions as you type — Tab to accept.',
    descriptionZh: '自由输入你的回应。AI会在你输入时建议补全内容 — Tab键接受。',
    promptModifierEn: 'STAGE: PRACTICE. <<NPC>> ONLY — NO <<OPTIONS>>. The player types freely. Put brief actions in parentheses. <<WISDOM>> when culturally relevant. <<END_AVAILABLE>> after ritual completes.',
    promptModifierZh: '阶段：填空。仅<<NPC>>，不要<<OPTIONS>>。玩家自由输入。动作用括号简写。文化相关时用<<WISDOM>>。仪式完成后输出<<END_AVAILABLE>>。',
    order: 2,
  },
  challenge: {
    id: 'challenge',
    labelEn: 'Real World Challenge', labelZh: '实战挑战',
    shortEn: 'Challenge', shortZh: '挑战',
    icon: '⚔️',
    descriptionEn: 'No options, no hints. Type freely — just like a real conversation.',
    descriptionZh: '无选项、无提示。自由输入——如同真实对话。',
    promptModifierEn: 'STAGE: CHALLENGE. <<NPC>> only — no <<OPTIONS>>. Player types freely with no guidance. Save <<PSYCHOLOGY>> and <<WISDOM>> for the end.',
    promptModifierZh: '阶段：挑战。仅<<NPC>>——无<<OPTIONS>>。玩家自由输入无引导。<<PSYCHOLOGY>>和<<WISDOM>>留到最后。',
    order: 3,
  },
};

export function getNextStage(current: LearningStage): LearningStage | null {
  const stages: LearningStage[] = ['observe', 'guided', 'practice', 'challenge'];
  const idx = stages.indexOf(current);
  return idx < stages.length - 1 ? stages[idx + 1] : null;
}

export function getStagesForScenario(
  completedStages: LearningStage[]
): { available: LearningStage[]; locked: LearningStage[]; next: LearningStage | null } {
  const all: LearningStage[] = ['observe', 'guided', 'practice', 'challenge'];
  const stageOrder: Record<LearningStage, number> = { observe: 0, guided: 1, practice: 2, challenge: 3 };

  const available = all.filter(s => completedStages.includes(s));

  const highestCompletedIdx = completedStages.length > 0
    ? Math.max(...completedStages.map(s => stageOrder[s]))
    : -1;
  const nextUnlockedIdx = highestCompletedIdx + 1;

  if (nextUnlockedIdx < all.length && !available.includes(all[nextUnlockedIdx])) {
    available.push(all[nextUnlockedIdx]);
  }

  const locked = all.filter(s => !available.includes(s));

  const next: LearningStage | null = nextUnlockedIdx < all.length ? all[nextUnlockedIdx] : null;
  return { available, locked, next };
}
