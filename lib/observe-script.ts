import type { ScenarioId } from './scenario-config';

/**
 * Hardcoded observe-mode dialogue scripts.
 * Each scenario has exactly 3 rounds following the 三推三让 ritual pattern.
 * No LLM calls — dialogues are pre-written for reliability and educational quality.
 */

export interface ObserveRoundData {
  /** Scene-setting context (round 1 only) */
  contextText?: string;
  /** NPC dialogue with action cues */
  npcText: string;
  /** Player's response with action cues */
  playerText: string;
  /** Only the NPC's inner thoughts — displayed on NPC message bubble */
  npcThoughts: string;
  /** Only the Player's inner thoughts — displayed on Player message bubble */
  playerThoughts: string;
  /** Cultural analysis shared across the exchange — separate expandable button */
  culturalSubtext: string;
  /** Wisdom card ID to surface this round */
  wisdomId?: string;
  /** Show "conversation is winding down" hint (round 3) */
  endAvailable?: boolean;
}

export interface ObserveScript {
  scenarioId: ScenarioId;
  rounds: ObserveRoundData[];
}

// ─── Hongbao (红包) ───────────────────────────────────────────────

const HONGBAO_EN: ObserveScript = {
  scenarioId: 'hongbao',
  rounds: [
    {
      contextText:
        'The living room glows warm with red paper lanterns. The TV murmurs the Spring Festival Gala in the background. The air carries the sweet scent of tangerine peels and jasmine tea. Auntie Wang rises from the sofa, a bright red envelope materializing in her hand like a magic trick.',
      npcText:
        '(pulls the red envelope from her pocket with both hands, beaming) Lái lái, xiǎo bǎobèi — come here, little one! Xīnnián kuàilè! This hóngbāo is for you — for good luck and a bright new year! (presses it toward you eagerly)',
      playerText:
        "(steps back slightly, hands raised in polite protest) Oh! Auntie Wang, nǐ tài kèqi le — you're too kind! I'm not a child anymore, I have a job now. I really can't accept this…",
      npcThoughts:
        "The first refusal — exactly as expected. This child was raised abroad but still has Chinese manners in their bones. Now I must insist — that's how this dance works.",
      playerThoughts:
        'Taking money from elders feels strange as an adult. In the West, you stop getting cash gifts after college. But I sense refusing outright might be wrong too… better to show modesty first.',
      culturalSubtext:
        'This is **kèqi (客气)** — the ritual of polite refusal. In Chinese culture, accepting immediately can appear greedy. The first "no" is expected and welcomed — it shows the person is modest (**qiānxū, 谦虚**) and not presumptuous.',
      wisdomId: 'hongbao_keqi',
    },
    {
      npcText:
        "(waves a hand dismissively, clicking her tongue) Āiyā, shuō shénme ne — what nonsense! In my eyes, you'll always be that little baby I held at the airport. Having a job just makes me prouder! (thrusts the envelope forward again) Ná zhe, ná zhe — take it, take it! It's xīnnián hóngbāo — New Year blessing money, not salary!",
      playerText:
        "(hesitates, hands still half-raised but wavering) Auntie, nín zhēnshi tài hǎo le — you're truly too good to me… But I mean it, this feels like too much. You should keep it for yourself, buy something nice…",
      npcThoughts:
        'A second refusal — good, this child understands the rhythm. But I can see their resolve weakening. The slight waver in their voice tells me they want to accept, they just need permission. One more push should do it.',
      playerThoughts:
        "She really means it. This isn't just politeness — she genuinely wants to give this to me. Am I being rude by refusing again? In Chinese culture, I've heard you're supposed to refuse three times… maybe I should accept soon?",
      culturalSubtext:
        'The second refusal is part of **sān tuī sān ràng (三推三让)** — the "three pushes, three yields" ritual. By now, both parties understand this is a performance of mutual respect. The giver gains **miànzi (面子, face)** by being generous; the receiver shows humility by hesitating.',
      wisdomId: 'hongbao_rule_of_three',
    },
    {
      npcText:
        "(grabs your hand firmly but warmly, pressing the envelope into your palm) Tīng huà — listen to your auntie! (her voice softens) When you were little and far away across the ocean, I couldn't give you hóngbāo every year. Let me make up for it now. This is my blessing for you — bǎoyòu nǐ píngpíngānān — may it protect you and keep you safe. Don't refuse your auntie's heart.",
      playerText:
        '(eyes glistening slightly, finally closes fingers around the envelope and bows deeply) Xièxie, āyí… Thank you, Auntie Wang. (looks up with a warm smile) Wǒ shōu xià le — I accept it. Zhù nín xīnnián kuàilè, shēntǐ jiànkāng — wishing you happiness and good health in the new year!',
      npcThoughts:
        'There we go. Three rounds — the perfect number. They accepted with genuine warmth, not greed. Look at that bow, that sincere blessing — this child has a Chinese heart after all. I feel so full, so happy.',
      playerThoughts:
        "I get it now. This isn't about money — it's about love, connection, blessing. Refusing a third time would have actually hurt her feelings. Accepting with genuine gratitude is the right thing to do. I feel… welcomed. Like I belong.",
      culturalSubtext:
        'The third round completes the 三推三让 cycle. Accepting now is not greedy — it\'s **gracious**. The key is HOW you accept: with both hands, a slight bow, sincere thanks, and a returned blessing (**zhùfú, 祝福**). This transforms the transaction into a moment of genuine human connection — **rénqíng de jiāohuàn (人情的交换)** — the exchange of human warmth.',
      wisdomId: 'hongbao_face_both',
      endAvailable: true,
    },
  ],
};

const HONGBAO_ZH: ObserveScript = {
  scenarioId: 'hongbao',
  rounds: [
    {
      contextText:
        '客厅里挂着红灯笼，暖意融融。电视里春节联欢晚会的声音低低地响着，空气中弥漫着橘子皮和茉莉花茶的清香。王阿姨从沙发上站起来，一个鲜红的信封像变魔术一样出现在她手中。',
      npcText:
        '（双手从口袋里掏出红包，笑容满面）来来来，小宝贝——过来！新年快乐！这个红包是给你的——讨个吉利，保佑你新的一年顺顺利利！（热切地把红包往你面前递）',
      playerText:
        '（微微后退，双手举起做出礼貌推辞的姿势）哎呀，王阿姨，您太客气了！我都不是小孩子了，现在已经工作了，真的不能收这个……',
      npcThoughts:
        '第一次推辞——完全在意料之中。这孩子虽然在国外长大，骨子里还是有中国人的礼数。现在我必须坚持——这就是这个舞蹈的规则。',
      playerThoughts:
        '作为一个成年人，从长辈那里拿钱感觉怪怪的。在西方，大学毕业后就不会再收长辈的现金礼物了。但我隐约觉得直接拒绝也不对……还是先表示谦虚吧。',
      culturalSubtext:
        '这就是**客气**——礼貌性推辞的仪式。在中国文化中，立刻收下会显得贪心。第一次说"不要"是被期待的，甚至是被欢迎的——这表明这个人谦虚（**谦虚**），不理所当然。',
      wisdomId: 'hongbao_keqi',
    },
    {
      npcText:
        '（挥挥手，咂了咂嘴）哎呀，说什么呢！在我眼里，你永远是当年在机场我抱过的那个小宝宝。工作了就更让阿姨骄傲了！（又把红包往前推了推）拿着拿着！这是新年红包——是祝福钱，不是工资！',
      playerText:
        '（犹豫着，双手仍半举着但有些动摇）阿姨，您真是太好了……但我真的觉得这太多了。您自己留着，买点喜欢的东西吧……',
      npcThoughts:
        '第二次推辞——很好，这孩子懂节奏。但我能看出他们的决心在动摇。声音里那一点点犹豫告诉我，他们其实想收，只是需要一点许可。再推一把应该就行了。',
      playerThoughts:
        '她是认真的。这不只是客套——她真心想给我这个红包。我再拒绝是不是有点失礼了？在中国文化里，我好像听说过要推辞三次……也许我该准备接受了？',
      culturalSubtext:
        '第二次推辞是**三推三让**仪式的一部分。此时双方都明白这是一场互相尊重的表演。给予者通过慷慨获得**面子**；接受者通过犹豫展示谦逊。',
      wisdomId: 'hongbao_rule_of_three',
    },
    {
      npcText:
        '（紧紧但温柔地握住你的手，把红包按到你的掌心里）听话——听阿姨的话！（声音柔和下来）你小时候远在大洋彼岸，阿姨每年都没法给你红包。现在让阿姨补上。这是阿姨给你的祝福——保佑你平平安安。别拒绝阿姨的心意。',
      playerText:
        '（眼眶微微湿润，终于合拢手指握住红包，深深鞠了一躬）谢谢阿姨……谢谢王阿姨。（抬起头，露出温暖的笑容）我收下了。祝您新年快乐，身体健康！',
      npcThoughts:
        '成了。三轮——恰到好处。他们是带着真诚的温暖接受的，不是贪心。看看那个鞠躬，那句真诚的祝福——这孩子骨子里还是中国人。阿姨心里满满的，真高兴。',
      playerThoughts:
        '我现在明白了。这跟钱没关系——是爱、是连接、是祝福。拒绝第三次反而会伤了她的心。带着真诚的感激接受才是正确的做法。我感觉……被接纳了。像是回家了。',
      culturalSubtext:
        '第三轮完成了三推三让的循环。此时接受不是贪心——而是**得体的**。关键在于**怎么**接受：双手接、微微鞠躬、真诚道谢、回赠祝福（**祝福**）。这把交易转化成了真正的人与人之间的连接——**人情的交换**。',
      wisdomId: 'hongbao_face_both',
      endAvailable: true,
    },
  ],
};

// ─── Compliment (应对夸奖) ────────────────────────────────────────

