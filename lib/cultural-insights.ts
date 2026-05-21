import type { ScenarioId } from './scenario-config';

export interface AuntieWisdom {
  id: string;
  scenarioId: ScenarioId;
  icon: string;
  titleEn: string;
  titleZh: string;
  textEn: string;
  textZh: string;
  category: 'face' | 'renqing' | 'guanxi' | 'keqi' | 'fencun' | 'general';
}

export const AUNTIE_WISDOMS: AuntieWisdom[] = [
  // === Hongbao ===
  {
    id: 'hongbao_keqi',
    scenarioId: 'hongbao',
    icon: '🎭',
    titleEn: 'The Ritual of Keqi',
    titleZh: '客气的仪式',
    textEn:
      'Keqi (客气) means "polite deference." When someone offers you something in Chinese culture, refusing at first isn\'t rudeness — it\'s a performance of modesty. It says: "I don\'t feel entitled to your generosity." The giver then insists, proving their sincerity. Both sides gain face through this dance.',
    textZh:
      '客气意为礼貌的谦让。在中国文化中，别人给你东西时先拒绝并非粗鲁——而是一种谦虚的表现，传达"我不理所当然地接受你的慷慨"。给予者随后坚持，证明他们的真诚。双方通过这个舞蹈获得面子。',
    category: 'keqi',
  },
  {
    id: 'hongbao_rule_of_three',
    scenarioId: 'hongbao',
    icon: '🔢',
    titleEn: 'The Rule of Three',
    titleZh: '三推三让',
    textEn:
      'In traditional Chinese etiquette, the gold standard is "san tui san rang" (三推三让) — three pushes and three yields. Refuse twice, accept on the third offer. The first refusal shows you\'re not greedy. The second refusal shows genuine modesty. The third acceptance shows you respect the giver\'s persistence.',
    textZh:
      '中国传统礼仪的黄金标准是"三推三让"——推辞三次，礼让三次。拒绝两次，第三次接受。第一次拒绝显示你不贪心。第二次拒绝显示真诚的谦虚。第三次接受显示你尊重给予者的坚持。',
    category: 'keqi',
  },
  {
    id: 'hongbao_face_both',
    scenarioId: 'hongbao',
    icon: '🤝',
    titleEn: 'Face Goes Both Ways',
    titleZh: '面子是双向的',
    textEn:
      'Mianzi (面子) isn\'t just about protecting your own dignity — it\'s also about giving face to others. When your auntie insists on giving you hongbao, accepting (after appropriate hesitation) gives HER face. It acknowledges her role as the generous elder. Refusing too firmly takes away her opportunity to show care.',
    textZh:
      '面子不仅是保护自己的尊严——也是给别人面子。当你的姑姑坚持给你红包时，（经过适当犹豫后）接受也给了她面子。这承认了她作为慷慨长辈的角色。拒绝得太坚决剥夺了她表现关心的机会。',
    category: 'face',
  },
  {
    id: 'hongbao_modern',
    scenarioId: 'hongbao',
    icon: '📱',
    titleEn: 'Digital Red Envelopes',
    titleZh: '数字红包',
    textEn:
      'Today, WeChat red envelopes have changed the ritual. Digital hongbao removes the physical push-pull, but the social logic remains: group hongbao in WeChat groups create a different kind of face dynamics — who gives the most? Who grabs the fastest? The medium changed, but the underlying values of generosity and face persist.',
    textZh:
      '如今，微信红包改变了仪式。数字红包消除了物理上的推拉，但社交逻辑依然存在：微信群中的拼手气红包创造了另一种面子动态——谁发得最多？谁抢得最快？媒介变了，但慷慨和面子的底层价值观依然存在。',
    category: 'general',
  },

  // === Compliment ===
  {
    id: 'compliment_humble',
    scenarioId: 'compliment',
    icon: '🙏',
    titleEn: 'The Humble Deflection',
    titleZh: '谦虚的转移',
    textEn:
      'In Chinese culture, accepting a compliment directly can seem arrogant. The expected response is qianxu (谦虚) — humility. Classic deflections include "Nali nali" (哪里哪里 — "where? where?"), attributing success to others, or downplaying the achievement. This isn\'t false modesty — it\'s recognizing that individual achievement is always embedded in social relationships.',
    textZh:
      '在中国文化中，直接接受赞美似乎显得自大。预期的回应是谦虚。经典的转移包括"哪里哪里"、将成功归功于他人或淡化成就。这不是虚伪的谦虚——而是承认个人成就始终嵌入社会关系中。',
    category: 'keqi',
  },
  {
    id: 'compliment_deflect',
    scenarioId: 'compliment',
    icon: '🪞',
    titleEn: 'Return the Compliment',
    titleZh: '回敬赞美',
    textEn:
      'A sophisticated deflection tactic: when praised, redirect the compliment back to the praiser. "Your cooking is even better, Auntie!" This achieves three things: (1) deflects attention from yourself, (2) shows you appreciate the other person, (3) continues the warmth of the exchange. It\'s social ping-pong at its finest.',
    textZh:
      '一种高明的转移策略：被赞美时，将赞美反弹给赞美者。"阿姨您做的菜才叫好吃呢！"这达到三个目的：(1)将注意力从自己身上转移，(2)展示你欣赏对方，(3)延续交流的温暖。这是社交乒乓球的最高境界。',
    category: 'guanxi',
  },
  {
    id: 'compliment_return',
    scenarioId: 'compliment',
    icon: '👨‍👩‍👧',
    titleEn: 'Credit Your Roots',
    titleZh: '归功于根',
    textEn:
      'When complimented on personal achievements, a deeply Chinese response is to credit your family or teachers: "It\'s all thanks to my parents" or "My teacher guided me." This shows xiao (孝 — filial piety) and recognizes that individual success rests on collective support. It also makes you more likeable than claiming sole credit would.',
    textZh:
      '当个人成就被赞美时，一个很中国的回应是将其归功于家人或老师："都是父母的功劳"或"老师教得好"。这展示了孝道，并承认个人成功建立在集体支持之上。这也让你比独占功劳更讨人喜欢。',
    category: 'guanxi',
  },

  // === Guest ===
  {
    id: 'guest_seating',
    scenarioId: 'guest',
    icon: '🪑',
    titleEn: 'The Seat of Honor',
    titleZh: '上座的讲究',
    textEn:
      'In a Chinese home, the best seat — usually facing the door with the best view — is reserved for the most honored guest. But the guest is expected to refuse it at first. The host insists. This negotiation over seating is a miniature version of the broader hospitality ritual. Accepting immediately suggests you think too highly of yourself.',
    textZh:
      '在中国家庭中，最好的座位——通常面对门口、视野最佳——是留给最尊贵的客人的。但客人应该先拒绝。主人会坚持。这种座位协商是更广泛款待仪式的缩影。立即接受暗示你把自己看得太高。',
    category: 'fencun',
  },
  {
    id: 'guest_refuse_food',
    scenarioId: 'guest',
    icon: '🍊',
    titleEn: 'The Food Offering Dance',
    titleZh: '让食之舞',
    textEn:
      'When a Chinese host offers food or drink, they will keep offering even after you decline. This isn\'t pushiness — it\'s the host fulfilling their role. Your initial refusal shows you\'re not greedy. Their insistence shows genuine care. Eventually, you "reluctantly" accept. Both parties have performed their roles correctly.',
    textZh:
      '当中国主人提供食物或饮料时，即使你拒绝了他们也会继续提供。这不是强行推销——是主人在履行他们的角色。你最初的拒绝显示不贪心。他们的坚持显示真诚的关心。最终，你"勉强"接受。双方都正确扮演了自己的角色。',
    category: 'keqi',
  },
  {
    id: 'guest_leaving',
    scenarioId: 'guest',
    icon: '🚪',
    titleEn: 'The Art of Leaving',
    titleZh: '告辞的艺术',
    textEn:
      'Leaving a Chinese host\'s home also follows a ritual. You announce you should go — the host insists you stay longer. You insist again — they insist again. This may repeat 2-3 times. Eventually, they "reluctantly" let you go, often walking you to the door, the elevator, or even to your car. The longer the escort, the more they value you.',
    textZh:
      '离开中国主人的家也有一套仪式。你宣布该走了——主人坚持让你多留一会儿。你再次坚持——他们再次挽留。这可能重复2-3次。最终，他们"勉强"让你走，通常会送到门口、电梯口、甚至到你的车旁。送得越远，越重视你。',
    category: 'fencun',
  },

  // === Gift ===
  {
    id: 'gift_dont_open',
    scenarioId: 'gift',
    icon: '🎀',
    titleEn: 'Don\'t Open It (Yet)',
    titleZh: '先别打开',
    textEn:
      'In Chinese culture, opening a gift in front of the giver is generally avoided. Why? It puts pressure on the giver — what if the gift isn\'t expensive enough? What if you don\'t like it? By not opening it, you show that the relationship matters more than the object. You can open it later, privately, and express gratitude at the next meeting.',
    textZh:
      '在中国文化中，通常避免在送礼者面前打开礼物。为什么？这会给送礼者压力——万一礼物不够贵重怎么办？万一你不喜欢怎么办？通过不打开，你展示关系比物品更重要。你可以之后私下打开，下次见面时表达感谢。',
    category: 'face',
  },
  {
    id: 'gift_refuse_first',
    scenarioId: 'gift',
    icon: '🤲',
    titleEn: 'Refuse Before Receiving',
    titleZh: '先推辞再接受',
    textEn:
      'When receiving a gift in Chinese culture, the expected script is: (1) Express surprise and refuse politely — "You shouldn\'t have!" (2) The giver insists — "It\'s nothing, just a small thing." (3) You reluctantly accept — "OK, but you really didn\'t need to." This ritual transforms a simple transaction into a relationship-affirming exchange.',
    textZh:
      '在中国文化中接受礼物时，预期剧本是：(1)表达惊讶并礼貌拒绝——"您太客气了！"(2)送礼者坚持——"没什么，小小意思。"(3)你勉强接受——"好吧，但您真的不用这样。"这个仪式将简单的物品交换转化为确认关系的交流。',
    category: 'keqi',
  },
  {
    id: 'gift_reciprocate',
    scenarioId: 'gift',
    icon: '🔄',
    titleEn: 'The Reciprocity Clock',
    titleZh: '回礼的时钟',
    textEn:
      'Gift-giving in Chinese culture creates renqing (人情) — a social debt that must eventually be repaid. But timing matters: reciprocating too quickly can seem like you\'re trying to "cancel the debt" rather than build a relationship. Reciprocating too late suggests you forgot. The sweet spot is usually at the next natural occasion — a festival, a visit, or when they need something.',
    textZh:
      '中国文化的送礼创造了人情——一种最终必须偿还的社交债务。但时机很重要：回礼太快似乎你想"销账"而非建立关系。回礼太晚暗示你忘了。最佳时机通常是下一个自然的场合——节日、拜访或他们需要什么的时候。',
    category: 'renqing',
  },
  {
    id: 'gift_value',
    scenarioId: 'gift',
    icon: '⚖️',
    titleEn: 'The Value Balance',
    titleZh: '价值的平衡',
    textEn:
      'The value of a gift in Chinese culture should match the relationship: too expensive creates uncomfortable obligation, too cheap suggests you don\'t value the relationship. For a casual acquaintance, fruit or tea is appropriate. For a close relative, something more substantial. For a business relationship, the gift should be nice but not bribe-level. Getting the value right is a form of social intelligence.',
    textZh:
      '中国文化的礼物价值应与关系相称：太贵重造成不舒服的人情债，太便宜暗示你不重视这段关系。对普通熟人，水果或茶叶是适当的。对近亲，可以更贵重一些。对商业关系，礼物应该体面但不是贿赂级别。拿捏好价值是一种社交智慧。',
    category: 'guanxi',
  },

  // === Bill ===
  {
    id: 'bill_fight_why',
    scenarioId: 'bill',
    icon: '💰',
    titleEn: 'Why Fight to Pay?',
    titleZh: '为何抢着付钱？',
    textEn:
      'In Chinese culture, fighting to pay the bill isn\'t about the money — it\'s about demonstrating: (1) Generosity — you\'re not petty, (2) Relationship value — the friendship matters more than money, (3) Social capability — you\'re doing well enough to treat others. The person who pays gains mianzi (face) and creates a warm renqing debt that strengthens the bond.',
    textZh:
      '在中国文化中，抢着买单不是为了钱——是为了展示：(1)慷慨——你不小气，(2)关系价值——友谊比钱重要，(3)社交能力——你过得不错，可以请客。付钱的人获得了面子，并创造了温暖的人情债来加强关系纽带。',
    category: 'face',
  },
  {
    id: 'bill_face_game',
    scenarioId: 'bill',
    icon: '🎪',
    titleEn: 'The Face Game at the Table',
    titleZh: '餐桌上的面子博弈',
    textEn:
      'The bill battle is a micro-drama of Chinese social dynamics. Each person wants to pay, but only one can win. The winner gets face (mianzi). The "loser" must save face by clearly committing to pay next time — and must actually follow through. Saying "next time is on me" without meaning it is worse than not saying it at all.',
    textZh:
      '买单战是中国社交动态的微型戏剧。每个人都想付钱，但只有一个人能赢。赢家得到面子。"输家"必须明确承诺下次请客来维护面子——而且必须真的兑现。说了"下次我来"而不兑现，比不说更糟糕。',
    category: 'face',
  },
  {
    id: 'bill_aa_taboo',
    scenarioId: 'bill',
    icon: '📊',
    titleEn: 'The AA Taboo',
    titleZh: 'AA制的忌讳',
    textEn:
      'Splitting the bill equally ("AA制") is increasingly common among young Chinese friends, but it still carries a whiff of coldness in certain contexts — especially with older generations, in business settings, or when someone explicitly wants to treat. Suggesting AA can signal that you see the relationship as transactional rather than warm. The key is reading the room: with close young friends, AA is fine. With elders or in formal settings, let the face game play out.',
    textZh:
      'AA制在年轻中国朋友间越来越普遍，但在某些场合仍带有一丝冷漠——尤其是对长辈、商务场合或当有人明确想请客时。提议AA可能暗示你将关系视为交易性的而非温暖的。关键在于读气氛：与亲密年轻朋友，AA没问题。与长辈或正式场合，让面子博弈自然进行。',
    category: 'fencun',
  },
  {
    id: 'bill_secret_pay',
    scenarioId: 'bill',
    icon: '🕵️',
    titleEn: 'The Secret Payment Strategy',
    titleZh: '偷偷买单的策略',
    textEn:
      'The most elegant way to win the bill battle? Excuse yourself to the bathroom halfway through the meal and quietly pay at the counter. When the check "arrives" and it\'s already paid, you\'ve won definitively. This strategy shows: (1) You\'re serious about treating, (2) You\'re sophisticated enough to know this move, (3) You value harmony over dramatic confrontation. It\'s the bill-battle equivalent of a checkmate.',
    textZh:
      '赢得买单大战最优雅的方式？用餐中途借口去洗手间，悄悄在柜台把单买了。当账单"到达"时已经付过了，你彻底赢了。这个策略展示：(1)你对请客是认真的，(2)你有足够的社交经验知道这招，(3)你重视和谐胜过戏剧化对抗。这是买单战的"将军"。',
    category: 'fencun',
  },

  // === Dinner ===
  {
    id: 'dinner_timing',
    scenarioId: 'dinner',
    icon: '⏰',
    titleEn: 'The Timing of Refusal',
    titleZh: '拒绝的时机',
    textEn:
      'When invited to stay for a meal, the timing of your eventual acceptance matters. Refuse once — too quick to accept. Refuse twice — appropriate. Refuse three times — now you seem like you really don\'t want to stay, and the host might stop insisting. The sweet spot is the second or third invitation. After that, accept warmly and offer to help.',
    textZh:
      '被邀请留下来吃饭时，最终接受的时机很重要。拒绝一次——接受得太快。拒绝两次——适当的。拒绝三次——现在你看起来真的不想留下，主人可能停止坚持。最佳时机是第二次或第三次邀请。之后，温暖地接受并主动提出帮忙。',
    category: 'fencun',
  },
  {
    id: 'dinner_accept_grace',
    scenarioId: 'dinner',
    icon: '🍽️',
    titleEn: 'Gracious Acceptance',
    titleZh: '优雅的接受',
    textEn:
      'When you finally accept a meal invitation, how you accept matters as much as when. The culturally Chinese way: show reluctance ("Well, if you insist..."), express gratitude ("Thank you for going to the trouble"), offer to help ("Let me at least set the table"), and compliment the food later. This transforms acceptance from taking into receiving — an active act of relationship-building.',
    textZh:
      '当你最终接受用餐邀请时，如何接受和何时接受同样重要。中国式的方式是：表现出勉强（"好吧，如果您坚持..."），表达感谢（"麻烦您了"），主动帮忙（"至少让我摆桌子吧"），之后赞美食物。这将接受从"索取"转化为"领受"——一种主动建立关系的行为。',
    category: 'keqi',
  },
  {
    id: 'dinner_contribute',
    scenarioId: 'dinner',
    icon: '🍇',
    titleEn: 'Never Arrive Empty-Handed',
    titleZh: '不空手上门',
    textEn:
      'When visiting a Chinese home around mealtime, bringing a small gift is customary — fruit, a bottle of wine, or a dish to share. This serves multiple purposes: (1) It shows gratitude in advance, (2) It gives you a role (not just a passive guest), (3) It makes accepting the invitation easier because you\'ve already given something back. Even a small gesture transforms the dynamic.',
    textZh:
      '在饭点拜访中国家庭时，带点小礼物是惯例——水果、一瓶酒或一道菜。这有多种目的：(1)事先表达感谢，(2)给你一个角色（不只是被动客人），(3)因为你已经有所回报，接受邀请变得更容易。即使一个小姿态也能改变互动动态。',
    category: 'renqing',
  },

  // === Workplace ===
  {
    id: 'workplace_gift_value',
    scenarioId: 'workplace',
    icon: '💼',
    titleEn: 'The Salaryman\'s Dilemma',
    titleZh: '职场人的两难',
    textEn:
      'Accepting an expensive gift from a senior colleague creates a complex web of obligation. If you refuse outright, you disrespect their gesture and damage guanxi. If you accept eagerly, you seem entitled. If you accept but never reciprocate, you accumulate renqing debt. The art is: accept with humility, express deep gratitude, and find an appropriate way to reciprocate that respects the hierarchy.',
    textZh:
      '接受前辈同事的贵重礼物创造了一个复杂的人情网。如果直接拒绝，你不尊重他们的姿态并损害了关系。如果急切接受，你显得理所应当。如果接受但从不回报，你积累人情债。艺术在于：谦虚地接受，表达深深的感谢，并找到尊重等级秩序的适当方式回报。',
    category: 'renqing',
  },
  {
    id: 'workplace_reciprocate',
    scenarioId: 'workplace',
    icon: '🎯',
    titleEn: 'Reciprocating Without Challenging',
    titleZh: '不挑战权威的回报',
    textEn:
      'When a senior gives you a gift, reciprocating with something of equal monetary value can backfire — it may seem like you\'re trying to "cancel" the obligation rather than accept their generosity. Better approaches: (1) Offer a favor or skill ("Let me help with your English presentation"), (2) Treat them to a meal (experiences feel different than objects), (3) Reciprocate at an appropriate later time when it feels natural, not transactional.',
    textZh:
      '当前辈送你礼物时，用等值物品回报可能适得其反——可能看起来你想"取消"人情债而非接受他们的慷慨。更好的做法：(1)提供技能或帮助（"让我帮您做英文演示"），(2)请他们吃顿饭（体验和物品感觉不同），(3)在适当的时候自然回报，而非交易式的。',
    category: 'guanxi',
  },
  {
    id: 'workplace_boundary',
    scenarioId: 'workplace',
    icon: '🚧',
    titleEn: 'Guanxi vs. Boundaries',
    titleZh: '人情与边界',
    textEn:
      'Chinese workplaces often blur professional and personal boundaries through guanxi. A boss might ask about your family, a colleague might give personal gifts. For someone raised in a Western professional culture, this can feel invasive. The key: these gestures are relationship-building, not boundary violations. But you can still maintain balance — accept the warmth while keeping your own comfort zone. Genuine relationships can accommodate both.',
    textZh:
      '中国职场经常通过关系模糊专业和个人的边界。老板可能问你的家庭，同事可能送私人礼物。对于在西方职业文化中长大的人来说，这可能感觉像越界。关键：这些姿态是建立关系，而非侵犯边界。但你仍可以保持平衡——接受温暖的同时维护自己的舒适区。真正的关系可以容纳两者。',
    category: 'guanxi',
  },

  // === Refusal ===
  {
    id: 'refusal_indirect',
    scenarioId: 'refusal',
    icon: '🗣️',
    titleEn: 'The Indirect No',
    titleZh: '委婉的拒绝',
    textEn:
      'In Chinese communication, hanxu (含蓄) — implicitness — is a virtue. Saying "no" directly can feel violent. Instead, people use: vague responses ("Let me think about it..."), topic changes, partial solutions, external constraints ("My spouse handles that..."), or simply not responding. The listener is expected to read between the lines. A vague answer to a request usually means "no." Pushing for a direct answer after that forces the person to either lie or damage the relationship.',
    textZh:
      '在中国沟通中，含蓄是一种美德。直接说"不"可能显得粗暴。相反，人们使用：含糊回应（"我考虑一下..."）、转换话题、部分解决方案、外部限制（"这个我妻子管..."）、或干脆不回应。听者应该读懂言外之意。对请求的含糊回答通常意味着"不"。在那之后追问直接答案会迫使对方要么说谎、要么伤害关系。',
    category: 'guanxi',
  },
  {
    id: 'refusal_excuse',
    scenarioId: 'refusal',
    icon: '🛡️',
    titleEn: 'The Art of the Excuse',
    titleZh: '借口的艺术',
    textEn:
      'When refusing a request in Chinese culture, a good excuse protects everyone\'s face. The best excuses: (1) Cite external constraints — "My wife controls the finances" (it\'s not ME refusing, it\'s circumstances), (2) Reference a higher authority — "The boss won\'t allow it," (3) Appeal to a prior commitment — "I already promised my mother..." The key: make the refusal about external factors, not your unwillingness to help.',
    textZh:
      '在中国文化中拒绝请求时，一个好的借口能保护所有人的面子。最好的借口：(1)引用外部限制——"我妻子管财务"（不是我拒绝，是情况不允许），(2)引用更高权威——"老板不会同意的"，(3)诉诸先前承诺——"我已经答应我妈了..."。关键：将拒绝归因于外部因素，而非你不想帮忙。',
    category: 'face',
  },
  {
    id: 'refusal_delay',
    scenarioId: 'refusal',
    icon: '⏳',
    titleEn: 'Delay as Diplomacy',
    titleZh: '拖延的外交',
    textEn:
      'When you can\'t immediately say yes or no, the culturally Chinese approach is to delay gracefully. "Let me see what I can do" or "I\'ll check and get back to you" buys time and softens the interaction. If the answer is ultimately no, the delay cushions the blow. If the requester senses the delay, they may stop asking — saving everyone from an explicit refusal. This is diplomacy through time.',
    textZh:
      '当你无法立即说好或不好时，中国式的方法是优雅地拖延。"我看看能做什么"或"我查一下再回复你"争取了时间并软化了互动。如果最终答案是不，拖延缓冲了打击。如果请求者感知到拖延，他们可能不再追问——避免了所有人的明确拒绝。这是通过时间进行的外交。',
    category: 'fencun',
  },
  {
    id: 'refusal_third_party',
    scenarioId: 'refusal',
    icon: '👥',
    titleEn: 'The Third-Party Buffer',
    titleZh: '第三方的缓冲',
    textEn:
      'In Chinese culture, difficult messages are sometimes delivered through a third party. If you can\'t directly refuse someone, you might ask a mutual friend to gently convey your inability to help. This preserves the direct relationship by avoiding an awkward face-to-face refusal. The third party acts as a social buffer, absorbing the tension while keeping the primary relationship intact.',
    textZh:
      '在中国文化中，困难的消息有时通过第三方传达。如果你无法直接拒绝某人，你可能请一个共同的朋友委婉地传达你无法帮忙。这通过避免尴尬的面对面拒绝来保护直接关系。第三方充当社交缓冲，吸收紧张同时保持主体关系完好。',
    category: 'guanxi',
  },
];

export function getInsightById(id: string): AuntieWisdom | undefined {
  return AUNTIE_WISDOMS.find((w) => w.id === id);
}

export function getInsightsByScenario(scenarioId: ScenarioId): AuntieWisdom[] {
  return AUNTIE_WISDOMS.filter((w) => w.scenarioId === scenarioId);
}

export function getInsightsByCategory(category: AuntieWisdom['category']): AuntieWisdom[] {
  return AUNTIE_WISDOMS.filter((w) => w.category === category);
}

export const TOTAL_INSIGHTS = AUNTIE_WISDOMS.length;
