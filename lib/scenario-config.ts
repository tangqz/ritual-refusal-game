export type ScenarioId =
  | 'hongbao'
  | 'compliment'
  | 'guest'
  | 'gift'
  | 'bill'
  | 'dinner'
  | 'workplace'
  | 'refusal';

export type DifficultyTier = 'beginner' | 'intermediate' | 'advanced';
export type LearningStage = 'observe' | 'guided' | 'practice' | 'challenge';

export interface ScenarioConfig {
  id: ScenarioId;
  titleEn: string;
  titleZh: string;
  subtitleEn: string;
  subtitleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  icon: string;
  tier: DifficultyTier;
  prerequisites: ScenarioId[];
  npcRoleEn: string;
  npcRoleZh: string;
  npcAvatar: string;
  settingEn: string;
  settingZh: string;
  conceptsIntroduced: string[];
  insightIds: string[];
  /** The initial game-start message sent to the AI to kick off the scenario */
  startPromptEn: string;
  startPromptZh: string;
  /** The cultural theme this scenario teaches */
  themeEn: string;
  themeZh: string;
}

export const ALL_STAGES: LearningStage[] = ['observe', 'guided', 'practice', 'challenge'];

export const SCENARIOS: Record<ScenarioId, ScenarioConfig> = {
  hongbao: {
    id: 'hongbao',
    titleEn: 'The Red Envelope Dance',
    titleZh: '推拉红包',
    subtitleEn: 'Chinese New Year gift-giving ritual',
    subtitleZh: '春节送礼的推拉艺术',
    descriptionEn:
      'It\'s Chinese New Year, and your auntie wants to give you a red envelope (hongbao). In Chinese culture, accepting immediately is considered greedy — but refusing too firmly is disrespectful. Can you find the right rhythm?',
    descriptionZh:
      '春节到了，姑姑要给你发红包。在中国文化中，立刻收下被视为贪心，但拒绝得太坚决又显得不尊重。你能找到正确的节奏吗？',
    icon: '🧧',
    tier: 'beginner',
    prerequisites: [],
    npcRoleEn: 'Auntie Wang (王阿姨)',
    npcRoleZh: '王阿姨（姑姑）',
    npcAvatar: '👵',
    settingEn: "Auntie's living room, Chinese New Year's Eve",
    settingZh: '姑姑家客厅，大年三十',
    conceptsIntroduced: ['keqi', 'mianzi', 'san-tui-san-rang'],
    insightIds: ['hongbao_keqi', 'hongbao_rule_of_three', 'hongbao_face_both', 'hongbao_modern'],
    startPromptEn:
      'Game start! You are Auntie Wang. I am your niece/nephew visiting for Chinese New Year. Please initiate the conversation and try to give me a red envelope (hongbao). Be warm, persistent, and culturally authentic.',
    startPromptZh:
      '游戏开始！你是王阿姨（姑姑），我是来拜年的晚辈。请主动发起对话，给我红包。要温暖、坚持、符合中国文化。',
    themeEn: 'The push-pull ritual of gift acceptance',
    themeZh: '收礼的推拉礼仪',
  },
  compliment: {
    id: 'compliment',
    titleEn: 'The Compliment Trap',
    titleZh: '应对夸奖',
    subtitleEn: 'Humble deflection vs. gracious acceptance',
    subtitleZh: '谦虚否认还是大方接受',
    descriptionEn:
      'Someone praises your Chinese skills, your cooking, or your appearance. In Western culture, "thank you" is the correct response. In Chinese culture, humble denial is expected. How do you respond without sounding either arrogant or awkward?',
    descriptionZh:
      '有人夸奖你的中文、厨艺或外貌。西方文化中，"谢谢"是正确回应。中国文化中，谦虚否认才是得体。如何回应既不自大也不尴尬？',
    icon: '🌟',
    tier: 'beginner',
    prerequisites: [],
    npcRoleEn: 'Auntie Li (李阿姨)',
    npcRoleZh: '李阿姨（妈妈的朋友）',
    npcAvatar: '👩‍🦱',
    settingEn: 'Family friend\'s home, casual visit',
    settingZh: '父母朋友家，日常拜访',
    conceptsIntroduced: ['qianxu', 'self-effacement'],
    insightIds: ['compliment_humble', 'compliment_deflect', 'compliment_return'],
    startPromptEn:
      'Game start! You are Auntie Li, my mother\'s friend. I am visiting with my parents. Please initiate conversation and compliment me on something (my Chinese ability, appearance, or accomplishments). Be warm and genuinely complimentary, but in a culturally Chinese way.',
    startPromptZh:
      '游戏开始！你是李阿姨，我妈妈的朋友。我和父母一起来做客。请主动对话并夸奖我（中文能力、外貌或成就）。要温暖真诚，但符合中国文化方式。',
    themeEn: 'The art of humble self-deprecation',
    themeZh: '谦虚自贬的艺术',
  },
  guest: {
    id: 'guest',
    titleEn: 'Being a Guest',
    titleZh: '做客礼仪',
    subtitleEn: 'Navigating hospitality overload',
    subtitleZh: '面对热情款待的应对之道',
    descriptionEn:
      'You\'re visiting a relative\'s home for the first time. The host insists you sit in the best seat, eat more, drink more, stay longer. In Chinese culture, the host\'s insistent hospitality requires a matching dance of polite refusal from the guest.',
    descriptionZh:
      '第一次去亲戚家做客。主人坚持让你坐最好的位置、多吃、多喝、多留一会儿。中国文化中，主人的热情坚持需要客人配合以礼貌推辞的舞蹈。',
    icon: '🍵',
    tier: 'beginner',
    prerequisites: [],
    npcRoleEn: 'Uncle Zhang (张叔叔)',
    npcRoleZh: '张叔叔（远房亲戚）',
    npcAvatar: '👨‍🦳',
    settingEn: "Uncle Zhang's home, first visit in many years",
    settingZh: '张叔叔家，多年后第一次拜访',
    conceptsIntroduced: ['keqi', 'hospitality_codes'],
    insightIds: ['guest_seating', 'guest_refuse_food', 'guest_leaving'],
    startPromptEn:
      'Game start! You are Uncle Zhang, a distant relative I am visiting for the first time in many years. Please welcome me warmly, insist I take the best seat, offer tea and snacks, and urge me to stay longer. Use culturally authentic Chinese hospitality.',
    startPromptZh:
      '游戏开始！你是张叔叔，一个我多年后第一次拜访的远房亲戚。请热情欢迎我，坚持让我坐最好的位置，不断提供茶和点心，并挽留我多待一会儿。要体现正宗的中国式热情。',
    themeEn: 'The ritual dance of Chinese hospitality',
    themeZh: '中国式热情的仪式性互动',
  },
  gift: {
    id: 'gift',
    titleEn: 'The Gift Protocol',
    titleZh: '送礼与收礼',
    subtitleEn: 'When and how to give and receive presents',
    subtitleZh: '送礼收礼的时机与方式',
    descriptionEn:
      'You receive an unexpected gift from a family friend. Do you open it immediately? Do you refuse first? When reciprocating, how much is appropriate? Gift-giving in China follows unwritten rules that are easy for outsiders to stumble over.',
    descriptionZh:
      '一位父母朋友突然送你礼物。立刻打开吗？先推辞吗？回礼时，送多少才合适？中国的送礼文化遵循一套不成文规则，外来者很容易踩坑。',
    icon: '🎁',
    tier: 'intermediate',
    prerequisites: ['hongbao', 'guest'],
    npcRoleEn: 'Auntie Chen (陈阿姨)',
    npcRoleZh: '陈阿姨（父母好友）',
    npcAvatar: '👩‍🦳',
    settingEn: 'Meeting at a family dinner',
    settingZh: '家庭聚餐中',
    conceptsIntroduced: ['liwu', 'reciprocity_depth'],
    insightIds: ['gift_dont_open', 'gift_refuse_first', 'gift_reciprocate', 'gift_value'],
    startPromptEn:
      'Game start! You are Auntie Chen, a close family friend. We are at a family dinner. You have brought me a gift. Please initiate giving it to me. Be warm but expect culturally appropriate hesitation before I accept.',
    startPromptZh:
      '游戏开始！你是陈阿姨，父母的好友。我们在家庭聚餐中。你给我带了礼物。请主动给我礼物，要温暖，但预期我会在文化上适当地推辞后才接受。',
    themeEn: 'The unspoken rules of gift exchange',
    themeZh: '礼尚往来的潜规则',
  },
  bill: {
    id: 'bill',
    titleEn: 'The Bill Battle',
    titleZh: '抢买单大战',
    subtitleEn: 'Fighting to pay as a form of respect',
    subtitleZh: '以抢付钱表达尊重',
    descriptionEn:
      'Dinner is over, and the check arrives. In Chinese culture, fighting to pay the bill is not about money — it\'s about demonstrating generosity, maintaining relationships, and building social capital. But sometimes the battle gets intense.',
    descriptionZh:
      '聚餐结束，账单来了。在中国文化中，抢买单不是钱的问题——是展示大方、维护关系、积累社交资本。但有时这场战斗会很激烈。',
    icon: '🧾',
    tier: 'intermediate',
    prerequisites: ['hongbao', 'compliment'],
    npcRoleEn: 'Friend (Xiao Wang / 小王)',
    npcRoleZh: '朋友小王',
    npcAvatar: '🧑',
    settingEn: 'Restaurant after a group dinner',
    settingZh: '餐厅，聚餐结束后',
    conceptsIntroduced: ['qingmian', 'shejiao_ziben'],
    insightIds: ['bill_fight_why', 'bill_face_game', 'bill_aa_taboo', 'bill_secret_pay'],
    startPromptEn:
      'Game start! You are Xiao Wang, my friend. We just finished dinner with friends at a restaurant. The check has arrived. Please initiate the "bill battle" — insist on paying. Be competitive about it but in a friendly, culturally Chinese way.',
    startPromptZh:
      '游戏开始！你是我的朋友小王。我们刚和朋友在餐厅吃完晚饭，账单来了。请发起"买单战斗"——坚持要付钱。要有竞争性但友好的、中国文化的方式。',
    themeEn: 'Paying as a social performance',
    themeZh: '买单作为社交表演',
  },
  dinner: {
    id: 'dinner',
    titleEn: 'The Dinner Invitation',
    titleZh: '饭局礼仪',
    subtitleEn: 'Staying for a meal without seeming greedy',
    subtitleZh: '留饭而不显得贪吃',
    descriptionEn:
      'You\'re visiting someone right before mealtime. They invite you to stay for dinner. In Chinese culture, the ritual is: they insist, you politely decline, they insist more strongly, you reluctantly accept. But the timing of each step matters.',
    descriptionZh:
      '你在饭点前拜访别人。他们邀请你留下来吃饭。中国文化的仪式是：他们坚持邀请，你礼貌推辞，他们更坚持，你不情愿地接受。但每一步的时机都有讲究。',
    icon: '🍜',
    tier: 'intermediate',
    prerequisites: ['guest'],
    npcRoleEn: 'Neighbor Auntie Liu (刘阿姨)',
    npcRoleZh: '邻居刘阿姨',
    npcAvatar: '👩‍🍳',
    settingEn: "Neighbor's home, late afternoon visit",
    settingZh: '邻居家，下午拜访',
    conceptsIntroduced: ['liufan', 'wanliu'],
    insightIds: ['dinner_timing', 'dinner_accept_grace', 'dinner_contribute'],
    startPromptEn:
      'Game start! You are Auntie Liu, my neighbor. I stopped by for a quick visit, but it\'s getting close to dinner time. Please insist that I stay for dinner. Use culturally authentic Chinese meal-invitation patterns — the first invitation should be met with polite refusal.',
    startPromptZh:
      '游戏开始！你是刘阿姨，我的邻居。我来短暂拜访，但快到晚饭时间了。请坚持让我留下来吃饭。要用正宗的中国式留饭方式——第一次邀请应该被礼貌拒绝。',
    themeEn: 'The choreography of the meal invitation',
    themeZh: '留饭邀请的仪式舞蹈',
  },
  workplace: {
    id: 'workplace',
    titleEn: 'The Office Favor',
    titleZh: '职场人情',
    subtitleEn: 'Navigating guanxi in professional settings',
    subtitleZh: '职场中的人情世故',
    descriptionEn:
      'A colleague did you a significant favor, and now offers an expensive thank-you gift. In Chinese workplaces, the boundary between professional and personal is blurred by guanxi. How do you express gratitude without creating uncomfortable obligation?',
    descriptionZh:
      '同事帮了你一个大忙，现在又要送你一份贵重的感谢礼物。在中国职场，专业和私人之间的界限被人情关系模糊。如何在表达感谢的同时不造成不舒适的人情债？',
    icon: '💼',
    tier: 'advanced',
    prerequisites: ['bill', 'gift'],
    npcRoleEn: 'Senior Colleague Lao Zhou (老周)',
    npcRoleZh: '同事老周（前辈）',
    npcAvatar: '🧑‍💼',
    settingEn: 'Office, end of a workday',
    settingZh: '办公室，工作日结束时',
    conceptsIntroduced: ['guanxi_workplace', 'renqing_balance'],
    insightIds: ['workplace_gift_value', 'workplace_reciprocate', 'workplace_boundary'],
    startPromptEn:
      'Game start! You are Lao Zhou, a senior colleague who helped me with an important project. The project was a success. Now at the end of the workday, you want to give me an expensive gift to thank me for my hard work. Be warm but expect culturally Chinese gratitude dynamics.',
    startPromptZh:
      '游戏开始！你是老周，一位帮助过我完成重要项目的前辈同事。项目很成功。现在工作日结束时，你要给我一份贵重礼物感谢我的努力。要温暖，但预期有中国文化中的感恩互动。',
    themeEn: 'Guanxi and reciprocity in professional life',
    themeZh: '职场中的人情往来',
  },
  refusal: {
    id: 'refusal',
    titleEn: 'Graceful Refusal',
    titleZh: '得体拒绝',
    subtitleEn: 'Saying no without causing offense',
    subtitleZh: '不伤和气的拒绝艺术',
    descriptionEn:
      'Someone asks you for a favor you cannot or do not want to fulfill. In direct Western communication, a polite "no" suffices. In Chinese culture, a direct refusal can damage guanxi. How do you say no while preserving the relationship?',
    descriptionZh:
      '有人请求你帮一个你做不到或不愿意的忙。在直接的西方沟通中，一个礼貌的"不"就够了。在中国文化中，直接拒绝可能伤害关系。如何在保全关系的同时说"不"？',
    icon: '🙅',
    tier: 'advanced',
    prerequisites: ['workplace', 'dinner'],
    npcRoleEn: 'Distant Relative (表姐)',
    npcRoleZh: '远房表姐',
    npcAvatar: '👩',
    settingEn: 'Phone call, evening at home',
    settingZh: '电话中，晚上在家',
    conceptsIntroduced: ['wanhui_jujue', 'hanxu'],
    insightIds: ['refusal_indirect', 'refusal_excuse', 'refusal_delay', 'refusal_third_party'],
    startPromptEn:
      'Game start! You are my distant cousin (表姐). Call me to ask for a significant favor — borrowing a large sum of money for an urgent matter. You are earnest and the request is real, but culturally you should expect indirect communication patterns. Be understanding if I need to refuse.',
    startPromptZh:
      '游戏开始！你是我的远房表姐。打电话来请我帮一个大忙——借一笔不小的钱急用。你是真诚的，请求是真实的，但文化上你应该预期间接的沟通方式。如果我需要拒绝，要保持理解。',
    themeEn: 'The art of indirect refusal',
    themeZh: '委婉拒绝的艺术',
  },
};

export function getScenariosByTier(tier: DifficultyTier): ScenarioConfig[] {
  return Object.values(SCENARIOS).filter((s) => s.tier === tier);
}

export function isScenarioUnlocked(
  scenario: ScenarioConfig,
  completedIds: ScenarioId[]
): boolean {
  return scenario.prerequisites.every((preq) => completedIds.includes(preq));
}

export function getUnlockedScenarios(completedIds: ScenarioId[]): ScenarioConfig[] {
  return Object.values(SCENARIOS).filter((s) => isScenarioUnlocked(s, completedIds));
}