const COMPLIMENT_EN: ObserveScript = {
  scenarioId: 'compliment',
  rounds: [
    {
      contextText:
        "The late afternoon sun filters through lace curtains in Auntie Li's living room. The tea is freshly poured, steam curling upward. Photos of you as a baby sit on the shelf — your mother must have sent them. Auntie Li sets down her cup and studies you with undisguised delight.",
      npcText:
        "(sets down her teacup, eyes crinkling with a warm smile) Āiyā, look at you! Your mother showed me photos, but in person — wow! (clasps her hands together) Nǐ de Zhōngwén shuō de tài hǎo le — your Chinese is so good! How did you learn to speak so well, growing up abroad? I'm so impressed!",
      playerText:
        "(ducks head slightly, waves both hands in front of chest) Nǎlǐ nǎlǐ — where, where! Auntie Li, nín guòjiǎng le — you flatter me. My Chinese is really just so-so… I still mix up tones all the time. (laughs awkwardly) Actually, I probably sound like a toddler!",
      npcThoughts:
        "Ah, the classic 'nǎlǐ nǎlǐ' — this child knows something! Modest, not arrogant. Most young people these days just say 'thank you' like foreigners. But they genuinely seem embarrassed… maybe they really don't realize how good their Chinese is. All the more reason to praise them.",
      playerThoughts:
        "My instinct is to say 'thank you' — that's what I was taught growing up. But I've learned that in Chinese culture, accepting a compliment directly can seem arrogant. 'Nǎlǐ nǎlǐ' feels safer. Though honestly… it feels weird to deny something I worked hard to achieve.",
      culturalSubtext:
        '**Nǎlǐ nǎlǐ (哪里哪里)** — literally "where? where?" — is the classic Chinese response to a compliment. It implies the praised quality is nowhere to be found. This is **qiānxū (谦虚)**, the cultural virtue of humility. In Chinese culture, individual achievement is always embedded in social relationships — deflecting praise acknowledges that your success is not entirely your own.',
      wisdomId: 'compliment_humble',
    },
    {
      npcText:
        "(waves dismissively, leaning forward with enthusiasm) Bù bù bù — no no no! I'm serious! (taps the table for emphasis) Even your accent — you sound like a real Beijinger! And your mom says you can read characters too? (shakes head in wonder) Most kids who grew up overseas can barely say 'nǐ hǎo.' You must have worked so hard. Your parents must be so proud.",
      playerText:
        "(rubs the back of neck, genuinely embarrassed but smiling) Well… I did study a lot. But honestly, it's all thanks to my parents — they never let me forget where I came from. (looks down at tea) And my Chinese teacher was really patient with me. Without them, I'd probably be hopeless.",
      npcThoughts:
        "Now they're crediting their parents and teacher — this is deeply Chinese. A child who remembers their roots, who doesn't take all the credit. Their parents raised them well, even across the ocean. I feel a swell of warmth. This is a good child.",
      playerThoughts:
        "Deflecting to my parents feels more natural than 'nǎlǐ nǎlǐ.' It's actually true — they did so much. And somehow, saying it out loud makes me feel closer to them. Maybe this isn't just about being modest. Maybe it's about remembering that no one succeeds alone.",
      culturalSubtext:
        'Crediting family and teachers is a sophisticated form of **qiānxū**. It deflects praise while expressing **xiào (孝, filial piety)** — gratitude toward those who raised and taught you. This response does three things: shows modesty, honors relationships, and makes you more likable than claiming sole credit ever could.',
      wisdomId: 'compliment_return',
    },
    {
      npcText:
        "(reaches across the table to pat your hand, eyes glistening slightly) Nǐ zhēnshi gè hǎo háizi — you're truly a good child. (sits back, voice warm with emotion) You know, when your mother told me you were coming back to China, I wondered… would you feel Chinese? Would China feel like home? (nods slowly) But listening to you now — nǐ yǒu Zhōngguó rén de xīn. You have a Chinese heart. That's not something you learn from textbooks.",
      playerText:
        "(eyes welling up slightly, places other hand on top of Auntie Li's) Xièxie, āyí… that means so much. (takes a breath) I've spent so long feeling like I don't fully belong anywhere — not quite American, not quite Chinese. But moments like this… (smiles warmly) they help me feel like maybe I can be both. And Auntie Li — nín zuò de chá zhēn hǎo hē — the tea you made is wonderful. You have to teach me how to brew it like this.",
      npcThoughts:
        "Ah… they turned it around and complimented MY tea! Smooth, very smooth. This child has instinct — they know how to return warmth. And those words about belonging… my heart aches and swells at the same time. They are family. Family.",
      playerThoughts:
        "I'm not deflecting anymore. I'm genuinely connecting. And returning a compliment feels different from just accepting one — it's like we're building something together, not just exchanging words. Also… her tea really IS amazing. I want to learn from her. That's not politeness, that's truth.",
      culturalSubtext:
        'The third round demonstrates **reciprocal warmth** — returning a compliment naturally while building genuine connection. In Chinese social dynamics, the goal is not to "win" the exchange but to create **rénqíng (人情)** — human warmth that flows both ways. The player has moved from defensive deflection to authentic engagement, which is the highest form of cultural fluency.',
      wisdomId: 'compliment_deflect',
      endAvailable: true,
    },
  ],
};

const COMPLIMENT_ZH: ObserveScript = {
  scenarioId: 'compliment',
  rounds: [
    {
      contextText:
        '午后的阳光透过李阿姨家的蕾丝窗帘洒进来。茶刚沏好，热气袅袅升起。书架上摆着你小时候的照片——一定是妈妈寄给她的。李阿姨放下茶杯，满脸欣喜地打量着你。',
      npcText:
        '（放下茶杯，眼角笑出细纹）哎呀，看看你！你妈妈给我看过照片，但真人——哇！（双手合十）你的中文说得太好了！在国外长大怎么能说得这么好？阿姨太佩服了！',
      playerText:
        '（微微低头，双手在胸前摆了摆）哪里哪里！李阿姨，您过奖了。我的中文真的马马虎虎……声调还老是搞混。（不好意思地笑了笑）其实，我可能说得像个小宝宝！',
      npcThoughts:
        '啊，"哪里哪里"——这孩子懂点门道！谦虚，不自大。现在的年轻人多半直接说"谢谢"跟外国人似的。但他们是真心不好意思……也许他们真的没意识到自己的中文有多好。那我更得夸了。',
      playerThoughts:
        '我的本能是说"谢谢"——这是我从小在国外学到的。但我了解到在中国文化中，直接接受赞美可能显得自大。"哪里哪里"感觉更安全。不过说实话……否认自己努力得来的东西，感觉有点奇怪。',
      culturalSubtext:
        '**哪里哪里**——字面意思是"where? where?"——是中国式回应赞美的经典方式。它暗示被赞美的品质根本不存在。这是**谦虚**，中国文化的谦逊美德。在中国文化中，个人成就始终嵌入社会关系中——转移赞美就是承认你的成功不全是自己的功劳。',
      wisdomId: 'compliment_humble',
    },
    {
      npcText:
        '（摆摆手，身体前倾，热情洋溢）不不不！我说真的！（拍拍桌子强调）连你的口音——听起来像地道北京人！你妈妈还说你能认汉字？（摇摇头，赞叹不已）大多数在海外长大的孩子连"你好"都说不利索。你一定下了很多功夫。你父母一定很骄傲。',
      playerText:
        '（摸了摸后颈，真的不好意思但微笑着）嗯……我确实学了很多。不过说实话，这都多亏了我爸妈——他们从没让我忘记自己从哪里来。（低头看着茶杯）还有我的中文老师特别耐心。没有他们，我肯定说得一塌糊涂。',
      npcThoughts:
        '现在他们把功劳归于父母和老师——这非常中国。一个不忘本的孩子，不独占功劳。他们的父母教得好啊，哪怕隔着大洋。我心里涌起一股暖流。这是个好孩子。',
      playerThoughts:
        '把功劳归于父母比说"哪里哪里"感觉更自然。这是真的——他们确实付出了很多。而且，说出了口反而让我感觉离他们更近了。也许这不只是关于谦虚。也许是关于记住没有谁能独自成功。',
      culturalSubtext:
        '归功于家人和老师是**谦虚**的进阶形式。它在转移赞美的同时表达了**孝**——对养育和教导自己的人的感恩。这个回应一举三得：表现谦虚、尊重关系、比独占功劳更讨人喜欢。',
      wisdomId: 'compliment_return',
    },
    {
      npcText:
        '（伸手越过桌子拍拍你的手，眼眶微微发亮）你真是个好孩子。（靠回椅背，声音里带着情感）你知道吗，你妈妈跟我说你要回中国的时候，我就在想……你会觉得自己是中国人吗？中国会让你有家的感觉吗？（缓缓点头）但听了你这番话——你有中国人的心。这不是课本里能学来的。',
      playerText:
        '（眼眶也有些湿润，把另一只手放在李阿姨的手上）谢谢阿姨……这对我太重要了。（深吸一口气）我一直觉得自己哪里都不完全属于——不够美国人，也不够中国人。但像这样的时刻……（温暖地笑了）让我觉得也许我可以两样都是。还有李阿姨——您做的茶真好喝。您一定要教我怎么泡出这个味道。',
      npcThoughts:
        '啊……他们反过来夸我的茶了！真会来事儿，这孩子有灵性——懂得回馈温暖。那些关于归属感的话……让我又心疼又欣慰。他们就是家人。家人。',
      playerThoughts:
        '我不再是在转移了。我是真的在连接。而且回敬一个赞美和单纯接受赞美的感觉不同——我们像是在一起构建什么，而不只是交换话语。还有……她的茶是真的好喝。我想跟她学。这不是客套，是真心。',
      culturalSubtext:
        '第三轮展示了**互相温暖**——在建立真实连接的同时自然地回敬赞美。在中国社交动态中，目标不是"赢得"交流，而是创造**人情**——双向流动的人间温暖。玩家已经从防御性的转移走向了真实的互动，这是文化熟练度的最高境界。',
      wisdomId: 'compliment_deflect',
      endAvailable: true,
    },
  ],
};

// ─── Guest (做客礼仪) ─────────────────────────────────────────────

const GUEST_EN: ObserveScript = {
  scenarioId: 'guest',
  rounds: [
    {
      contextText:
        "Uncle Zhang's apartment is modest but immaculate — slippers lined up by the door, a calligraphy scroll on the wall reading 家和万事兴 (family harmony brings prosperity). The moment you step inside, he springs into action like a man on a mission. His eyes are bright — it's been years since he last saw you.",
      npcText:
        "(ushers you in with sweeping gestures, practically dancing with excitement) Kuài jìnlái, kuài jìnlái — come in, come in! (points to a large armchair by the window, the best seat in the room) Lái, zuò zhèr — sit here! This is the most comfortable spot. (already heading toward the kitchen) Wǒ gěi nǐ pào chá — let me make you tea! You must be tired from the trip.",
      playerText:
        "(stands near the door, hands raised modestly) Uncle Zhang, bù yòng zhème máfan — no need to go to so much trouble! (glances at the armchair) Oh, that's clearly your seat — I'll just sit here on the sofa. Really, I'm fine! And please don't fuss with tea, water is perfectly fine…",
      npcThoughts:
        "First refusal — of course. They're being kèqi. But look at them standing by the door like a stranger! I'm their uncle — distant or not, family is family. If I let them sit on the sofa and drink plain water, what kind of host would I be? No, I must insist properly.",
      playerThoughts:
        "That armchair is clearly the best seat — probably where Uncle Zhang sits every day. Taking it feels presumptuous. And I don't want to trouble him with tea when I'm just dropping by. In Western culture, you respect the host by not imposing. But here… I sense refusing might actually be imposing in a different way?",
      culturalSubtext:
        'The guest\'s initial refusal is **kèqi (客气)** — polite deference. In Chinese hospitality, the host\'s offers and the guest\'s refusals form a ritual: the host shows generosity, the guest shows modesty. Accepting the first offer would seem entitled, but never accepting would seem cold. The art is in the dance.',
      wisdomId: 'guest_seating',
    },
    {
      npcText:
        "(waves both hands, brow furrowing in exaggerated disapproval) Shénme nǐ de wǒ de — what's this 'yours' and 'mine'! (marches over and gently but firmly guides you toward the armchair) In this house, the guest sits in the best seat — zhè shì guīju, this is the rule! (already pouring tea from a thermos) And plain water? Bù xíng bù xíng — absolutely not! I have some nice tieguanyin — tiěguānyīn — my friend brought it from Fujian. You have to try it. (sets a plate of sunflower seeds and dried fruit on the table) Chī ba, chī ba — eat, eat!",
      playerText:
        "(reluctantly settles into the armchair but sits on the edge, still hesitant) Uncle Zhang, nín tài rèqíng le — you're too hospitable… (accepts the tea cup with both hands) Okay, okay, the tea I'll try — xièxie. But really, you didn't need to prepare all this just for me. (glances at the spread of snacks) I just ate before coming…",
      npcThoughts:
        "Good — they took the seat, they accepted the tea. But now they're saying they already ate? Nonsense. A guest who doesn't eat is a guest who doesn't feel at home. I need to push a little more. The sunflower seeds at least — something small, easy.",
      playerThoughts:
        "The armchair is incredibly comfortable — he was right about that. And the tea smells amazing. But every time I accept something, he brings out more! If I say yes to the snacks, is he going to cook a whole meal? I'm trying to find the line between being a gracious guest and being a burden.",
      culturalSubtext:
        'Round two: the host escalates. Uncle Zhang is performing **rèqíng (热情)** — warm, insistent hospitality. In Chinese culture, a host who doesn\'t insist enough is a bad host. The guest\'s continued hesitation shows they understand the rules: don\'t be greedy, don\'t presume. But the host\'s job is to overcome that hesitation — with warmth, not pressure.',
      wisdomId: 'guest_refuse_food',
    },
    {
      npcText:
        "(pulls up a small stool and sits beside you, voice softening) Háizi, tīng shūshu shuō — child, listen to your uncle. (places a few dried dates in your hand) When your father called and said you were coming, I didn't sleep well for three nights. (looks at you with old, kind eyes) The last time I saw you, you were this tall. (holds hand at knee height) Now look at you — all grown up, crossing oceans to come home. (pats your knee) Let your uncle spoil you a little. It makes me happy. Zuò zhe chī, bùyào kèqi — sit and eat, don't stand on ceremony.",
      playerText:
        "(finally relaxes into the chair, pops a dried date into mouth, voice warm) Hǎo chī — these are delicious. (looks around the room, taking it in properly for the first time) Uncle Zhang… nín de jiā hěn wēnnuǎn — your home feels very warm. (meets his eyes) Xièxie nín. Not just for the tea and snacks — for making me feel like I belong somewhere. (raises teacup slightly) Lái, wǒ jìng nín yī bēi — let me toast you with this tea.",
      npcThoughts:
        "There. Finally, they've relaxed. See how they're looking around the room now, really seeing it? They said my home is warm — that's the highest compliment a guest can give. And they're toasting me! This child has a good heart. Distance and years don't change blood.",
      playerThoughts:
        "The dates are sweet and chewy — comfort food I didn't know I needed. And something shifted when he talked about not sleeping… this isn't about rules or rituals anymore. He genuinely cares. Accepting his hospitality isn't being a burden — it's letting him love me in the only way he knows how. I feel… at home.",
      culturalSubtext:
        'The third round completes the hospitality cycle. The guest has moved from ritual refusal to genuine acceptance — the **wēnnuǎn (温暖, warmth)** has become real, not performed. The key insight: Chinese hospitality isn\'t about food and seating — it\'s about making someone feel they belong. The tea toast (**jìng chá, 敬茶**) is the guest\'s reciprocal gesture, turning a one-way reception into a mutual exchange of respect.',
      wisdomId: 'guest_leaving',
      endAvailable: true,
    },
  ],
};

