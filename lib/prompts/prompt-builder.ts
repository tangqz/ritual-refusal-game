import type { ScenarioId, LearningStage, ScenarioConfig } from '../scenario-config';
import { SCENARIOS } from '../scenario-config';
import { STAGES } from '../learning-progression';
import { SCENARIO_PROMPTS, type ScenarioPromptData } from './scenario-prompts';
import type { Language } from '../i18n';
import { AUNTIE_WISDOMS } from '../cultural-insights';

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
(Guided and challenge modes) Four ways the player might respond. Exactly ONE must represent accepting the offer — mark it with [ACCEPT] at the start of the line. The other three are different refusal/deflection strategies.
- [ACCEPT] (bow, accept with both hands) Thank you, Auntie! Wishing you health!
- (wave hands) No no, I really can't...
- (step back) Auntie, you're too kind, but...
- (hesitate) Oh, I don't know...
<</OPTIONS>>

<<FEEDBACK>>
(Guided mode, after the player picks an option) Warm, 2-3 sentence reflection on their choice — what cultural instinct it shows, and how it fits Chinese social norms. Lead with what they did well. Don't call anything "wrong."
<</FEEDBACK>>

Tags use double brackets: <<TAG>> opens, <</TAG>> closes. Each on its own line.
NPC dialogue and OPTIONS are separate sections — close <</NPC>> before <<OPTIONS>>.
Only reference these wisdom card IDs: ${AUNTIE_WISDOMS.map(w => w.id).join(', ')}. Don't invent new ones.`;

function buildFormatInstructions(stage: LearningStage, lang: Language, round: number): string {
  let instructions = STREAMING_FORMAT;

  if (round === 1) {
    instructions += '\n\nThis is round 1 — include <<CONTEXT>> to set the scene.';
  } else {
    instructions += `\n\nThis is round ${round} — no <<CONTEXT>> needed.`;
  }

  if (stage === 'observe') {
    instructions += '\n\nObserve mode. You play both sides: <<NPC>>, <<PLAYER>>, and <<PSYCHOLOGY>> each round. Include <<WISDOM>> when relevant. Let the exchange reach its natural conclusion — the player controls when to move on.';
  }
  if (stage === 'guided') {
    instructions += '\n\nGuided mode. Each round: the NPC speaks (<<NPC>>), then you offer four response options (<<OPTIONS>>) representing different cultural approaches. After the player chooses, next round: reflect on their choice (<<FEEDBACK>>) then continue the conversation naturally.';
  }
  if (stage === 'practice') {
    instructions += '\n\nPractice mode. NPC speaks (<<NPC>>), then the player types freely — no options needed. Respond naturally to whatever they say.';
  }
  if (stage === 'challenge') {
    instructions += '\n\nChallenge mode. <<NPC>> only — no <<OPTIONS>>. The player types freely. No hints, no guidance. Save <<PSYCHOLOGY>> and <<WISDOM>> for the end of the conversation.';
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

  const formatBody = buildFormatInstructions(stageId as LearningStage, lang, currentRound);

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
