import type { ScenarioId, LearningStage, ScenarioConfig } from '../scenario-config';
import { SCENARIOS } from '../scenario-config';
import { STAGES } from '../learning-progression';
import { SCENARIO_PROMPTS, type ScenarioPromptData } from './scenario-prompts';
import type { Language } from '../i18n';
import { AUNTIE_WISDOMS } from '../cultural-insights';
import { getScenarioGoal } from '../scenario-goals';

function getScenario(scenarioId: string): ScenarioConfig | undefined {
  return SCENARIOS[scenarioId as ScenarioId];
}

function getPromptData(scenarioId: string): ScenarioPromptData | undefined {
  return SCENARIO_PROMPTS[scenarioId as ScenarioId];
}

function getStage(stageId: string) {
  return STAGES[stageId as LearningStage];
}

const STREAMING_FORMAT = `Output structure — use these tags. Each tag on its own line.

<<CONTEXT>>
(Round 1 only) Set the scene — place, atmosphere, a sensory detail or two.
<</CONTEXT>>

<<NPC>>
Spoken dialogue with a brief action in parentheses. Example: "(presses the envelope toward you with both hands) Lai lai, zhege gei ni — take it, for a lucky new year!" Include pinyin for Chinese phrases.
<</NPC>>

<<PLAYER>>
(Observe mode only) What a culturally-aware person would say, with a brief action in parentheses.
<</PLAYER>>

<<PSYCHOLOGY>>
(Observe mode only) The inner thoughts behind the words:
NPC's real thoughts: what they feel but don't say
Player's real thoughts: the cultural calculation in their head
Cultural subtext: the unwritten rule at play
<</PSYCHOLOGY>>

<<WISDOM>>
When a cultural concept surfaces, reference one of the existing wisdom cards by ID:
id: card_id
<</WISDOM>>

<<OPTIONS>>
(Guided mode) Four ways the player might respond.
{{OPTIONS_INSTRUCTION}}
- {{OPTION_EXAMPLE}}
- (another response strategy)
- (a different response strategy)
- (yet another response strategy)
<</OPTIONS>>

<<FEEDBACK>>
(Guided mode, after the player picks an option) Brief, 1-sentence feedback on their choice — what cultural instinct it shows. Lead with what they did well.
<</FEEDBACK>>

Tags use double brackets: <<TAG>> opens, <</TAG>> closes. Each on its own line.
NPC dialogue and OPTIONS are separate sections — close <</NPC>> before <<OPTIONS>>.
Only reference these wisdom card IDs: ${AUNTIE_WISDOMS.map(w => w.id).join(', ')}. Don't invent new ones.

🚫 NEVER BREAK CHARACTER: The NPC must NEVER explain Chinese culture, compare China to other countries, mention "the ritual" or "the custom," or say things like "in China we do X" or "this is how Chinese people do it." The NPC simply IS Chinese — they act naturally without self-conscious commentary. Cultural insights belong in <<FEEDBACK>> and <<PSYCHOLOGY>>, NEVER in the NPC's spoken dialogue.`;