const GUEST_ZH: ObserveScript = {
  scenarioId: 'guest',
  rounds: [
    {
      contextText:
        '张叔叔的公寓不大但一尘不染——拖鞋整齐排在门边，墙上挂着"家和万事兴"的书法卷轴。你一踏进门，他就像接到任务一样行动起来。他的眼睛亮亮的——已经好多年没见过你了。',
      npcText:
        '（大手一挥把你迎进门，兴奋得几乎跳起来）快进来快进来！（指着窗边一张大扶手椅，屋里最好的位置）来，坐这儿！这个位置最舒服。（已经往厨房走了）我给你泡茶！路上一定累了吧。',
      playerText:
        '（站在门口附近，双手谦虚地举着）张叔叔，不用这么麻烦！（瞥了一眼扶手椅）哎呀，这明显是您的座位——我坐沙发上就好。真的，我没事！茶也别忙了，白开水就很好……',
      npcThoughts:
        '第一次推辞——当然。他们在客气。但看看他们站在门口跟个外人似的！我是他们的叔叔——远不远房，家人就是家人。让他们坐沙发喝白水，我算什么主人？不行，我得好好坚持。',
      playerThoughts:
        '那张扶手椅显然是最好的位置——可能张叔叔每天都坐在那里。坐上去感觉太自以为是了。而且我只是顺路来看看，不想麻烦他泡茶。在西方文化中，不给主人添麻烦才是尊重。但在这里……我隐约觉得拒绝反而可能是另一种添麻烦？',
      culturalSubtext:
        '客人的初次推辞是**客气**——礼貌的谦让。在中国待客之道中，主人的给予和客人的推辞形成了一个仪式：主人表现慷慨，客人表现谦虚。第一次就接受显得理所当然，但永远不接受又显得冷漠。艺术在于舞蹈之中。',
      wisdomId: 'guest_seating',
    },
    {
      npcText:
        '（双手挥舞，眉头皱起假装不满）什么你的我的！（大步走过来，温和但坚定地把你引向扶手椅）在这个家，客人坐最好的位子——这是规矩！（已经从暖壶里倒茶了）白水？不行不行！我有好的铁观音——朋友从福建带来的。你一定要尝尝。（往桌上摆了一碟瓜子和干果）吃吧吃吧！',
      playerText:
        '（不情愿地坐进扶手椅，但只坐了半边，还是有些犹豫）张叔叔，您太热情了……（双手接过茶杯）好好好，茶我尝尝——谢谢。不过说真的，您不用为我准备这么多。（瞥了一眼满桌零食）我刚刚吃过了才来的……',
      npcThoughts:
        '好——座位坐了，茶接了。但现在说吃过了？胡说。不吃的客人就是没把这儿当自己家。我得再推一把。至少吃点瓜子——小的，不占肚子。',
      playerThoughts:
        '扶手椅真的好舒服——他说的没错。茶也香极了。但我每接受一样，他就端出更多！要是我吃了零食，他是不是该做一整桌菜了？我在找那条线——既不失礼又不给人添负担。',
      culturalSubtext:
        '第二轮：主人升级。张叔叔在展示**热情**——温暖而坚持的款待。在中国文化中，不够坚持的主人不是好主人。客人持续的犹豫表明他们懂规矩：不贪心、不理所当然。但主人的任务就是克服那种犹豫——用温暖，不是压力。',
      wisdomId: 'guest_refuse_food',
    },
    {
      npcText:
        '（拉了个小板凳坐在你旁边，声音柔和下来）孩子，听叔叔说。（把几颗干枣放在你手心里）你爸打电话说你要回来，我三晚上没睡好。（用苍老而慈祥的眼睛看着你）上次见你，你才这么高。（手比在膝盖位置）现在看看你——长大了，跨过大洋回家了。（拍拍你的膝盖）让叔叔宠你一会儿。叔叔高兴。坐着吃，不要客气。',
      playerText:
        '（终于放松地靠进椅子里，塞了一颗干枣进嘴里，声音温暖）好吃——这枣真甜。（环顾四周，第一次认真打量这个房间）张叔叔……您的家很温暖。（对上他的目光）谢谢您。不只是为了茶和零食——是为了让我觉得我有地方可回。（微微举起茶杯）来，我敬您一杯。',
      npcThoughts:
        '终于放松了。看，他们现在在认真看房间了。说我的家温暖——这是客人能给的最高评价。还敬我茶！这孩子心好。距离和岁月改变不了血缘。',
      playerThoughts:
        '枣子又甜又有嚼劲——一种我不知道自己需要的安慰食物。当他说到睡不着觉的时候，有些东西变了……这不再是关于规则或仪式了。他是真心的。接受他的款待不是添麻烦——是让他用他唯一知道的方式爱我。我感觉……到家了。',
      culturalSubtext:
        '第三轮完成了待客循环。客人已从仪式性推辞走向了真诚接受——**温暖**已变得真实而非表演。核心洞见：中国式待客不是关于食物和座位——而是让人感到有归属。敬茶是客人的回馈姿态，将单向接受转化为双向的尊敬交流。',
      wisdomId: 'guest_leaving',
      endAvailable: true,
    },
  ],
};

// ─── Gift (送礼与收礼) ────────────────────────────────────────────

const GIFT_EN: ObserveScript = {
  scenarioId: 'gift',
  rounds: [
    {
      contextText:
        'The family dinner is winding down — plates are being cleared, tea is being poured. Around the table, faces are flushed with good food and laughter. Auntie Chen catches your eye, reaches into her bag, and produces a beautifully wrapped box with a silk ribbon. The table quiets — everyone knows what comes next.',
      npcText:
        "(slides the gift box across the table toward you with both hands, voice warm and a little shy) Lái, zhè shì gěi nǐ de — here, this is for you. (waves a hand dismissively before you can protest) I saw this on a trip to Suzhou last month and immediately thought of you. It's nothing expensive — zhǐshì yīdiǎn xiǎo yìsi — just a small gesture. (smiles expectantly, hands still extended)",
      playerText:
        "(eyes widen, instinctively pushes the box back slightly with both hands) Auntie Chen! Nín tài kèqi le — you're too kind! (shakes head, genuinely flustered) You really shouldn't have… I didn't bring anything for you. Zhè bù hǎoyìsi — this is embarrassing, I can't accept this. Please, you keep it…",
      npcThoughts:
        "Of course they're refusing — that's proper. If they grabbed it immediately I'd be a little disappointed. But they mentioned not bringing anything for me — ah, that guilt is also very Chinese. I need to reassure them: this gift has no strings attached. It's from the heart.",
      playerThoughts:
        "A gift — out of nowhere! I came empty-handed. In every culture I know, receiving a gift when you haven't brought one feels wrong. I need to show I'm not entitled to this. But also… her face is so hopeful. Refusing too hard might hurt her feelings?",
      culturalSubtext:
        'Gift refusal is the opening move of **lǐwù lǐyí (礼物礼仪, gift etiquette)**. Unlike in Western cultures where you might immediately say "thank you" and open the gift, the Chinese tradition calls for initial refusal — **kèqi (客气)**. This shows: (1) you don\'t feel entitled to gifts, (2) you value the relationship over the object, (3) you give the giver an opportunity to insist, which adds warmth.',
      wisdomId: 'gift_refuse_first',
    },
    {
      npcText:
        "(clicks tongue, pushes the box back toward you more firmly) Āiyā, bié shuō zhèxiē — don't say such things! (softens voice, leans in) Nǐ shì wǒ kànzhe zhǎngdà de — I've watched you grow up. Even if it was from photos your mother sent. (taps the box gently) When I saw this in that little shop by the canal… I thought, this belongs with someone who carries two cultures in their heart. (gestures at the table) We're all family here — no need for 'bringing things.' Kāi xīn jiù hǎo — being happy together is enough.",
      playerText:
        "(hands hovering over the box, clearly torn) Auntie Chen… nín zhè fèn xīnyì wǒ xīnlǐng le — I accept your kindness in my heart. (bites lip) But really, I feel bad. You went all the way to Suzhou and thought of me — that alone is already such a gift. (glances at parents for guidance) Are you sure…?",
      npcThoughts:
        "Second refusal — classic. But they're weakening. 'I accept your kindness in my heart' — that's a beautiful phrase, very Chinese. And they're looking at their parents for cues. This child was raised with manners. Now I'll make it personal. The emotional appeal always works.",
      playerThoughts:
        "She thought of me in Suzhou — me, someone she barely knows in person. That's… really touching. I want to accept. But part of me still feels like I'm taking advantage. Is two refusals enough? Should I go for three? I'm looking at my parents hoping they'll signal what's right.",
      culturalSubtext:
        'The second refusal uses a sophisticated phrase: **xīnlǐng le (心领了)** — "I accept your kindness in my heart." This acknowledges the giver\'s goodwill while still declining the physical object. It shows cultural fluency. The giver now escalates with emotional appeal — making the gift about connection, not transaction.',
      wisdomId: 'gift_dont_open',
    },
    {
      npcText:
        "(reaches across and places the box firmly in your hands, closing your fingers around it) Shōu xià. Just accept it. (her eyes are kind but serious now) Nǐ zhīdào ma — you know what? When children leave and grow up far away, the aunties back home… we worry. We wonder if you'll remember us. If China will still be home. (pats your hands) This gift is just my way of saying: nǐ yǒngyuǎn shì wǒmen jiā de háizi — you will always be a child of this family. Now put it in your bag and don't open it until you get home — that's the rule! (laughs, breaking the tension)",
      playerText:
        "(clutches the gift to chest, deeply moved, voice slightly unsteady) Xièxie… xièxie, Chén āyí. (bows head briefly, then looks up with a warm, genuine smile) Wǒ yīdìng hǎohǎo zhēncáng — I will treasure it. (places the gift carefully in bag without opening it) And next time I come… wǒ yě yào gěi nín dài yī fèn lǐwù — I'm going to bring you a gift too. Something from where I grew up. So you can have a piece of my other home.",
      npcThoughts:
        "They didn't open it — they know the rule! And they promised to bring me something next time. That's not obligation talking — I can see it in their eyes. They mean it. The gift did its job: it opened a door between us. Now I feel like I really have a niece/nephew, not just photos on a shelf.",
      playerThoughts:
        "Don't open it until I get home — I remember reading about this! In Chinese culture, opening a gift in front of the giver puts pressure on them. I'm glad I knew that. And meaning it when I said I'd bring her something… I really do want to. This exchange created a bond. It's not about the object at all.",
      culturalSubtext:
        'The third round reveals two key gift-giving rules: (1) **Don\'t open gifts in front of the giver** — it pressures them about the gift\'s value. (2) **Promise reciprocation** — not as repayment, but as an expression of ongoing relationship. The player\'s offer to bring a gift "from my other home" transforms the exchange into a bridge between two worlds — **lǐ shàng wǎng lái (礼尚往来)**, reciprocity that strengthens bonds.',
      wisdomId: 'gift_reciprocate',
      endAvailable: true,
    },
  ],
};

