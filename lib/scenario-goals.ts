import type { ScenarioId } from './scenario-config';

/**
 * Per-scenario cultural "goal" definition.
 * Each scenario has a different culturally-correct outcome pattern.
 * This replaces the old hongbao-centric "acceptance" model with
 * scenario-specific goal semantics.
 */

export type InteractionPattern =
  | 'refuse_then_accept'   // offer → polite refusal → warm acceptance (hongbao, guest, gift, dinner, workplace)
  | 'deflect_and_connect'  // compliment → humble deflection → reciprocal warmth (compliment)
  | 'compete_then_concede' // competition → graceful concession → commit reciprocate (bill)
  | 'refuse_indirectly';    // request → indirect refusal → alternative help (refusal)

export interface ScenarioGoal {
  /** The cultural interaction pattern */
  pattern: InteractionPattern;

  /** What the "correct" option represents in this scenario */
  goalLabelEn: string;
  goalLabelZh: string;

  /** Instruction to the LLM about what to mark as the goal option */
  optionsInstructionEn: string;
  optionsInstructionZh: string;

  /** Example goal option for the LLM format template */
  optionExampleEn: string;
  optionExampleZh: string;

  /** Feedback when the player chooses the culturally-correct option */
  acceptanceFeedbackEn: string;
  acceptanceFeedbackZh: string;

  /** Pre-written NPC warm closing when the player achieves the goal.
   *  Used in Guided mode to avoid LLM hallucination/regurgitation on the final turn. */
  npcClosingEn: string;
  npcClosingZh: string;

  /** Context for the hint API — what the hint should guide toward */
  hintContextEn: string;
  hintContextZh: string;

  /** How many "polite rounds" before the goal action is appropriate (0 = immediate) */
  targetRoundRange: { min: number; max: number };
}