function buildFormatInstructions(stage: LearningStage, lang: Language, round: number, scenarioId: string): string {
  const goal = getScenarioGoal(scenarioId);
  const optsInstruction = lang === 'en' ? goal?.optionsInstructionEn : goal?.optionsInstructionZh;
  const optsExample = lang === 'en' ? goal?.optionExampleEn : goal?.optionExampleZh;

  // Fill in the template placeholders
  let instructions = STREAMING_FORMAT
    .replace('{{OPTIONS_INSTRUCTION}}', optsInstruction || 'Exactly ONE must represent the culturally-correct response — mark it with [ACCEPT].')
    .replace('{{OPTION_EXAMPLE}}', optsExample || '[ACCEPT] The culturally appropriate response.');

  if (round === 1) {
    instructions += '\n\nThis is round 1 — include <<CONTEXT>> to set the scene.';
    if (stage === 'guided') {
      instructions += ' In guided mode round 1: start with <<CONTEXT>>, then <<NPC>>, then <<OPTIONS>>. No <<FEEDBACK>> needed yet.';
    }
  } else {
    instructions += `\n\nThis is round ${round} — no <<CONTEXT>> needed.`;
    if (stage === 'guided') {
      instructions += `\n\n⚠️ CRITICAL for round ${round}: The player made a choice in the previous round. You MUST start with <<FEEDBACK>> — a brief, 1-sentence feedback on their last choice. Then output <<NPC>> — the NPC's natural continuation (NOT the same line as before!). Then <<OPTIONS>>. Do NOT repeat the NPC's opening line. Advance the conversation naturally.`;
    }
  }

  if (stage === 'observe') {
    const targetMin = goal?.targetRoundRange?.min ?? 2;
    const targetMax = goal?.targetRoundRange?.max ?? 3;
    const goalDesc = lang === 'en' ? (goal?.goalLabelEn || 'make the culturally-correct move') : (goal?.goalLabelZh || '做出文化上得体的举动');

    instructions += `\n\nObserve mode — you are simulating a Chinese cultural interaction. The conversation follows a natural rhythm of polite back-and-forth. The cultural goal is: ${goalDesc}.

CONVERSATION ARC (this is round ${round}):
- Rounds 1-${targetMin - 1} (polite deflection phase): NPC initiates → Player responds with culturally-appropriate hesitation/deflection → Psychology analysis. The deflection should feel warm, not cold.
- Round ${targetMin}-${targetMax} (goal phase): NPC escalates with genuine emotion → Player makes the culturally-correct move with warmth and authenticity → Psychology analysis explaining why THIS moment is the right one.
- After the goal is achieved: NPC gives a BRIEF warm closing remark (1-2 sentences) → then output <<END>> to end the conversation.

CRITICAL RULES:
1. The conversation MUST converge naturally to the goal. Continuing to deflect past round ${targetMax} violates cultural norms.
2. After the goal is achieved, the NEXT call MUST include <<END>>. Do not add more dialogue after <<END>>.
3. Each round output exactly THREE sections in order: <<NPC>> → <<PLAYER>> → <<PSYCHOLOGY>>. Close each section before opening the next.
4. Include <<WISDOM>> when a cultural concept surfaces naturally.
5. Keep ALL psychology analysis strictly INSIDE <<PSYCHOLOGY>> tags.
6. Continue naturally from where the last exchange left off — do NOT restart from the beginning.`;
  }
  if (stage === 'guided') {
    const goalDesc = lang === 'en' ? (goal?.goalLabelEn || 'the culturally-correct move') : (goal?.goalLabelZh || '文化上得体的举动');
    const goalPattern = goal?.pattern || 'refuse_then_accept';
    const targetMin = goal?.targetRoundRange?.min ?? 2;
    const targetMax = goal?.targetRoundRange?.max ?? 3;

    instructions += `\n\nGuided mode. Each round: 1) The NPC speaks (<<NPC>>) — just their spoken dialogue with brief action notes. 2) Then offer four response options (<<OPTIONS>>) representing different cultural approaches, exactly one marked [ACCEPT]. Close <<NPC>> before opening <<OPTIONS>>.

After the player chooses, the next round MUST include: 1) <<FEEDBACK>> — brief, 1-sentence feedback on their choice, 2) <<NPC>> — the NPC's next dialogue, 3) <<OPTIONS>> — new set of choices. NEVER put option bullets inside <<NPC>>. NEVER skip <<FEEDBACK>> when a player choice was made in the previous round.

CONVERSATION ENDING: The cultural goal is: ${goalDesc}. The conversation should last ${targetMin}-${targetMax} rounds. When the player chooses the [ACCEPT] option that achieves the goal, you MUST end. Instead of <<OPTIONS>>, output: 1) <<FEEDBACK>> — celebrating their achievement, 2) <<NPC>> — a BRIEF warm closing remark (1-2 sentences), 3) <<END>> on its own line. Do NOT add more dialogue after <<END>>. Do NOT offer more options after the goal is achieved.`;
  }
  if (stage === 'practice') {
    const goalDesc = lang === 'en' ? (goal?.goalLabelEn || 'navigate the interaction gracefully') : (goal?.goalLabelZh || '优雅地驾驭互动');
    const goalPattern = goal?.pattern || 'refuse_then_accept';
    const acceptHints = goalPattern === 'refuse_indirectly'
      ? `using indirect refusal language (vague responses, citing constraints, offering alternatives) — NOT direct acceptance`
      : goalPattern === 'compete_then_concede'
      ? `conceding gracefully with a firm commitment to reciprocate`
      : goalPattern === 'deflect_and_connect'
      ? `humbly deflecting while returning warmth — NOT directly accepting`
      : `genuinely accepting with warmth (after appropriate hesitation)`;

    instructions += `

Practice mode. NPC speaks (<<NPC>>), then the player types freely — no options needed. Respond naturally to whatever they say.

The cultural goal is: ${goalDesc}.

EVERY ROUND (including the first response after NPC speaks):
1. Always start with <<FEEDBACK>> — a brief, 1-sentence feedback. Note what the player did well in cultural terms, very concisely.
2. Then <<NPC>> — the NPC's next natural conversational turn.

This means cultural insight appears throughout the conversation, not just at the end. Each player response is a teachable moment.

CONVERSATION ENDING — GOAL DETECTION:
After the player sends a message, read it carefully. If the player achieves the cultural goal (${acceptHints}), you MUST:
1. Output <<FEEDBACK>> — a brief, 1-sentence feedback celebrating their cultural fluency
2. Output <<NPC>> — a BRIEF warm closing remark from the NPC (1-2 sentences)
3. Output <<END>> on its own line. Do NOT add more dialogue after <<END>>.

Key: the conversation SHOULD end when the goal is achieved. Don't drag it out.`;
  }
  if (stage === 'challenge') {
    const goalDesc = lang === 'en' ? (goal?.goalLabelEn || 'navigate the interaction gracefully') : (goal?.goalLabelZh || '优雅地驾驭互动');
    const goalPattern = goal?.pattern || 'refuse_then_accept';
    const acceptHints = goalPattern === 'refuse_indirectly'
      ? `using indirect refusal language — NOT direct acceptance`
      : goalPattern === 'compete_then_concede'
      ? `conceding gracefully with a firm commitment to reciprocate`
      : goalPattern === 'deflect_and_connect'
      ? `humbly deflecting while returning warmth — NOT directly accepting`
      : `genuinely accepting with warmth (after appropriate hesitation)`;

    instructions += `

Challenge mode. <<NPC>> only — no <<OPTIONS>>. The player types freely. No hints, no guidance.

The cultural goal is: ${goalDesc}.

⚠️ NO <<FEEDBACK>> DURING THE CONVERSATION. This is challenge mode — the player must navigate without any cultural coaching. Do NOT output <<FEEDBACK>> during regular back-and-forth rounds. Only output <<NPC>> in each round.

Save <<PSYCHOLOGY>> and <<WISDOM>> for the very end.

CONVERSATION ENDING — GOAL DETECTION:
When the player achieves the cultural goal (${acceptHints}), you MUST:
1. Output <<FEEDBACK>> — a brief, 1-sentence feedback on their performance (this is the ONLY time FEEDBACK appears in challenge mode)
2. Output <<NPC>> — a BRIEF warm closing remark (1-2 sentences)
3. Output <<END>> on its own line. Do NOT add more dialogue after <<END>>.

Key: when the goal is achieved, END the conversation. Don't keep negotiating.`;
  }

  if (lang === 'en') {
    instructions += '\n\nRespond in English. Use pinyin (汉字) for Chinese terms.';
  } else {
    instructions += '\n\nRespond in Chinese (中文).';
  }

  return instructions;
}