const GIFT_ZH: ObserveScript = {
  scenarioId: 'gift',
  rounds: [
    {
      contextText:
        '家庭聚餐已近尾声——盘子被收走，茶刚倒上。围坐桌边，大家脸上因美食和欢笑泛着红光。陈阿姨与你目光相遇，伸手从包里拿出一个用丝带扎好的精美礼盒。桌上安静下来——大家都知道接下来会发生什么。',
      npcText:
        '（双手将礼盒从桌面推向你，声音温暖中带着一点羞涩）来，这是给你的。（在你还没来得及推辞之前就摆了摆手）上个月去苏州玩看到的，一眼就觉得适合你。不贵不贵——只是一点小意思。（期待地笑着，手仍伸着）',
      playerText:
        '（睁大眼睛，本能地用双手轻轻把盒子往回推了推）陈阿姨！您太客气了！（摇摇头，真的有些不知所措）您真的不用……我什么都没给您带。这不好意思，我不能收。您自己留着吧……',
      npcThoughts:
        '当然要推辞——这才对。要是他们一把抓过去我倒有点失望。但他们提到了没给我带东西——啊，这种愧疚感也很中国。我得让他们安心：这礼物没有附加条件。是真心。',
      playerThoughts:
        '礼物——突然冒出来的！我空手来的。在我所知的任何文化里，没带东西却收礼都不对。我需要表示我不觉得自己理所当然该收。但同时……她的表情那么期待。拒绝得太狠会不会伤了她的心？',
      culturalSubtext:
        '推辞是**礼物礼仪**的开场动作。不像西方文化中你可能直接说"谢谢"然后打开礼物，中国传统要求先推辞——**客气**。这表示：(1)你不觉得收礼是理所当然的，(2)你重视关系胜过物品，(3)你给送礼者一个坚持的机会，这增添了温暖。',
      wisdomId: 'gift_refuse_first',
    },
    {
      npcText:
        '（咂咂嘴，更坚定地把盒子推回来）哎呀，别说这些！（声音柔和下来，身体前倾）你是我看着长大的。哪怕是从你妈妈寄来的照片里。（轻轻敲了敲盒子）在运河边那家小店里看到这个的时候……我就想，这个东西应该属于一个心里装着两种文化的人。（朝桌上比划了一下）我们都是家人——不用讲究"带东西"。开心就好。',
      playerText:
        '（手悬在盒子上方，明显很纠结）陈阿姨……您这份心意我心领了。（咬了咬嘴唇）但我真的过意不去。您大老远去苏州还想着我——这本身就已经是很贵重的礼物了。（看向父母寻求暗示）您确定……？',
      npcThoughts:
        '第二轮推辞——经典的。但他们在软化了。"心意我心领了"——这话说得很漂亮，很中国。而且在看父母的眼色。这孩子是有家教的。现在我要打感情牌。情感的攻势总是管用的。',
      playerThoughts:
        '她在苏州想到了我——我，一个她几乎没见过面的人。这真的……很让人感动。我想收。但一部分的我仍然觉得我在占便宜。推辞两次够了吗？要不要推三次？我在看父母，希望他们能给我信号什么是对的。',
      culturalSubtext:
        '第二轮推辞使用了一个精致的表达：**心领了**——"您的好意我心领了"。这承认了给予者的善意同时仍然婉拒实物。这展示了文化熟练度。给予者现在升级到情感诉求——将礼物与连接而非交易挂钩。',
      wisdomId: 'gift_dont_open',
    },
    {
      npcText:
        '（伸手过来，把盒子稳稳放在你手里，合拢你的手指）收下。就收下。（她的眼睛慈祥但认真了）你知道吗？孩子离家远远地长大，家里的阿姨们……我们会担心。担心你会不会记得我们。担心中国还会不会是家。（拍拍你的手）这个礼物就是阿姨在说：你永远是我们家的孩子。现在放进包里，回家再打开——这是规矩！（笑起来，打破了紧张）',
      playerText:
        '（把礼物抱在胸前，深受感动，声音微微发颤）谢谢……谢谢陈阿姨。（微微低头，然后抬起头露出温暖真诚的笑容）我一定好好珍藏。（小心地把礼物放进包里，没有打开）下次我来的时候……我也要给您带一份礼物。从我长大的地方带来的。这样您也能拥有我另一个家的一部分。',
      npcThoughts:
        '没有当面打开——他们懂规矩！还答应下次给我带东西。这不是人情债在说话——我从他们眼睛里看得出来。是真心的。礼物完成了它的使命：在我们之间开了一扇门。我现在觉得我真有个侄女/侄子了，不只是书架上的照片。',
      playerThoughts:
        '回家再打开——我记得读到过这个！在中国文化中，当面打开礼物会给送礼者压力。还好我记得。而且我说要给她带东西是真心的……我真的想。这次交换创造了一个纽带。跟物品本身完全无关。',
      culturalSubtext:
        '第三轮揭示了两条关键送礼规则：(1)**不要当面打开礼物**——这会给送礼者关于礼物价值的压力。(2)**承诺回报**——不是作为偿还，而是表达持续关系的意愿。玩家提出"从我另一个家带来的"礼物，将交换转化为两个世界之间的桥梁——**礼尚往来**，强化纽带的互惠。',
      wisdomId: 'gift_reciprocate',
      endAvailable: true,
    },
  ],
};

// ─── Bill (抢买单大战) ─────────────────────────────────────────────

const BILL_EN: ObserveScript = {
  scenarioId: 'bill',
  rounds: [
    {
      contextText:
        'The restaurant is bustling — lazy Susan spinning, chopsticks clacking, laughter echoing off the walls. Empty plates tell the story of a good meal. The waiter appears with a small black folder and places it neutrally in the center of the table. A sudden tension cuts through the warmth — everyone sees it. The bill has arrived.',
      npcText:
        "(hand shoots out like a striking snake, snatches the bill folder before anyone else can move) Wǒ lái wǒ lái — I've got it, I've got it! (already reaching for wallet with the other hand, waving dismissively at the table) Jīntiān wǒ qǐngkè — today is my treat! Everyone put your wallets away — bùyào gēn wǒ qiǎng — don't fight me on this! (shoots you a competitive grin)",
      playerText:
        "(immediately reaches for own wallet, leaning forward) Xiǎo Wáng! Bù xíng bù xíng — no way! (gestures at the table full of dishes) You already recommended this restaurant and ordered all the best dishes — at least let me contribute. (pulls out credit card) Wǒ lái fēn yībàn — let me split it with you at least. Or better yet, let me get this one!",
      npcThoughts:
        "Ah, they're reaching for their wallet — good! A friend who doesn't even try to pay is no friend at all. But 'split it'? No, no. Splitting is for colleagues, not friends. Today I'm treating. They can get the next one — that's how friendship works. But I have to win this round decisively.",
      playerThoughts:
        "In the West, splitting the bill is normal — sometimes expected. But I've learned that here, fighting to pay is a sign of friendship. Still, he recommended the place AND ordered everything. I feel like I should at least offer. But is offering to split the wrong move? Maybe I should insist on paying the whole thing?",
      culturalSubtext:
        'The bill battle begins! In Chinese culture, **qiǎng mǎidān (抢买单, fighting for the bill)** is a social performance. Offering to pay shows: (1) generosity — you\'re not petty, (2) you value the friendship, (3) you have social standing. Suggesting to "split" (AA制) can feel cold in this context — it\'s seen as transactional rather than relational.',
      wisdomId: 'bill_fight_why',
    },
    {
      npcText:
        "(holds the bill folder against his chest protectively, shaking his head vigorously) Fēn shénme fēn — split what! (leans in, voice dropping to a mock-serious tone) Nǐ gāng cóng guówài huílái — you just got back from abroad. Let your local friend show you some Chinese hospitality! (waves credit card) And besides, wǒ yǒu zhè jiā diàn de huìyuán kǎ — I have a membership card here, I get a discount. It makes no sense for you to pay full price when I can get 20% off. Luóji shuō bù tōng — the logic doesn't work!",
      playerText:
        "(pauses, wallet half-open, squinting suspiciously) Wait… membership card? (looks around at other friends for confirmation) Is that real or are you just saying that to win? (laughs, but still holding wallet) OK fine, if there's really a discount… but Xiǎo Wáng, nǐ děi dāyìng wǒ — you have to promise me: next meal is absolutely, 100% on me. Bù néng gēn wǒ qiǎng — you can't fight me on the next one.",
      npcThoughts:
        "They're wavering! The membership card excuse — always effective. Is it real? Maybe, maybe not. The point isn't the discount, it's giving them a face-saving reason to let me pay. And they're already negotiating for next time — perfect. A friend who commits to reciprocating is a friend worth treating.",
      playerThoughts:
        "A membership card? That's clever — whether it's real or not, it gives me a graceful way to back down. And by insisting on paying next time, I'm not 'losing' — I'm deferring. The relationship continues. This feels less like defeat and more like… taking turns in a friendship.",
      culturalSubtext:
        'The membership card gambit is a classic **táijiē (台阶, "step down")** — a face-saving excuse that lets the other person gracefully concede. The player\'s counter-move — extracting a firm promise for next time — is equally skillful. This transforms the "battle" into a **lúnliú (轮流, taking turns)** arrangement that strengthens the friendship rather than creating a winner and loser.',
      wisdomId: 'bill_face_game',
    },
    {
      npcText:
        "(beams, finally relaxing his grip on the bill folder) Hǎo! Yīyán wéi dìng — it's a deal! (points at you with his credit card) I'm holding you to that. Next time, you pick the restaurant and I won't even touch my wallet. (signs the receipt with a flourish, then looks up more seriously) But seriously… (voice softens) Nǐ néng huílái, wǒ zhēn de hěn gāoxìng — I'm really happy you came back. When you were overseas, I always wondered if we'd ever sit at the same table like this. (raises his tea cup) Lái, dàjiā jǔ bēi — everyone raise your glasses. Wèi yǒuqíng — to friendship. Bùguǎn zài nǎlǐ — no matter where we are.",
      playerText:
        "(puts wallet away, raises tea cup with both hands, genuinely moved) Wèi yǒuqíng — to friendship. (clinks cups, takes a sip, then looks at Xiǎo Wáng warmly) And Xiǎo Wáng… xièxie. Not for the meal — for making me feel like I still have a seat at this table. (glances around at everyone) Next time, wǒ lái xuǎn cān — I'll pick the restaurant. And nobody touch their wallet. Nà shì wǒ de miànzi — that'll be my face on the line! (everyone laughs)",
      npcThoughts:
        "They got it. They really got it. This isn't about the 200 kuai on the bill — it's about belonging. They said 'my face on the line' — they're using our language now, thinking in our terms. And they committed to next time with such warmth. I didn't just pay for a meal. I invested in a friendship.",
      playerThoughts:
        "I actually feel good about 'losing' this battle. Xiao Wang paid, but I got to promise next time — and I meant it. The toast, the laughter, the way everyone relaxed after the bill was settled… this is what friendship looks like here. It's not about equality. It's about taking turns showing you care.",
      culturalSubtext:
        'The bill battle resolves not with a winner and loser, but with a **chéngnuò (承诺, commitment)** for future reciprocity. The toast to friendship (**wèi yǒuqíng, 为友情**) elevates the moment from financial transaction to relationship affirmation. The player\'s use of **miànzi (面子)** shows deep cultural understanding — they recognize that paying next time isn\'t about money, it\'s about face and friendship.',
      wisdomId: 'bill_secret_pay',
      endAvailable: true,
    },
  ],
};