export const SCENARIO_GOALS: Record<ScenarioId, ScenarioGoal> = {
  // ─── Hongbao: Classic 三推三让 ──────────────────────────────────
  hongbao: {
    pattern: 'refuse_then_accept',
    goalLabelEn: 'Graciously accept the red envelope',
    goalLabelZh: '得体地接受红包',
    optionsInstructionEn:
      'Exactly ONE option must represent the culturally-correct moment to ACCEPT the hongbao — mark it with [ACCEPT]. The other three are different refusal/deflection strategies at varying levels of warmth.',
    optionsInstructionZh:
      '必须有一个选项代表文化上正确的接受时机——在开头标注[ACCEPT]。其余三个是不同程度温暖的推辞策略。',
    optionExampleEn: '[ACCEPT] (bow, accept with both hands) Thank you, Auntie! Wishing you health!',
    optionExampleZh: '[ACCEPT]（鞠躬，双手接过）谢谢阿姨！祝您身体健康！',
    acceptanceFeedbackEn:
      '🦉 You found the rhythm — gracious acceptance after 客气 (kèqi) is the heart of 人情世故 (rénqíng shìgù).',
    acceptanceFeedbackZh:
      '🦉 你找到了节奏——客气之后的优雅接受正是人情世故的精髓。',
    npcClosingEn:
      '(beams with joy, eyes crinkling, tucks the envelope into your hand) Hǎo, hǎo! Auntie\'s heart is so full. Xīnnián kuàilè, my dear child — come, let\'s eat dumplings before they get cold!',
    npcClosingZh:
      '（笑得合不拢嘴，眼睛眯成一条缝，把红包塞进你手里）好，好！阿姨这心里可高兴了。新年快乐，乖孩子——来，赶紧吃饺子，凉了就不好吃了！',
    hintContextEn:
      'The player is learning the 三推三让 (san tui san rang) ritual of giving/receiving hongbao. Guide them on when to refuse and when to accept.',
    hintContextZh:
      '玩家正在学习红包的三推三让礼仪。引导他们何时推辞、何时接受。',
    targetRoundRange: { min: 2, max: 3 },
  },

  // ─── Compliment: Deflect and connect ────────────────────────────
  compliment: {
    pattern: 'deflect_and_connect',
    goalLabelEn: 'Humbly deflect the compliment',
    goalLabelZh: '谦虚地回应赞美',
    optionsInstructionEn:
      'Exactly ONE option must represent the culturally-correct RESPONSE to the compliment — mark it with [ACCEPT]. This is about humble deflection (谦虚, qiānxū), NOT direct acceptance. The other three are varying degrees of either accepting too directly or over-deflecting.',
    optionsInstructionZh:
      '必须有一个选项代表文化上正确的回应赞美方式——在开头标注[ACCEPT]。这是关于谦虚的转移，而非直接接受。其余三个是不同程度的不恰当回应（太直接接受或过度推辞）。',
    optionExampleEn: '[ACCEPT] (wave hand modestly) Nǎlǐ nǎlǐ — you flatter me! It\'s all thanks to my teacher.',
    optionExampleZh: '[ACCEPT]（谦虚地摆摆手）哪里哪里——您过奖了！都是老师教得好。',
    acceptanceFeedbackEn:
      '🦉 Beautiful deflection! In Chinese culture, humble deflection (谦虚, qiānxū) shows more grace than a direct "thank you."',
    acceptanceFeedbackZh:
      '🦉 漂亮的谦虚回应！在中国文化中，谦虚的转移比直接说"谢谢"更显修养。',
    npcClosingEn:
      '(smiles warmly, pats your shoulder with affection) You really are such a good child — your mother raised you well. Now, let me pour you more tea, and you must tell me all about your life!',
    npcClosingZh:
      '（温暖地笑着，慈爱地拍拍你的肩）你真是个好孩子——你妈妈把你教得真好。来，阿姨再给你倒杯茶，你跟阿姨多说说你在外面的事！',
    hintContextEn:
      'The player is learning how to respond to compliments in Chinese culture. Guide them toward humble deflection (谦虚, qiānxū) rather than direct acceptance or excessive self-criticism.',
    hintContextZh:
      '玩家正在学习如何在中国文化中回应赞美。引导他们走向谦虚的转移而非直接接受或过度自贬。',
    targetRoundRange: { min: 1, max: 2 },
  },

  // ─── Guest: Accept hospitality after polite refusal ──────────────
  guest: {
    pattern: 'refuse_then_accept',
    goalLabelEn: 'Warmly accept the host\'s hospitality',
    goalLabelZh: '温暖地接受主人的款待',
    optionsInstructionEn:
      'Exactly ONE option must represent the culturally-correct moment to ACCEPT the host\'s offering — mark it with [ACCEPT]. The other three are different refusal/hesitation strategies. The acceptance should feel warm, not entitled.',
    optionsInstructionZh:
      '必须有一个选项代表文化上正确的接受主人好意的时机——在开头标注[ACCEPT]。其余三个是不同程度的推辞或犹豫策略。接受应该温暖，不应显得理所当然。',
    optionExampleEn: '[ACCEPT] (settles into seat, accepts tea with both hands) Thank you, Uncle — your home feels so warm.',
    optionExampleZh: '[ACCEPT]（坐进座位，双手接茶）谢谢叔叔——您家真温暖。',
    acceptanceFeedbackEn:
      '🦉 Warm acceptance after polite hesitation is the guest\'s half of the hospitality dance. You made the host feel appreciated.',
    acceptanceFeedbackZh:
      '🦉 礼貌犹豫后的温暖接受是客人一方的待客之道。你让主人感到被珍惜。',
    npcClosingEn:
      '(settles back contentedly, tea cup warm in hand) Hǎo, this is good. Having you here — zhè cái shì jiā de wèidào, this is what home feels like. Don\'t be a stranger now, hǎo bù hǎo?',
    npcClosingZh:
      '（满足地靠进沙发，捧着热茶杯）好，这样才好。有你在——这才是家的味道。以后常来啊，好不好？',
    hintContextEn:
      'The player is learning guest etiquette in a Chinese home. Guide them on the rhythm of polite refusal followed by warm acceptance of hospitality.',
    hintContextZh:
      '玩家正在学习在中国家庭做客的礼仪。引导他们掌握礼貌推辞后温暖接受的节奏。',
    targetRoundRange: { min: 2, max: 3 },
  },

  // ─── Gift: Accept gift after polite refusal ─────────────────────
  gift: {
    pattern: 'refuse_then_accept',
    goalLabelEn: 'Graciously accept the gift (without opening it)',
    goalLabelZh: '得体地收下礼物（不当面打开）',
    optionsInstructionEn:
      'Exactly ONE option must represent the culturally-correct moment to ACCEPT the gift — mark it with [ACCEPT]. The other three are different refusal/hesitation strategies. The correct acceptance should NOT include opening the gift!',
    optionsInstructionZh:
      '必须有一个选项代表文化上正确的接受礼物时机——在开头标注[ACCEPT]。其余三个是不同程度的推辞或犹豫策略。正确的接受不应该包含当面打开礼物！',
    optionExampleEn: '[ACCEPT] (accepts with both hands, bows slightly) Thank you, Auntie — I\'ll treasure this. (places gift in bag without opening)',
    optionExampleZh: '[ACCEPT]（双手接过，微微鞠躬）谢谢阿姨——我一定好好珍藏。（不打开，放进包里）',
    acceptanceFeedbackEn:
      '🦉 Perfect! Accepting with gratitude while NOT opening the gift respects the giver\'s face — a key 礼物 (lǐwù) rule.',
    acceptanceFeedbackZh:
      '🦉 完美！带着感激收下却不打开，尊重了送礼者的面子——这是送礼礼仪的关键规则。',
    npcClosingEn:
      '(claps hands together, delighted) Hǎo! Xièxiè nǐ gěi Āyí miànzi — thank you for giving Auntie face! Now, no more 客气 between us. Come, let me show you the photos from my last trip — that\'s where I found your gift!',
    npcClosingZh:
      '（高兴地拍手）好！谢谢你给阿姨面子！咱们之间再也别客气了。来，阿姨给你看我上次旅行的照片——你的礼物就是那时挑的！',
    hintContextEn:
      'The player is learning Chinese gift etiquette. Guide them: refuse once or twice warmly, then accept graciously. Never open the gift in front of the giver.',
    hintContextZh:
      '玩家正在学习中国的送礼礼仪。引导他们：温暖地推辞一两次，然后得体地收下。绝不当面打开礼物。',
    targetRoundRange: { min: 2, max: 3 },
  },

  // ─── Bill: Compete then concede gracefully ──────────────────────
  bill: {
    pattern: 'compete_then_concede',
    goalLabelEn: 'Gracefully concede the bill battle',
    goalLabelZh: '优雅地让步买单大战',
    optionsInstructionEn:
      'Exactly ONE option must represent the culturally-correct moment to CONCEDE the bill battle — mark it with [ACCEPT]. Conceding means letting the other person pay BUT firmly committing to pay next time. The other three are: fighting harder, suggesting AA, or accepting without reciprocation.',
    optionsInstructionZh:
      '必须有一个选项代表文化上正确的让步时机——在开头标注[ACCEPT]。让步意味着让对方付钱但坚定承诺下次自己请。其余三个是：继续争抢、提议AA制、或不承诺回请地接受。',
    optionExampleEn: '[ACCEPT] (puts wallet away, raises tea cup) Fine, you win this round! But next meal is 100% on me — that\'s my 面子 on the line.',
    optionExampleZh: '[ACCEPT]（收起钱包，举起茶杯）好，这轮你赢了！但下一顿百分百是我的——这是我的面子。',
    acceptanceFeedbackEn:
      '🦉 Graceful concession with a firm commitment to reciprocate — this is how 面子 (miànzi) flows both ways in friendship.',
    acceptanceFeedbackZh:
      '🦉 优雅让步加上坚定的回请承诺——这就是友情中面子的双向流动。',
    npcClosingEn:
      '(laughs heartily, clinks your tea cup) Hǎo! Yīyán wéi dìng — it\'s settled then! Next meal is on you, and I\'ll order the most expensive dish! (winks) But today, you\'re my guest — and that\'s final.',
    npcClosingZh:
      '（开怀大笑，与你碰杯）好！一言为定！下次你请，我可要点最贵的！（眨眨眼）但今天，你是我的客人——就这么定了。',
    hintContextEn:
      'The player is learning the Chinese bill-battle ritual. Guide them: compete to pay, then concede gracefully with a firm promise to treat next time. Never suggest AA.',
    hintContextZh:
      '玩家正在学习中国的买单大战礼仪。引导他们：争抢付钱，然后优雅让步并坚定承诺下次请客。绝不提议AA制。',
    targetRoundRange: { min: 1, max: 2 },
  },

  // ─── Dinner: Accept meal invitation after polite refusal ────────
  dinner: {
    pattern: 'refuse_then_accept',
    goalLabelEn: 'Warmly accept the dinner invitation',
    goalLabelZh: '温暖地接受留饭邀请',
    optionsInstructionEn:
      'Exactly ONE option must represent the culturally-correct moment to ACCEPT the dinner invitation — mark it with [ACCEPT]. The other three are different refusal/hesitation strategies. The correct acceptance should include offering to help!',
    optionsInstructionZh:
      '必须有一个选项代表文化上正确的接受留饭时机——在开头标注[ACCEPT]。其余三个是不同程度的推辞或犹豫策略。正确的接受应包含主动帮忙！',
    optionExampleEn: '[ACCEPT] (washes hands, rolls up sleeves) OK, Auntie — but let me help set the table at least!',
    optionExampleZh: '[ACCEPT]（洗手，卷起袖子）好吧阿姨——但至少让我帮忙摆碗筷！',
    acceptanceFeedbackEn:
      '🦉 Warm acceptance with an offer to help — this transforms you from guest to family. The 留饭 (liú fàn) ritual is complete.',
    acceptanceFeedbackZh:
      '🦉 温暖接受加主动帮忙——这把你从客人变成了家人。留饭的仪式圆满了。',
    npcClosingEn:
      '(grins and hands you a pair of chopsticks) Zhè cái duì! That\'s more like it! Table setting is simple — the real art is in the eating. Xiǎo xīn, the fish has tiny bones — eat slowly, eat slowly!',
    npcClosingZh:
      '（咧嘴笑着递给你一双筷子）这才对嘛！摆桌子简单——吃才是真功夫。小心，鱼刺多——慢慢吃，慢慢吃！',
    hintContextEn:
      'The player is learning the Chinese dinner invitation ritual. Guide them: refuse once or twice, then accept warmly and offer to help set the table.',
    hintContextZh:
      '玩家正在学习中国的留饭礼仪。引导他们：推辞一两次，然后温暖地接受并主动帮忙摆桌子。',
    targetRoundRange: { min: 2, max: 3 },
  },

  // ─── Workplace: Accept gift with humility and responsibility ────
  workplace: {
    pattern: 'refuse_then_accept',
    goalLabelEn: 'Accept the gift as a responsibility to pay forward',
    goalLabelZh: '作为传承责任接受礼物',
    optionsInstructionEn:
      'Exactly ONE option must represent the culturally-correct way to ACCEPT the senior colleague\'s gift — mark it with [ACCEPT]. This means accepting with humility, expressing desire to learn, and framing it as a responsibility to continue the mentorship tradition. The other three are: refusing outright, accepting too casually, or accepting without acknowledging the mentorship bond.',
    optionsInstructionZh:
      '必须有一个选项代表文化上正确的接受前辈礼物方式——在开头标注[ACCEPT]。这意味着谦虚接受、表达学习意愿、并将其定义为延续师徒传统的责任。其余三个是：直接拒绝、太随意接受、或不认可师徒纽带的接受。',
    optionExampleEn: '[ACCEPT] (receives with both hands, bows) I accept — not as a gift, but as a responsibility. One day I\'ll do the same for my juniors.',
    optionExampleZh: '[ACCEPT]（双手接过，鞠躬）我收下——不是作为礼物，而是作为责任。有一天我也会这样对我的后辈。',
    acceptanceFeedbackEn:
      '🦉 Accepting with the promise to pay it forward — this is 关系 (guānxi) at its healthiest: mentorship flowing across generations.',
    acceptanceFeedbackZh:
      '🦉 接受并承诺传承——这是关系最健康的形态：跨越代际的师徒之情。',
    npcClosingEn:
      '(nods slowly, eyes glistening with pride) Hǎo... I knew I chose right. Bùyào gūfù — don\'t let this go to waste. And when you\'re in my seat one day, remember: the best gift you can give a junior is belief. Lái, let\'s get back to work — we have much to do.',
    npcClosingZh:
      '（缓缓点头，眼中闪着骄傲的光芒）好……我没看错人。不要辜负。等你有一天坐在我这个位置，记住：给后辈最好的礼物就是信任。来，咱们继续干活——要做的事还多着呢。',
    hintContextEn:
      'The player is learning Chinese workplace gift dynamics. Guide them: refuse briefly, then accept with humility and frame it as a mentorship tradition to continue.',
    hintContextZh:
      '玩家正在学习中国职场送礼文化。引导他们：短暂推辞，然后谦逊接受并定义为需要延续的师徒传统。',
    targetRoundRange: { min: 2, max: 3 },
  },

  // ─── Refusal: Refuse indirectly and offer alternative ───────────
  refusal: {
    pattern: 'refuse_indirectly',
    goalLabelEn: 'Refuse indirectly while preserving the relationship',
    goalLabelZh: '间接拒绝同时保全关系',
    optionsInstructionEn:
      'Exactly ONE option must represent the culturally-correct way to SAY NO INDIRECTLY — mark it with [ACCEPT]. In Chinese culture, a direct "no" damages 关系 (guānxi). The goal option should: express empathy, cite an external constraint, delay, AND offer partial/alternative help. The other three are: saying no directly, making up an obvious lie, or over-promising.',
    optionsInstructionZh:
      '必须有一个选项代表文化上正确的间接拒绝方式——在开头标注[ACCEPT]。在中国文化中，直接说"不"会伤害关系。目标选项应该：表达同理心、引用外部限制、拖延、并提供部分/替代帮助。其余三个是：直接说不、编造明显谎言、或过度承诺。',
    optionExampleEn: '[ACCEPT] (voice warm with concern) I wish I could help right now — let me ask a friend who does small business loans. And cousin, let\'s stay in touch more, OK?',
    optionExampleZh: '[ACCEPT]（声音温暖带着关切）我真希望能现在帮你——让我问问做小微信贷的朋友。还有表姐，我们以后多联系，好吗？',
    acceptanceFeedbackEn:
      '🦉 You said no without saying no — empathy + alternative help + relationship affirmation. This is 挽回拒绝 (wǎnhuí jùjué) at its finest.',
    acceptanceFeedbackZh:
      '🦉 你没有说不却表达了不——同理心 + 替代帮助 + 关系确认。这就是挽回拒绝的最高境界。',
    npcClosingEn:
      '(sighs, then smiles — a little sad but clearly touched) Hǎo ba... wǒ míngbái. At least you tried to help — that means more than money. Zánmen yǐhòu duō liánxì, hǎo bù hǎo? Don\'t be a stranger, cousin.',
    npcClosingZh:
      '（叹了口气，然后笑了——有点失落但明显被感动了）好吧……我明白。至少你试着帮我了——这比钱更重要。咱们以后多联系，好不好？别成了陌生人，表妹。',
    hintContextEn:
      'The player is learning how to refuse a request in Chinese culture. Guide them: never say no directly. Use empathy, cite external constraints, delay, and offer alternative help.',
    hintContextZh:
      '玩家正在学习如何在中国文化中拒绝请求。引导他们：绝不说直接的不。使用同理心、引用外部限制、拖延、并提供替代帮助。',
    targetRoundRange: { min: 1, max: 2 },
  },
};

/** Get the goal for a specific scenario */
export function getScenarioGoal(scenarioId: string): ScenarioGoal | undefined {
  return SCENARIO_GOALS[scenarioId as ScenarioId];
}