export function buildSystemPrompt(
  scenarioId: string,
  stageId: string,
  lang: Language,
  currentRound: number,
  refusalCount: number = 0
): string {
  const scenario = getScenario(scenarioId);
  const promptData = getPromptData(scenarioId);
  const stage = getStage(stageId);

  if (!scenario || !promptData || !stage) {
    return `You are a friendly Chinese cultural guide. Respond in ${lang === 'en' ? 'English' : 'Chinese'}. Use these tags on their own lines: <<CONTEXT>>(round1), <<NPC>>, <<PLAYER>>(observe), <<PSYCHOLOGY>>(observe), <<WISDOM>>, <<OPTIONS>>, <<FEEDBACK>>. Close tags with <</TAG>>.`;
  }

  const langPrompt = lang === 'en' ? promptData.personaEn : promptData.personaZh;
  const lessonPrompt = lang === 'en' ? promptData.culturalLessonEn : promptData.culturalLessonZh;
  const motivationPrompt = lang === 'en' ? promptData.npcMotivationEn : promptData.npcMotivationZh;
  const mistakesPrompt = lang === 'en' ? promptData.commonMistakesEn : promptData.commonMistakesZh;
  const stageModifier = lang === 'en' ? stage.promptModifierEn : stage.promptModifierZh;

  const conceptsText = promptData.conceptsToIntroduce
    .map((c) => `- ${c.term} (${c.pinyin}, ${c.characters}): ${lang === 'en' ? c.definitionEn : c.definitionZh}`)
    .join('\n');

  const formatBody = buildFormatInstructions(stageId as LearningStage, lang, currentRound, scenarioId);

  // State context
  let stateContext = `Round ${currentRound} — ${lang === 'en' ? scenario.titleEn : scenario.titleZh} — ${lang === 'en' ? scenario.settingEn : scenario.settingZh}`;
  if (refusalCount > 0) {
    stateContext += lang === 'en'
      ? `\nThe player has politely declined ${refusalCount} time(s) so far.`
      : `\n玩家目前已礼貌拒绝${refusalCount}次。`;
  }

  const parts = [
    `=== OUTPUT FORMAT ===
${formatBody}

=== YOUR ROLE ===
${langPrompt}

=== SCENARIO CONTEXT ===
${lang === 'en' ? scenario.descriptionEn : scenario.descriptionZh}

=== STAGE ===
${stageModifier}

=== TONE ===
- Warm and familial — like a patient auntie or uncle
- Never call anything "wrong." Say "In Chinese culture, this might mean..."
- Acknowledge cultural differences gently: "This might feel different from what you're used to..."
- Use pinyin (汉字) with brief explanations for Chinese terms

=== WHAT YOU'RE TEACHING ===
${lessonPrompt}

=== NPC'S INNER MOTIVATION ===
${motivationPrompt}

=== COMMON PITFALLS TO WATCH FOR ===
${mistakesPrompt}

=== KEY CONCEPTS ===
${conceptsText}

=== CURRENT STATE ===
${stateContext}

=== AVAILABLE WISDOM CARDS ===
${(scenario.insightIds || []).join(', ')}`,
  ];

  return parts.join('\n\n');
}