const BILL_ZH: ObserveScript = {
  scenarioId: 'bill',
  rounds: [
    {
      contextText:
        '餐厅热闹非凡——转盘飞转，筷子交错，笑声回荡。空盘子诉说着这顿好饭的故事。服务员出现，把一个黑色小夹子中性地放在桌子中央。一阵突如其来的紧张划破了温暖——大家都看到了。账单来了。',
      npcText:
        '（手像闪电一样伸出去，在任何人反应之前抢过账单夹）我来我来！（另一只手已经在掏钱包了，朝桌上摆摆手）今天我请客！都把钱包收起来——不要跟我抢！（朝你投来得意的笑）',
      playerText:
        '（立刻伸手掏自己的钱包，身体前倾）小王！不行不行！（指了指满桌的菜）餐厅是你推荐的，最好的菜也是你点的——至少让我出一份吧。（抽出信用卡）我来分一半。要么干脆这顿我来！',
      npcThoughts:
        '哈，伸手掏钱包了——好！连试都不试的朋友不是真朋友。但"分一半"？不不不。AA是同事之间的事，不是朋友。今天我请。下次他们请——朋友就是这样。但我这轮必须赢得干净利落。',
      playerThoughts:
        '在西方，AA制很正常——有时候是默认的。但我了解到，在这里抢着付钱是友情的表现。不过，餐厅是他推荐的、菜也是他点的。我觉得我至少应该表示一下。但提议AA是不是走错方向了？也许我该坚持全付？',
      culturalSubtext:
        '买单大战开始了！在中国文化中，**抢买单**是一种社交表演。表示要付钱传达：(1)慷慨——你大气不小气，(2)你重视友情，(3)你有社交地位。提议"AA制"在这种场合可能显得冷漠——被认为是交易性的而不是关系性的。',
      wisdomId: 'bill_fight_why',
    },
    {
      npcText:
        '（把账单夹护在胸前，使劲摇头）分什么分！（凑近，声音降到一种假装严肃的调子）你刚从国外回来。让你本地朋友展示一下中国式热情！（晃了晃信用卡）再说了，我有这家店的会员卡——能打折。你付全价我付八折——逻辑说不通嘛！',
      playerText:
        '（停顿，钱包半开着，眯起眼怀疑地看着）等等……会员卡？（环顾其他朋友寻求证实）是真的还是你为了赢编的？（笑了，但仍握着钱包）好吧，要真有折扣的话……但小王，你得答应我：下一顿百分之一百是我的。不能跟我抢。',
      npcThoughts:
        '动摇了！会员卡这招——屡试不爽。真的假的？也许真也许假。重点不是折扣，是给他们一个体面的台阶下。而且他们已经在谈判下一顿了——完美。一个承诺回请的朋友值得被请。',
      playerThoughts:
        '会员卡？真聪明——不管真假，它给了我一个优雅退让的理由。而且通过坚持下一顿我请，我不是在"输"——我是在延后。关系在延续。这感觉不像是失败，更像是……朋友间的轮流。',
      culturalSubtext:
        '会员卡策略是一个经典的**台阶**——一个保全面子的借口，让对方优雅让步。玩家的反击——让对方坚定承诺下一顿——同样老练。这把"战斗"变成了**轮流**的安排，加强了友谊而非制造输赢。',
      wisdomId: 'bill_face_game',
    },
    {
      npcText:
        '（笑逐颜开，终于放松了抓着账单夹的手）好！一言为定！（用信用卡指着你）我可记着了。下次你选餐厅，我钱包碰都不碰。（大笔一挥签了单，然后抬起头，更认真了些）不过说真的……（声音柔和下来）你能回来，我真的很高兴。你在国外的时候，我老是想我们还能不能像这样坐在一张桌子上。（举起茶杯）来，大家举杯。为友情——不管在哪里。',
      playerText:
        '（收起钱包，双手举起茶杯，真心感动）为友情。（碰杯，喝了一口，然后温暖地看着小王）还有小王……谢谢。不是为这顿饭——是为了让我觉得这张桌子上还有我的位置。（环顾大家）下次，我来选餐厅。谁都不许碰钱包。那是我的面子！（大家都笑了）',
      npcThoughts:
        '他们懂了。他们真的懂了。这不是账单上那两百块钱的事——是归属感。他们说了"我的面子"——在用我们的语言了，用我们的方式想问题了。而且承诺下一顿时那么温暖。我不只是付了一顿饭。我投资了一段友情。',
      playerThoughts:
        '我居然对"输掉"这场战斗感觉良好。小王付了钱，但我承诺了下一顿——而且我是真心的。那杯酒、那些笑声、账单解决后大家的放松……这就是这里的友情模样。不是关于平等。是关于轮流展示你在乎。',
      culturalSubtext:
        '买单大战的解决不是赢家和输家，而是一个未来互惠的**承诺**。为友情举杯（**为友情**）将这一刻从财务交易升华为关系确认。玩家使用**面子**一词展示了深刻的文化理解——他们认识到下一顿付钱不是关于钱，而是关于面子和友谊。',
      wisdomId: 'bill_secret_pay',
      endAvailable: true,
    },
  ],
};

// ─── Dinner (饭局礼仪) ─────────────────────────────────────────────

const DINNER_EN: ObserveScript = {
  scenarioId: 'dinner',
  rounds: [
    {
      contextText:
        "You stopped by Auntie Liu's apartment to drop off something your mother asked you to deliver — just a quick errand. But the late afternoon has slipped into early evening. From the kitchen, the sound of a wok sizzling and the smell of garlic and ginger fill the air. Auntie Liu appears in the doorway, wiping her hands on her apron, and the look on her face says she's already made up her mind.",
      npcText:
        "(stands in the kitchen doorway, wooden spatula in hand, apron dusted with flour) Āiyā, nǐ lái de zhènghǎo — you came at the perfect time! (gestures toward the kitchen with the spatula) Wǒ gāng hǎo zuò duō le — I just happened to cook too much. Liú xiàlái chī fàn ba — stay and eat! (waves off any protest preemptively) It's just simple home cooking — jiācháng biànfàn — nothing fancy. You probably don't get proper home-cooked meals living alone!",
      playerText:
        "(glances at the time on phone, takes a small step toward the door) Auntie Liu, nín tài kèqi le — you're too kind! (shakes head with an apologetic smile) I was just dropping something off — I don't want to impose. You've already been cooking, and I'm sure you want to eat in peace. Wǒ gǎitiān zài lái — I'll come another day, when I can give you proper notice!",
      npcThoughts:
        "Ah, the polite refusal. 'I'll come another day' — classic. But look at the time — it's dinnertime! If I let them leave now, what will they eat? Instant noodles alone in their apartment? Bù xíng. A good neighbor doesn't let a child go hungry. I must insist.",
      playerThoughts:
        "It's dinner time and she's already cooking. In Western culture, inviting yourself to dinner is considered rude. You wait to be invited, and even then you might demur once. But I've been told that in China, the first invitation is almost ceremonial — you're supposed to refuse, and the host is supposed to insist. Is this one of those moments?",
      culturalSubtext:
        'The dinner invitation dance begins with **liú fàn (留饭)** — the host\'s insistence that the guest stay for a meal. The guest\'s first refusal is expected and proper (**kèqi, 客气**). This ritual serves both parties: the host shows generosity, the guest shows they\'re not greedy. The question is whether the guest can read the sincerity behind the insistence.',
      wisdomId: 'dinner_timing',
    },
    {
      npcText:
        "(marches out of the kitchen, still holding the spatula, blocking the path to the door) Gǎi shénme tiān — what 'another day'! (points spatula at you like a teacher with a ruler) Jīntiān jiùshì nàge tiān — today IS that day! (voice softens, becomes coaxing) Wǒ dùn le páigǔ tāng — I've been simmering pork rib soup for three hours. Sān gè xiǎoshí! You can't let that go to waste. (leans in conspiratorially) And between us… I made too much on purpose. Cooking for one is boring. Ràng āyí yǒu gè bànr — give your auntie some company at the table.",
      playerText:
        "(laughs despite herself, body language softening — shoulders dropping, step toward door reversed) Three hours… nín zhēn de tài yòngxīn le — you really went to so much trouble. (hesitates, looking between kitchen and door) But Auntie Liu, I really don't want to be a burden… (stomach audibly growls — freezes, face flushes) …OK, maybe my stomach just betrayed me.",
      npcThoughts:
        "Hah! The stomach spoke the truth! Now we're getting somewhere. Three hours of simmering — nobody can resist pork rib soup. And I could see their body language shift. They WANT to stay. They just need permission. One more small push and they'll be sitting at my table.",
      playerThoughts:
        "My stomach just completely undermined my polite refusal. But honestly… that soup smells incredible. And she said she cooked too much on purpose. Maybe staying isn't imposing — maybe it's actually doing her a favor by keeping her company? I'm starting to rethink what 'being a good guest' means.",
      culturalSubtext:
        'Round two: the host deploys the "I made too much" tactic — a classic **liú fàn** strategy that gives the guest a face-saving reason to accept. The guest\'s body language tells the real story: they want to stay. In Chinese culture, part of being a good guest is knowing WHEN to stop refusing — excessive refusal becomes **bù gěi miànzi (不给面子, not giving face)**.',
      wisdomId: 'dinner_accept_grace',
    },
    {
      npcText:
        "(throws head back and laughs, eyes crinkling with delight) Hǎole hǎole — enough, enough! Nǐ de dùzi bǐ nǐ chéngshí — your stomach is more honest than your mouth! (gently takes your bag and hangs it on the hook by the door — the universal gesture of 'you're staying') Qù xǐ shǒu — go wash your hands. (gestures toward the kitchen with her chin) Ránhòu bāng wǒ bǎi yīxià wǎnkuài — then help me set the table. Two pairs of chopsticks, two bowls. Jīntiān wǒmen niángr liǎ hǎohǎo chī yī dùn — today we two will have a proper meal together.",
      playerText:
        "(takes off shoes properly, places them neatly by the door, rolling up sleeves) Hǎo, wǒ lái bāng nín — OK, let me help. (washes hands, starts setting the table with practiced movements) Auntie Liu… (pauses, holding chopsticks) Wǒ hěn jiǔ méiyǒu gēn rén yīqǐ chī wǎnfàn le — it's been a long time since I ate dinner with someone. (looks up with genuine warmth) Xièxie nín liú wǒ — thank you for keeping me. Bù shì kèqi — not just being polite. Wǒ zhēn de hěn gǎnxiè — I'm truly grateful.",
      npcThoughts:
        "They took off their shoes properly — not just kicking them off at the door. They're setting the table without being asked twice. And those words — 'I'm truly grateful, not just being polite.' That's the difference between kèqi and zhēnxīn. Between ritual and real. This child has a tender heart. Tonight, my table won't feel so empty.",
      playerThoughts:
        "Hanging up my bag was the moment I knew: I'm staying. Not as a polite guest performing a ritual, but as someone genuinely accepting an offer of warmth. Helping set the table feels natural — it transforms me from a passive recipient to an active participant. And saying 'thank you' and meaning it — that's the real end of the ritual dance. Not a third refusal, but a genuine acceptance.",
      culturalSubtext:
        'The third round completes the **liú fàn** ritual with genuine connection. Key cultural moves: (1) The host hangs up the guest\'s bag — a physical "you\'re staying" signal. (2) The guest offers to help (**bāngmáng, 帮忙**) — transforming from passive recipient to active participant. (3) The guest explicitly distinguishes between **kèqi (客气, polite formality)** and **zhēnxīn (真心, genuine feeling)** — showing deep cultural understanding. The ritual\'s purpose is revealed: it creates a framework for genuine warmth to emerge.',
      wisdomId: 'dinner_contribute',
      endAvailable: true,
    },
  ],
};

