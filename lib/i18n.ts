export type Language = 'zh' | 'en';

const texts = {
  // ========== Homepage ==========
  home: {
    title: {
      en: 'Cultural Compass',
      zh: '文化指南',
    },
    subtitle: {
      en: 'A journey to understand Chinese social culture — one interaction at a time',
      zh: '一次一个互动，理解中国社交文化之旅',
    },
    tagline: {
      en: 'Made for Chinese adoptees reconnecting with their heritage',
      zh: '为回归中华文化的华裔被收养者而打造',
    },
    startJourney: {
      en: 'Begin Your Journey',
      zh: '开始旅程',
    },
    continueJourney: {
      en: 'Continue Your Journey',
      zh: '继续旅程',
    },
    narrativeIntro: {
      en: "You're visiting China — maybe for the first time, maybe returning. The language on the streets is familiar, but the unwritten rules of social life feel like a foreign country. Your aunties and uncles have offered to be your cultural guides, helping you navigate the world of Chinese social etiquette — one conversation at a time.",
      zh: '你来到中国——也许是第一次，也许是重返。街上的语言很熟悉，但社交生活的潜规则却像异国他乡。你的姑姑、叔叔们愿意做你的文化向导，带你一步步走进中国社交礼仪的世界。',
    },
  },

  // ========== Journey Map ==========
  journey: {
    title: {
      en: 'Your Journey',
      zh: '你的旅程',
    },
    subtitle: {
      en: 'Choose a scenario to explore. Complete scenarios to unlock new challenges.',
      zh: '选择一个场景探索。完成场景以解锁新的挑战。',
    },
    beginner: {
      en: 'Getting Started',
      zh: '入门',
    },
    intermediate: {
      en: 'Going Deeper',
      zh: '深入',
    },
    advanced: {
      en: 'Mastery',
      zh: '精通',
    },
    locked: {
      en: 'Locked',
      zh: '未解锁',
    },
    completed: {
      en: 'Completed',
      zh: '已完成',
    },
    stagesCompleted: {
      en: '{n} of 4 stages',
      zh: '4个阶段中完成了{n}个',
    },
    insightsFound: {
      en: '{n} insights',
      zh: '{n}条智慧',
    },
    play: {
      en: 'Play',
      zh: '进入',
    },
    wisdomBook: {
      en: 'Wisdom Collection',
      zh: '智慧收集册',
    },
    wisdomBookDesc: {
      en: 'Review all the cultural insights you\'ve discovered',
      zh: '回顾你发现的所有文化智慧',
    },
  },

  // ========== Stage Selector ==========
  stageSelector: {
    title: {
      en: 'Choose Your Learning Stage',
      zh: '选择学习阶段',
    },
    subtitle: {
      en: 'How would you like to experience this scenario?',
      zh: '你想以什么方式体验这个场景？',
    },
    locked: {
      en: 'Complete the previous stage to unlock',
      zh: '完成上一阶段以解锁',
    },
    start: {
      en: 'Start',
      zh: '开始',
    },
  },

  // ========== Psychology Note ==========
  psychology: {
    toggle: {
      en: 'What were they thinking?',
      zh: '角色在想什么？',
    },
    hide: {
      en: 'Hide thoughts',
      zh: '收起想法',
    },
  },

  // ========== End Conversation ==========
  endConversation: {
    available: {
      en: 'The conversation feels complete...',
      zh: '对话已经差不多了...',
    },
    button: {
      en: 'End Conversation →',
      zh: '结束对话 →',
    },
  },

  // ========== Debrief ==========
  debrief: {
    title: {
      en: 'Scenario Complete!',
      zh: '场景完成！',
    },
    yourTitle: {
      en: 'Your Title',
      zh: '你的称号',
    },
    keyTakeaways: {
      en: 'Key Takeaways',
      zh: '关键收获',
    },
    concepts: {
      en: 'New Concepts',
      zh: '新学到的概念',
    },
    insights: {
      en: 'Wisdom Collected',
      zh: '收集到的智慧',
    },
    tryNextStage: {
      en: 'Try the next stage:',
      zh: '尝试下一阶段：',
    },
    backToJourney: {
      en: 'Back to Journey Map',
      zh: '返回旅程地图',
    },
    replay: {
      en: 'Replay This Scenario',
      zh: '重玩本场景',
    },
    // Annotations
    phraseCoaching: {
      en: '🗣️ Phrase-by-Phrase Coaching',
      zh: '🗣️ 逐句精修指导',
    },
    phraseCoachingDesc: {
      en: "Auntie has reviewed your word choices — green means you nailed it, yellow means there's a smoother way to say it. Hover to read the notes.",
      zh: '阿姨仔细看了你的每一句表达——绿色是你说得特别好的地方，黄色是可以说得更圆融的地方。鼠标悬停查看详细点评。',
    },
    goodPhrase: {
      en: '🌟 Well said!',
      zh: '🌟 说得好！',
    },
    improvePhrase: {
      en: '💡 Smoother way',
      zh: '💡 可以更圆融',
    },
    // Loading progress steps
    loadingStep1: {
      en: 'Thinking about your conversation...',
      zh: '正在回味你的对话……',
    },
    loadingStep2: {
      en: 'Finding the perfect title for you...',
      zh: '正在为你寻觅一个贴切的称号……',
    },
    loadingStep3: {
      en: 'Putting together Auntie\'s overall thoughts...',
      zh: '正在整理阿姨的总体评价……',
    },
    loadingStep4: {
      en: 'Polishing phrase-by-phrase tips for you...',
      zh: '正在逐字逐句为你打磨建议……',
    },
  },

  // ========== Auntie's Wisdom ==========
  wisdom: {
    found: {
      en: 'Wisdom Discovered!',
      zh: '发现了姑妈的智慧！',
    },
    collect: {
      en: 'Add to Collection',
      zh: '收入收集册',
    },
    collectionTitle: {
      en: 'Auntie\'s Wisdom Collection',
      zh: '姑妈的智慧收集册',
    },
    collectionEmpty: {
      en: 'No wisdom collected yet. Play through scenarios to discover cultural insights.',
      zh: '还没有收集到智慧。完成场景以发现文化智慧。',
    },
    collected: {
      en: 'Collected',
      zh: '已收集',
    },
    of: {
      en: 'of',
      zh: '/',
    },
  },

  // ========== Onboarding ==========
  onboard: {
    welcome: {
      en: 'Welcome to Cultural Compass!',
      zh: '欢迎来到文化指南！',
    },
    welcomeDesc: {
      en: "A safe space to learn about Chinese social culture through interactive stories. You're not being tested — you're discovering.",
      zh: '一个通过互动故事学习中国社交文化的安全空间。你不是在被测试——你是在发现。',
    },
    stages: {
      en: 'Learn at Your Pace',
      zh: '按你的节奏学习',
    },
    stagesDesc: {
      en: 'Start with Observe mode (just watch), then progress through Guided, Practice, and Challenge as you build confidence.',
      zh: '从观察模式开始（只需观看），然后随着信心建立，逐步进阶到引导、练习和挑战模式。',
    },
    dimensions: {
      en: 'Track Your Growth',
      zh: '追踪你的成长',
    },
    dimensionsDesc: {
      en: 'Five cultural dimensions show you where you shine and where to focus. No right or wrong — just awareness.',
      zh: '五个文化维度帮助你看到自己的优势和可以专注的方向。没有对错——只有觉知。',
    },
    wisdom: {
      en: 'Collect Wisdom',
      zh: '收集智慧',
    },
    wisdomDesc: {
      en: 'Discover "Auntie\'s Wisdom" cards throughout your journey. Each one unlocks a piece of Chinese cultural knowledge.',
      zh: '在旅程中发现"姑妈的智慧"卡片。每张卡片解锁一条中国文化知识。',
    },
    ready: {
      en: 'Ready to Begin',
      zh: '准备开始',
    },
  },

  // ========== Common UI ==========
  common: {
    loading: {
      en: 'Loading...',
      zh: '加载中...',
    },
    error: {
      en: 'Something went wrong. Please try again.',
      zh: '出了点问题，请重试。',
    },
    networkError: {
      en: 'Network hiccup...',
      zh: '网络开小差了...',
    },
    thinking: {
      en: 'is thinking...',
      zh: '正在思考...',
    },
    typing: {
      en: 'is typing...',
      zh: '正在输入...',
    },
    round: {
      en: 'Round',
      zh: '第',
    },
    roundSuffix: {
      en: '',
      zh: '轮',
    },
    switchLang: {
      en: '中文',
      zh: 'EN',
    },
    continue: {
      en: 'Continue →',
      zh: '继续 →',
    },
    typeResponse: {
      en: 'Type your response...',
      zh: '输入你的回应...',
    },
    tabHint: {
      en: 'Type your response — Tab to accept suggestion, Enter to send',
      zh: '输入你的回应 — Tab键接受建议，Enter发送',
    },
  },
};

export function t(
  key: string,
  lang: Language,
  replacements?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: unknown = texts;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  if (value && typeof value === 'object' && lang in (value as Record<string, unknown>)) {
    let text = (value as Record<string, string>)[lang];
    if (replacements) {
      for (const [placeholder, replacement] of Object.entries(replacements)) {
        text = text.replace(`{${placeholder}}`, String(replacement));
      }
    }
    return text;
  }
  return key;
}

export const defaultLanguage: Language = 'en';