const DINNER_ZH: ObserveScript = {
  scenarioId: 'dinner',
  rounds: [
    {
      contextText:
        '你顺路到刘阿姨家送妈妈让带的东西——就是跑个腿。但下午不知不觉滑到了傍晚。厨房里传来炒锅的滋滋声，空气中弥漫着蒜和姜的香气。刘阿姨出现在门口，围裙上蹭着面粉，一边擦手，脸上的表情说明她已经做出了决定。',
      npcText:
        '（站在厨房门口，手里拿着木铲，围裙上沾着面粉）哎呀，你来得正好！（用铲子朝厨房比了比）我刚好做多了。留下来吃饭吧！（在你抗议之前就摆了摆手）就是家常便饭——没什么特别的。你一个人住肯定吃不上像样的家常菜！',
      playerText:
        '（看了看手机上的时间，朝门口方向迈了一小步）刘阿姨，您太客气了！（抱歉地笑着摇了摇头）我就是顺路送个东西——不好意思打扰您。您已经在做饭了，肯定想安安静静吃。我改天再来，提前跟您说！',
      npcThoughts:
        '啊，礼貌的推辞。"改天再来"——经典。但看看时间——该吃晚饭了！现在让他们走，他们吃什么？一个人回公寓泡方便面？不行。好邻居不能让孩子饿着肚子走。我必须坚持。',
      playerThoughts:
        '已经到饭点了，她正在做饭。在西方文化中，主动要求留下吃饭是失礼的。你等着被邀请，就算被邀请了也可能推辞一次。但我听说在中国，第一次邀请几乎是仪式性的——你应该拒绝，主人应该坚持。这就是那种时刻吗？',
      culturalSubtext:
        '留饭邀请的舞蹈始于**留饭**——主人坚持让客人留下吃饭。客人的第一次拒绝是被预期且得体的（**客气**）。这个仪式服务于双方：主人表现慷慨，客人表现不贪心。问题在于客人能否读懂坚持背后的真诚。',
      wisdomId: 'dinner_timing',
    },
    {
      npcText:
        '（从厨房大步走出来，还拿着铲子，挡住了去门口的路）改什么天！（像老师拿教鞭一样用铲子指着你）今天就是那天！（声音柔和下来，变得哄着）我炖了排骨汤——三个小时！三个小时！你不能让它浪费了。（凑近，一副说悄悄话的样子）跟你说实话……我是故意多做了一点的。一个人吃饭多没意思。让阿姨有个伴儿。',
      playerText:
        '（忍不住笑了，身体语言软化了——肩膀垂下来，往门口迈的步子收了回来）三小时……您真的太用心了。（犹豫着，目光在厨房和门之间来回）但刘阿姨，我真的不想给您添麻烦……（肚子不争气地咕噜一声——僵住了，脸红了）……好吧，我的肚子好像出卖了我。',
      npcThoughts:
        '哈！肚子说了实话了！有进展了。炖了三小时的排骨汤——没人能抵挡。而且我看到他们肢体语言变了。他们是想留下的。只是需要点许可。再轻轻推一把，他们就坐我桌边了。',
      playerThoughts:
        '我的肚子完全破坏了我的礼貌推辞。但说实话……那汤香极了。而且她说她是故意多做了一点的。也许留下不是添麻烦——也许是帮了她的忙，陪她做个伴？我开始重新思考"好客人"是什么意思了。',
      culturalSubtext:
        '第二轮：主人使用了"做多了"策略——经典的**留饭**战术，给客人一个体面接受的理由。客人的身体语言说出了真相：他们想留下。在中国文化中，做好客人的一部分是知道**何时**停止拒绝——过度拒绝变成**不给面子**。',
      wisdomId: 'dinner_accept_grace',
    },
    {
      npcText:
        '（仰头大笑，眼角的皱纹都笑开了）好了好了！你的肚子比你的嘴诚实！（轻轻拿过你的包挂在门边的挂钩上——"你留下了"的通用手势）去洗手。（用下巴朝厨房扬了扬）然后帮我摆一下碗筷。两双筷子，两个碗。今天我们娘俩好好吃一顿。',
      playerText:
        '（好好地脱了鞋，整齐地放在门边，卷起袖子）好，我来帮您。（洗了手，熟练地摆起碗筷）刘阿姨……（停顿，手里拿着筷子）我很久没有跟人一起吃晚饭了。（抬起头，眼中带着真诚的温暖）谢谢您留我。不是客气。我真的很感谢。',
      npcThoughts:
        '他们把鞋脱得整整齐齐——不只是随便踢在门口。让摆碗筷二话不说就动手了。还有那些话——"不是客气，是真心感谢。"这就是客气和真心的区别。仪式和真实的区别。这孩子心软。今晚，我的桌子不会再那么空了。',
      playerThoughts:
        '我的包被挂起来的那一刻我就知道了：我不走了。不是作为礼貌的客人在表演一个仪式，而是作为真心接受温暖邀请的人。帮忙摆桌子感觉很自然——这把我从被动的接受者变成了主动的参与者。而说出"谢谢"而且是真心的——这才是仪式舞蹈的真正终点。不是第三次拒绝，而是真心的接受。',
      culturalSubtext:
        '第三轮以真实连接完成了**留饭**仪式。关键文化动作：(1)主人挂起客人的包——一个物理上的"你留下了"信号。(2)客人主动帮忙（**帮忙**）——从被动接受者转变为主动参与者。(3)客人明确区分了**客气**（礼貌形式）和**真心**（真实感受）——展示了深厚的文化理解。仪式的目的被揭示：它为真诚温暖的出现创造了一个框架。',
      wisdomId: 'dinner_contribute',
      endAvailable: true,
    },
  ],
};

// ─── Workplace (职场人情) ──────────────────────────────────────────

const WORKPLACE_EN: ObserveScript = {
  scenarioId: 'workplace',
  rounds: [
    {
      contextText:
        'The office has emptied out — most colleagues left an hour ago. Fluorescent lights hum overhead, casting a sterile glow on cubicles and whiteboards. But Lao Zhou is still at his desk, and as you pack up to leave, he waves you over. On his desk sits a small, elegant gift bag — the kind from a high-end department store. This isn\'t a casual gesture.',
      npcText:
        "(gestures you over, voice warm but with an undertone of formality) Xiǎo Lǐ, lái yīxià — come here a moment. (picks up the gift bag, holds it with both hands) This project… méiyǒu nǐ, zuò bù chéng — without you, it wouldn't have succeeded. (extends the bag toward you) Wǒ zhǔnbèi le yīdiǎn xiǎo dōngxi — I prepared a small something. It's not much, just to say thank you. Nǐ yīdìng yào shōu xià — you must accept it.",
      playerText:
        "(eyes widen slightly at the brand on the bag, instinctively takes a small step back) Lǎo Zhōu! Zhè tài guìzhòng le — this is too valuable! (shakes head, hands raised in polite refusal) I was just doing my job — nà shì wǒ yīnggāi zuò de — that was my responsibility. The project succeeded because of your guidance. I can't accept something this nice…",
      npcThoughts:
        "Good — they recognized the value immediately and refused. A junior who grabs expensive gifts without hesitation is dangerous — either entitled or naive. But they also credited my guidance. Smart. Now I need to make clear this isn't a bribe or a test — it's genuine gratitude from a senior to a junior.",
      playerThoughts:
        "That's a luxury brand bag. In Western workplaces, accepting expensive gifts from colleagues — especially senior ones — is ethically complicated. It could be seen as favoritism or create uncomfortable obligations. But refusing outright might insult him? He did help me enormously on the project. I need to navigate this carefully.",
      culturalSubtext:
        'Workplace gift-giving in China sits at the intersection of **guānxi (关系)** and professional hierarchy. Unlike Western corporate environments where gift-giving is often restricted, Chinese workplaces view appropriate gifts as relationship-building. The junior\'s refusal shows **qiānxū (谦虚)** — acknowledging their place in the hierarchy. The key tension: how to accept without creating improper obligation (**rénqíng zhài, 人情债**).',
      wisdomId: 'workplace_gift_value',
    },
    {
      npcText:
        "(sets the bag down but keeps his hand on it, voice becoming more earnest) Tīng wǒ shuō — listen to me. (leans forward slightly) Wǒ zài zhège hángyè èrshí nián le — I've been in this industry twenty years. I know the difference between someone who just does their job and someone who pours their heart into it. (taps the desk) Nǐ shì hòu zhě — you're the latter. (picks up the bag again) And as your senior, biǎodá xīnshǎng — expressing appreciation — is also part of my job. Bùyào ràng wǒ wéinán — don't make this awkward for me.",
      playerText:
        "(bites lip, clearly moved by the speech but still conflicted) Lǎo Zhōu, nín zhè fān huà… your words alone already mean so much to me. (places hand over heart) I've learned more from this one project under your guidance than in two years anywhere else. (glances at the gift bag) But this gift… wǒ pà wǒ shòu bù qǐ — I'm afraid I don't deserve it. Or that it might… create expectations I can't meet.",
      npcThoughts:
        "Ah — they're worried about the obligation. Smart. A junior who understands rénqíng is rare. They're not refusing out of false modesty — they genuinely understand the weight of accepting a senior's gift. I need to release them from that worry. This gift has no strings.",
      playerThoughts:
        "He said my work was exceptional — that means a lot coming from someone with 20 years of experience. But I'm genuinely worried: if I accept this, will he expect me to always work late? To never say no? In Western workplaces, gifts can come with strings. But maybe I'm overthinking this? Maybe it really is just gratitude?",
      culturalSubtext:
        'The junior\'s concern about **shòu bù qǐ (受不起, "not deserving")** reflects deep understanding of **rénqíng (人情)** — the web of social obligations. In Chinese workplace culture, accepting a senior\'s gift does create a bond, but not necessarily a corrupt one. The senior now needs to **release the pressure** — to make clear this is mentorship, not transaction.',
      wisdomId: 'workplace_reciprocate',
    },
    {
      npcText:
        "(nods slowly, understanding dawning in his eyes) Wǒ dǒng le — I understand your concern. (sets the bag down, speaks with measured sincerity) This is not a contract. This is not an expectation. (touches his chest) Zhè shì xīnyì — this is from the heart. (picks up the bag and places it directly into your hands) Twenty years ago, a senior did the same for me. I never forgot it. Now I'm passing it on. (smiles, the formality melting) The only thing I hope is that one day, when you're the senior… nǐ yě huì zhèyàng duì dài nǐ de hòubèi — you'll do the same for your juniors.",
      playerText:
        "(holds the bag with both hands, bowing slightly, voice thick with emotion) Lǎo Zhōu… xièxie. (straightens up, meets his eyes) Wǒ shōu xià le — I accept. Not as a gift, but as a responsibility. (clutches the bag to chest) I promise — when I'm in your position someday, I'll remember this moment. (smiles through slightly misty eyes) And Lǎo Zhōu… xià zhōu wǒ qǐng nín chī fàn — next week, let me treat you to dinner. Not as repayment — as thanks. And so I can keep learning from you.",
      npcThoughts:
        "They understand. Not just the gift, but what it represents — the passing of the torch. And they offered dinner — not as repayment (that would be transactional) but as continued mentorship. This junior will go far. Not because they're talented — because they understand that relationships are the real currency.",
      playerThoughts:
        "He said 'this is from the heart' — and I believe him. Accepting feels different now. It's not an obligation — it's an invitation into a tradition. When I offered dinner 'not as repayment but as thanks,' I felt something shift. I'm not just an employee. I'm part of a lineage. A chain of mentors and juniors. That's what guānxi really means, isn't it?",
      culturalSubtext:
        'The resolution transforms the gift from a potential burden into a **chuántǒng (传统, tradition)** — the passing of mentorship across generations. Key moves: (1) The senior explicitly releases the junior from obligation — **zhè shì xīnyì (这是心意)**. (2) The junior reframes acceptance as **zérèn (责任, responsibility)** — to continue the tradition. (3) The offer of dinner is framed as ongoing learning, not repayment — preserving hierarchy while building genuine connection. This is **guānxi** at its healthiest: vertical bonds of mutual care.',
      wisdomId: 'workplace_boundary',
      endAvailable: true,
    },
  ],
};

const WORKPLACE_ZH: ObserveScript = {
  scenarioId: 'workplace',
  rounds: [
    {
      contextText:
        '办公室已经空了——大多数同事一小时前就走了。头顶日光灯嗡嗡作响，在隔间和白板上投下清冷的光。但老周还坐在他的办公桌前，当你收拾东西准备离开时，他招手让你过去。他桌上放着一个小巧精致的礼品袋——高档百货商场的那种。这不是随意的举动。',
      npcText:
        '（招手让你过去，声音温暖但带着一丝正式）小李，来一下。（拿起礼品袋，双手捧着）这个项目……没有你，做不成。（把袋子往你面前递）我准备了一点小东西。不多，就是表示感谢。你一定要收下。',
      playerText:
        '（看到袋子上的品牌标志眼睛微微睁大，本能地后退了一小步）老周！这太贵重了！（摇头，双手举起做出礼貌拒绝）我只是做了分内的事——那是我应该做的。项目成功是因为您的指导。我不能收这么贵重的东西……',
      npcThoughts:
        '好——他们一眼看出了价值，立刻拒绝了。一个毫不犹豫就收下贵重礼物的后辈是危险的——要么自以为理所当然，要么太天真。但他们也归功于我的指导。聪明。现在我需要明确这不是贿赂或考验——是前辈对后辈的真诚感谢。',
      playerThoughts:
        '那是奢侈品牌的袋子。在西方职场中，接受同事——尤其是上级——的贵重礼物在道德上是复杂的。可能被视为偏袒或造成不舒服的义务。但直接拒绝会不会冒犯他？他确实在项目上帮了我大忙。我需要小心对待。',
      culturalSubtext:
        '中国职场送礼位于**关系**和职业等级的交叉点。不同于西方企业环境中送礼常被限制，中国职场将适当的礼物视为关系建设。后辈的拒绝展示了**谦虚**——承认自己在等级中的位置。关键张力：如何接受而不产生不当的人情债。',
      wisdomId: 'workplace_gift_value',
    },
    {
      npcText:
        '（把袋子放下但手仍放在上面，声音变得更加恳切）听我说。（身体微微前倾）我在这个行业二十年了。分得清谁只是做分内的事，谁把心放进去了。（敲了敲桌子）你是后者。（又拿起袋子）作为你的前辈，表达欣赏——也是我分内的事。不要让我为难。',
      playerText:
        '（咬着嘴唇，明显被这番话感动了但仍矛盾）老周，您这番话……光这些话对我已经意义重大了。（手放在心口）在您指导下的这一个项目，比我之前在别处两年学到的都多。（瞥了一眼礼品袋）但这个礼物……我怕我受不起。或者说，怕它可能……产生我还不起的期待。',
      npcThoughts:
        '啊——他们在担心人情债。聪明。懂得人情世故的后辈不多见。他们不是在假谦虚——是真正理解了接受前辈礼物的分量。我需要解除他们这种担忧。这个礼物没有附加条件。',
      playerThoughts:
        '他说我的工作很出色——这话从有二十年经验的人口中说出来，分量很重。但我真的担心：如果我收下，他会不会期待我以后总是加班？从不说"不"？在西方职场中，礼物可能附带条件。但也许我想多了？也许真的只是感谢？',
      culturalSubtext:
        '后辈对**受不起**的担忧反映了对**人情**——社交义务网的深刻理解。在中国职场文化中，接受前辈的礼物确实建立了一种纽带，但不一定是腐败的。前辈现在需要**解除压力**——明确这是师徒传承，而非交易。',
      wisdomId: 'workplace_reciprocate',
    },
    {
      npcText:
        '（缓缓点头，眼中浮现理解的光芒）我懂了——我理解你的担忧。（放下袋子，语气沉稳而真诚）这不是合同。这不是期待。（碰了碰自己的胸口）这是心意。（拿起袋子直接放进你手里）二十年前，也有一个前辈这样对我。我从来没忘。现在我在传递下去。（笑了，正式感融化）我唯一希望的，就是有一天你当了前辈……你也会这样对待你的后辈。',
      playerText:
        '（双手捧着袋子，微微鞠躬，声音有些哽咽）老周……谢谢。（直起身，看着他的眼睛）我收下了。不是作为礼物，是作为责任。（把袋子抱在胸前）我保证——有一天我到了您的位置，我会记住这一刻。（眼里微微泛光但笑了）还有老周……下周我请您吃饭。不是还礼——是感谢。也是想继续跟您学。',
      npcThoughts:
        '他们懂了。不只是礼物，而是它代表的东西——接力棒的传递。而且他们提出请吃饭——不是作为还礼（那太交易化），而是作为持续的师徒关系。这个后辈会走得很远。不是因为他们有才华——是因为他们理解关系才是真正的货币。',
      playerThoughts:
        '他说"这是心意"——我相信他。现在接受的感觉不同了。不是义务——是进入一个传统的邀请。当我说"不是还礼是感谢"时，我感觉到一些东西变了。我不只是一个员工。我是一个传承的一部分。师徒之间的一环。这就是关系的真正含义，对吗？',
      culturalSubtext:
        '解决方案将礼物从潜在负担转化为**传统**——跨代师徒传承。关键动作：(1)前辈明确解除后辈的义务——**这是心意**。(2)后辈将接受重新定义为**责任**——延续传统。(3)请吃饭被定义为持续学习而非回报——在维护等级的同时建立真实连接。这是**关系**最健康的形态：纵向的相互关怀纽带。',
      wisdomId: 'workplace_boundary',
      endAvailable: true,
    },
  ],
};

// ─── Refusal (得体拒绝) ─────────────────────────────────────────────

const REFUSAL_EN: ObserveScript = {
  scenarioId: 'refusal',
  rounds: [
    {
      contextText:
        'Your phone buzzes — a call from your cousin (表姐), whom you haven\'t spoken to in months. It\'s late evening. You answer, and her voice is warm but there\'s something hesitant in it, something carefully controlled. She asks about your day, your health, the weather — small talk that feels like it\'s circling something.',
      npcText:
        "(voice warm but with an undertone of tension, speaking slightly faster than usual) Hēi, biǎodì — hey, cousin. (pauses, you can hear her take a breath) Nǐ zuìjìn zěnmeyàng — how have you been? Work going well? (listens briefly) That's good, that's good. (another pause — longer this time) Actually… wǒ xiǎng gēn nǐ shāngliang gè shì — I wanted to discuss something with you. (voice drops slightly) Zuìjìn jiā lǐ yùdào yīdiǎn kùnnán — the family's run into a bit of difficulty lately. Nothing serious! Just… (trails off, waiting to see how you respond)",
      playerText:
        "(sits down slowly, phone pressed to ear, voice gentle but cautious) Biǎojiě… tīng nǐ de shēngyīn hǎoxiàng yǒu diǎn lèi — you sound a bit tired. (leans forward, concerned) Shì bu shì yùdào shénme shì le — has something happened? (pauses, choosing words carefully) Wǒmen shì jiārén — we're family. Whatever it is, you can tell me. Wǒ huì jìnlì — I'll do what I can. (but there's a tiny hesitation in the last phrase)",
      npcThoughts:
        "They said 'we're family' — that's good. But I heard that tiny hesitation at the end. They're being warm but not committing. Smart — they don't know what I'm going to ask yet. I should ease into this. Don't blurt out the number. Let them feel the situation first.",
      playerThoughts:
        "She sounds genuinely stressed. But we haven't talked in months and now she's calling late at night with 'something to discuss.' In any culture, that pattern means a big ask is coming. I want to be supportive, but I need to protect myself too. 'I'll do what I can' is vague enough to not promise anything.",
      culturalSubtext:
        'The opening of a difficult request in Chinese communication follows **hánxù (含蓄)** — indirect, implicit communication. The cousin doesn\'t state the request immediately; she tests the waters first. The player responds with warmth but maintains ambiguity (**móhu, 模糊**). In Chinese culture, directness at this stage would be considered crude — both parties are establishing the emotional context before the actual request.',
      wisdomId: 'refusal_indirect',
    },
    {
      npcText:
        "(exhales slowly, the warmth in her voice now tinged with vulnerability) Shì zhèyàng de — here's the thing. (speaks more slowly now, carefully) My husband's small business… last month a big client didn't pay. Now the suppliers are pressing, and we need to cover the gap quickly. (rushes to add) It's temporary! Just a cash flow problem. Wǒmen yǐjīng zài jiějué le — we're already working on it. (voice drops to almost a whisper) I was wondering… if you might be able to help us bridge this period. Zhōuzhuǎn yīxià — just to tide us over. (adds quickly) Wǒ huì dǎ qiàntiáo de — I'll write an IOU. With interest. Whatever terms you think are fair.",
      playerText:
        "(long pause — you can hear the weight of the request settling in the silence. Then, voice measured and warm but careful) Biǎojiě… wǒ tīng dào nǐ de qíngkuàng, xīnlǐ yě hěn nánshòu — hearing about your situation, my heart aches too. (deep breath) Zhè shì yī dà bǐ qián — this is a significant amount. (doesn't ask how much — that would imply you're considering it) Wǒ xiànzài zìjǐ yě yǒu yīxiē cáiwù jìhuà — I have some financial commitments of my own right now. (voice softens further) Ràng wǒ hǎohǎo xiǎng yī xiǎng — let me think about it carefully. Wǒ yào kànkan wǒ de qíngkuàng — I need to look at my situation. Wǒ huì jǐnkuài gěi nǐ dáfù — I'll get back to you as soon as I can.",
      npcThoughts:
        "They didn't say yes. They didn't say no. 'Let me think about it' — that's the classic buffer. They're not asking how much, which means they're leaning toward no but don't want to hurt me. And they said their heart aches — that's genuine empathy. At least they're not giving me a cold 'no.' I should accept the buffer. Pushing harder now would damage the relationship.",
      playerThoughts:
        "A business cash flow problem — that could mean anything from a few thousand to tens of thousands. I can't say yes without knowing more, and I can't say no directly or she'll lose face. 'Let me think about it' buys me time to figure out a graceful refusal. But I genuinely do feel for her. She's not trying to scam me — she's just desperate.",
      culturalSubtext:
        'The player uses two classic Chinese refusal strategies: (1) **tuōyán (拖延, delay)** — "let me think about it" buys time without committing. (2) **tóngqíng xiān yú jùjué (同情先于拒绝, empathy before refusal)** — expressing genuine care before declining. Critically, the player does NOT ask "how much" — asking would imply willingness and make the eventual refusal more painful. These are sophisticated **hánxù** techniques.',
      wisdomId: 'refusal_delay',
    },
    {
      npcText:
        "(soft sigh — not of frustration, but of acceptance. Her voice shifts from vulnerable to warm again, the tension releasing) Wǒ lǐjiě — I understand. (genuine warmth returns) Nǐ kěn tīng wǒ shuō zhèxiē, wǒ yǐjīng hěn gǎnjī le — just the fact that you listened, I'm already grateful. (small laugh, self-deprecating) Wǒ zhīdào zhè hěn tángtú — I know this is very presumptuous of me. We haven't talked in so long and I call with this… (sighs) Bùyào yǒu yālì — don't feel pressured. Really. Wúlùn nǐ néng bu néng bāng — whether you can help or not, wǒmen háishì jiārén — we're still family. (firmly, with warmth) Zhège bù huì biàn — that won't change.",
      playerText:
        "(voice warm with relief and genuine care) Biǎojiě, xièxie nǐ lǐjiě — thank you for understanding. (speaks from the heart now) Wǒ suīrán xiànzài méi bànfǎ ná chū nàme duō qián — while I can't come up with that amount right now… (offers an alternative) Wǒ yǒu yī gè péngyǒu zuò xiǎowēi qǐyè dàikuǎn de — I have a friend who does micro-business loans. Wǒ kěyǐ bāng nǐ wènwen — I can ask for you. (voice warm) And biǎojiě — bùguǎn zěnmeyàng, wǒmen duō liánxì ba — no matter what, let's stay in touch more. Bùyào děng dào yǒu kùnnán cái dǎ diànhuà — don't wait until there's a problem to call. Hǎo ma?",
      npcThoughts:
        "They can't help with money, but they offered to connect me with someone who might. That's not nothing — that's practical help. And they asked me to stay in touch more. They're not just refusing — they're investing in the relationship in a different way. Smart. Kind. This is what family does.",
      playerThoughts:
        "I did it — I said no without saying no. And offering the loan friend connection isn't empty — I actually know someone who might help. More importantly, I meant what I said about staying in touch. The money was a big ask, but the real question underneath was: 'Do you still care about me?' And the answer is yes. I think she heard that.",
      culturalSubtext:
        'The resolution demonstrates the highest level of **wǎnhuí jùjué (挽回拒绝, face-saving refusal)**. Key techniques: (1) **Bùfen jùjué, bùfen bāngzhù (部分拒绝，部分帮助, partial refusal, partial help)** — offering alternative assistance preserves the relationship. (2) **Zhuǎnyí jiāodiǎn (转移焦点, shifting focus)** — from the transactional (money) to the relational (staying in touch). (3) **Gǎnqíng tóuzī (感情投资, emotional investment)** — the player explicitly affirms the relationship\'s value beyond the request. A Chinese "no" isn\'t a wall — it\'s a door to a different kind of yes.',
      wisdomId: 'refusal_third_party',
      endAvailable: true,
    },
  ],
};

const REFUSAL_ZH: ObserveScript = {
  scenarioId: 'refusal',
  rounds: [
    {
      contextText:
        '手机震动——是表姐打来的，你们已经好几个月没通过话了。已经夜深了。你接起电话，她的声音很温暖，但其中有些犹豫，有些刻意控制的东西。她问你的日常、你的健康、天气如何——那些像是在绕着什么东西打转的寒暄。',
      npcText:
        '（声音温暖但带着一丝紧张，说话比平时稍快）嘿，表弟/表妹——你最近怎么样？工作还顺利吗？（短暂地听你说）那就好那就好。（又一个停顿——这次更长）其实……我想跟你商量个事。（声音略微压低）最近家里遇到一点困难。不严重！就是……（话尾渐渐消失，等着看你如何反应）',
      playerText:
        '（慢慢坐下，手机紧贴耳朵，声音温和但谨慎）表姐……听你的声音好像有点累。（身体前倾，关切地）是不是遇到什么事了？（停顿，仔细斟酌词句）我们是家人。不管什么事，你都可以跟我说。我会尽力。（但最后半句有一丝微小的犹豫）',
      npcThoughts:
        '他们说了"我们是家人"——好。但我听到了末尾那一丝犹豫。他们在表达温暖但没有承诺。聪明——他们还不知道我要说什么。我应该慢慢铺垫。不要一下子把数字说出来。让他们先感受到情况。',
      playerThoughts:
        '她听起来真的很有压力。但我们好几个月没联系了，现在深夜打电话来说"有事商量"。在任何文化中，这个模式都意味着一个大的请求要来了。我想表达支持，但我也需要保护自己。"我会尽力"够模糊，没有做出任何承诺。',
      culturalSubtext:
        '中文沟通中困难请求的开场遵循**含蓄**——间接的、含蓄的沟通。表姐没有立刻说出请求；她先试探水温。玩家回应以温暖但保持模糊（**模糊**）。在中国文化中，这个阶段的直接会被认为是粗鲁的——双方都在实际请求之前建立情感语境。',
      wisdomId: 'refusal_indirect',
    },
    {
      npcText:
        '（缓缓呼出一口气，声音中的温暖现在染上一丝脆弱）是这样的。（现在说得更慢，小心翼翼）我老公的小生意……上个月一个大客户没付款。现在供应商在催，我们需要赶紧补上这个缺口。（赶紧补充）是暂时的！就是现金流的问题。我们已经在解决了。（声音降到几乎耳语）我在想……你也许能帮我们渡过这段时间。周转一下。（迅速加了一句）我会打欠条的。带利息。什么条件你觉得公平都行。',
      playerText:
        '（长长的停顿——你能在沉默中听到请求的分量在沉淀。然后，声音有分寸且温暖但小心）表姐……我听到你的情况，心里也很难受。（深吸一口气）这是一大笔钱。（不问多少——问了就意味着你在考虑）我现在自己也有一些财务计划。（声音更加柔和）让我好好想一想。我要看看我的情况。我会尽快给你答复。',
      npcThoughts:
        '他们没有说好。也没有说不好。"让我想一想"——经典的缓冲。他们没有问多少，说明他们倾向于拒绝但不想伤害我。而且说"心里很难受"——那是真的同理心。至少不是冷冰冰的"不行"。我应该接受这个缓冲。再施压会伤害关系。',
      playerThoughts:
        '生意现金流问题——这可能意味着从几千到几万。不知道更多细节我不能答应，但我也不能直接说不，否则她会丢面子。"让我想一想"给了我时间想出一个得体的拒绝方式。但我确实心疼她。她不是要骗我——她只是走投无路了。',
      culturalSubtext:
        '玩家使用了两种经典的中式拒绝策略：(1)**拖延**——"让我想一想"在争取时间的同时不做承诺。(2)**同情先于拒绝**——在拒绝前表达真诚的关心。关键在于，玩家没有问"多少"——问了意味着有意向，会让最终的拒绝更加伤人。这些都是精妙的**含蓄**技巧。',
      wisdomId: 'refusal_delay',
    },
    {
      npcText:
        '（轻声叹了口气——不是沮丧，而是接受。她的声音从脆弱变回暖，紧张感释放了）我理解。（真诚的温暖回来了）你肯听我说这些，我已经很感激了。（自嘲地轻笑）我知道这很唐突。这么久没联系，一打电话就是这个……（叹气）不要有压力。真的。不管你能不能帮——我们还是家人。（坚定地，带着温暖）这个不会变。',
      playerText:
        '（声音因释然和真诚关切而温暖）表姐，谢谢你理解。（现在是从心底说出来的）我虽然现在没办法拿出那么多钱……（提供替代方案）我有一个朋友做小微企业贷款的。我可以帮你问问。（声音温暖）还有表姐——不管怎样，我们多联系吧。不要等到有困难才打电话。好吗？',
      npcThoughts:
        '他们帮不了钱，但主动提出帮忙联系可能能帮的人。这不是什么都没有——这是实际的帮助。而且让我多联系。他们不是单纯在拒绝——他们在用另一种方式投入这段关系。聪明。善良。这就是家人该做的。',
      playerThoughts:
        '我做到了——我没有说"不"却表达了"不"。而且提出帮忙联系贷款朋友不是空话——我真的认识可能能帮上忙的人。更重要的是，我说多联系是真心的。借钱是个大请求，但底层的真正问题是："你还在乎我吗？"答案是肯定的。我想她听到了。',
      culturalSubtext:
        '解决方案展示了最高境界的**挽回拒绝**。关键技巧：(1)**部分拒绝，部分帮助**——提供替代帮助保全了关系。(2)**转移焦点**——从交易性的（钱）转向关系性的（多联系）。(3)**感情投资**——玩家明确肯定了关系超越请求本身的价值。一个中国式的"不"不是一堵墙——它是通往另一种"是"的门。',
      wisdomId: 'refusal_third_party',
      endAvailable: true,
    },
  ],
};

// ─── Master Registry ───────────────────────────────────────────────

const SCRIPTS_EN: Partial<Record<ScenarioId, ObserveScript>> = {
  hongbao: HONGBAO_EN,
  compliment: COMPLIMENT_EN,
  guest: GUEST_EN,
  gift: GIFT_EN,
  bill: BILL_EN,
  dinner: DINNER_EN,
  workplace: WORKPLACE_EN,
  refusal: REFUSAL_EN,
};

const SCRIPTS_ZH: Partial<Record<ScenarioId, ObserveScript>> = {
  hongbao: HONGBAO_ZH,
  compliment: COMPLIMENT_ZH,
  guest: GUEST_ZH,
  gift: GIFT_ZH,
  bill: BILL_ZH,
  dinner: DINNER_ZH,
  workplace: WORKPLACE_ZH,
  refusal: REFUSAL_ZH,
};

export function getObserveScript(scenarioId: string, lang: 'en' | 'zh'): ObserveScript | null {
  const scripts = lang === 'en' ? SCRIPTS_EN : SCRIPTS_ZH;
  return scripts[scenarioId as ScenarioId] ?? null;
}

/**
 * Split text into pseudo-streaming chunks for typewriter effect.
 * Returns an array of string chunks that can be revealed with delays.
 */
const SENTENCE_END_RE = /[.!?。！？…]/;
const COMMA_BREAK_RE = /[,;，；：:、—–-]/;
const HORIZONTAL_WS_RE = /[^\S\n]/;

export function chunkForStreaming(text: string): string[] {
  // Build chunks by scanning character-by-character, preserving all whitespace.
  // Split at sentence-ending punctuation (including following whitespace in the chunk),
  // and at comma-like breaks when a chunk grows too long.
  // Consecutive punctuation (e.g. "...", "?!", "。。") stays in one chunk.
  const chunks: string[] = [];
  let current = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    current += char;

    const isSentenceEnd = SENTENCE_END_RE.test(char);
    const isNewline = char === "\n";
    const isCommaBreak = COMMA_BREAK_RE.test(char);

    if (isSentenceEnd || isNewline) {
      if (isSentenceEnd) {
        // Absorb consecutive sentence-ending punctuation into the same chunk
        // so "..." or "?!" don't split into separate chunks
        while (i + 1 < text.length && SENTENCE_END_RE.test(text[i + 1])) {
          current += text[++i];
        }
        // Absorb trailing horizontal whitespace
        while (i + 1 < text.length && HORIZONTAL_WS_RE.test(text[i + 1])) {
          current += text[++i];
        }
      }
      chunks.push(current);
      current = "";
    } else if (isCommaBreak && current.length > 80) {
      // Absorb consecutive comma-break punctuation
      while (i + 1 < text.length && COMMA_BREAK_RE.test(text[i + 1])) {
        current += text[++i];
      }
      // Absorb trailing horizontal whitespace after comma breaks too
      while (i + 1 < text.length && HORIZONTAL_WS_RE.test(text[i + 1])) {
        current += text[++i];
      }
      chunks.push(current);
      current = "";
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [text];
}
