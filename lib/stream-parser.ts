export interface ParsedSections {
  contextText: string;
  npcText: string;
  playerText: string;
  psychologyText: string;
  feedbackText: string;
  options: ParsedOption[];
  wisdom: ParsedWisdom | null;
  endAvailable: boolean;
  isEnd: boolean;
  title: ParsedTitle | null;
  /** True if the LLM output contained at least one recognized <<TAG>> section.
   *  False means the LLM output raw text without any tag wrappers. */
  hasAnyTag: boolean;
}

export interface ParsedOption {
  text: string;
  isAcceptance: boolean;
}

export interface ParsedWisdom {
  id: string;
}

export interface ParsedTitle {
  nameEn: string;
  nameZh: string;
  emoji: string;
  descEn: string;
  descZh: string;
}

type SectionType =
  | 'NPC' | 'PLAYER' | 'PSYCHOLOGY' | 'FEEDBACK'
  | 'OPTIONS' | 'WISDOM' | 'CONTEXT' | 'END'
  | null;

/** Maximum characters per section before truncation. Prevents memory bloat if
 *  the LLM generates an extremely long monologue in a single tag section. */
const MAX_SECTION_LENGTH = 5000;

const OPEN_TAGS: [SectionType, RegExp][] = [
  ['NPC', /^<<NPC>>$/],
  ['PLAYER', /^<<PLAYER>>$/],
  ['PSYCHOLOGY', /^<<PSYCHOLOGY>>$/],
  ['FEEDBACK', /^<<FEEDBACK>>$/],
  ['OPTIONS', /^<<OPTIONS>>$/],
  ['WISDOM', /^<<WISDOM>>$/],
  ['CONTEXT', /^<<CONTEXT>>$/],
  ['END', /^<<END>>$/],
];

// Inline open tags: tag appears at start of line but has content after it.
// e.g. "<<NPC>>(smiles) Hello!" → tag "NPC", remainder "(smiles) Hello!"
const INLINE_OPEN_PATTERNS: [SectionType, RegExp][] = [
  ['NPC', /^<<NPC>>\s*(.+)/],
  ['PLAYER', /^<<PLAYER>>\s*(.+)/],
  ['PSYCHOLOGY', /^<<PSYCHOLOGY>>\s*(.+)/],
  ['FEEDBACK', /^<<FEEDBACK>>\s*(.+)/],
  ['OPTIONS', /^<<OPTIONS>>\s*(.+)/],
  ['WISDOM', /^<<WISDOM>>\s*(.+)/],
  ['CONTEXT', /^<<CONTEXT>>\s*(.+)/],
];

// Close tags: accept both <</TAG>> (correct) and </TAG> (XML-style, common LLM mistake)
const CLOSE_PATTERNS: Record<string, RegExp> = {
  NPC: /^(<<\/NPC>>|<\/NPC>)$/,
  PLAYER: /^(<<\/PLAYER>>|<\/PLAYER>)$/,
  PSYCHOLOGY: /^(<<\/PSYCHOLOGY>>|<\/PSYCHOLOGY>)$/,
  OPTIONS: /^(<<\/OPTIONS>>|<\/OPTIONS>)$/,
  WISDOM: /^(<<\/WISDOM>>|<\/WISDOM>)$/,
  CONTEXT: /^(<<\/CONTEXT>>|<\/CONTEXT>)$/,
  FEEDBACK: /^(<<\/FEEDBACK>>|<\/FEEDBACK>)$/,
  END: /^(<<\/END>>|<\/END>)$/,
};

export class StreamParser {
  private currentSection: SectionType = null;
  private buffer: string[] = [];
  private rawText: string[] = [];
  private parsed: ParsedSections;

  constructor() {
    this.parsed = this.emptyResult();
  }

  get activeSection(): SectionType {
    return this.currentSection;
  }

  private emptyResult(): ParsedSections {
    return {
      contextText: '',
      npcText: '',
      playerText: '',
      psychologyText: '',
      feedbackText: '',
      options: [],
      wisdom: null,
      endAvailable: false,
      isEnd: false,
      title: null,
      hasAnyTag: false,
    };
  }

  feed(line: string): {
    liveNpcText: string; livePlayerText: string;
    livePsychologyText: string; liveFeedbackText: string;
  } {
    const trimmed = line.trim();

    if (trimmed) this.rawText.push(line);

    const empty = {
      liveNpcText: this.parsed.npcText,
      livePlayerText: this.parsed.playerText,
      livePsychologyText: this.parsed.psychologyText,
      liveFeedbackText: this.parsed.feedbackText,
    };

    if (!trimmed) return empty;

    // Check for <<END_AVAILABLE>>
    if (trimmed === '<<END_AVAILABLE>>') {
      this.flushSection();
      this.parsed.endAvailable = true;
      return empty;
    }

    // Check for END close tag
    if (CLOSE_PATTERNS.END.test(trimmed)) {
      this.flushSection();
      this.parsed.isEnd = true;
      this.currentSection = null;
      this.buffer = [];
      return empty;
    }

    // Check for open tags (full-line)
    for (const [type, regex] of OPEN_TAGS) {
      if (regex.test(trimmed)) {
        this.flushSection();
        this.currentSection = type;
        this.buffer = [];
        this.parsed.hasAnyTag = true;
        // <<END>> immediately signals conversation end (title content parsed on flush)
        if (type === 'END') {
          this.parsed.isEnd = true;
        }
        return empty;
      }
    }

    // Check for inline open tags: <<TAG>> followed by content on the same line
    // e.g. "<<NPC>>(smiles warmly) Hello dear!" → open NPC, first line "(smiles warmly) Hello dear!"
    for (const [type, regex] of INLINE_OPEN_PATTERNS) {
      const match = trimmed.match(regex);
      if (match && match[1]) {
        this.flushSection();
        this.currentSection = type;
        this.buffer = [match[1]]; // the remainder after the tag
        this.parsed.hasAnyTag = true;
        // Update live text immediately for this section
        const content = match[1];
        switch (type) {
          case 'NPC': this.parsed.npcText = content; break;
          case 'PLAYER': this.parsed.playerText = content; break;
          case 'CONTEXT': this.parsed.contextText = content; break;
          case 'PSYCHOLOGY': this.parsed.psychologyText = content; break;
          case 'FEEDBACK': this.parsed.feedbackText = content; break;
        }
        return {
          liveNpcText: this.parsed.npcText,
          livePlayerText: this.parsed.playerText,
          livePsychologyText: this.parsed.psychologyText,
          liveFeedbackText: this.parsed.feedbackText,
        };
      }
    }

    // Check for close tags (both <</TAG>> and </TAG>)
    if (this.currentSection && CLOSE_PATTERNS[this.currentSection]?.test(trimmed)) {
      this.flushSection();
      this.currentSection = null;
      this.buffer = [];
      return empty;
    }

    // Accumulate content and update live text
    if (this.currentSection) {
      // Safeguard: stop accumulating if section is already at max length.
      // Prevents memory bloat from runaway LLM output in a single tag section.
      const currentContent = this.buffer.join('\n');
      if (currentContent.length < MAX_SECTION_LENGTH) {
        this.buffer.push(line);
      }
      const content = this.buffer.join('\n');

      switch (this.currentSection) {
        case 'NPC': this.parsed.npcText = content; break;
        case 'PLAYER': this.parsed.playerText = content; break;
        case 'CONTEXT': this.parsed.contextText = content; break;
        case 'PSYCHOLOGY': this.parsed.psychologyText = content; break;
        case 'FEEDBACK': this.parsed.feedbackText = content; break;
      }
    }

    return {
      liveNpcText: this.parsed.npcText,
      livePlayerText: this.parsed.playerText,
      livePsychologyText: this.parsed.psychologyText,
      liveFeedbackText: this.parsed.feedbackText,
    };
  }

  private flushSection() {
    if (!this.currentSection || this.buffer.length === 0) return;
    const content = this.buffer.join('\n').trim();

    switch (this.currentSection) {
      case 'NPC':
        // Safety nets: strip leaked non-NPC content from NPC text
        {
          const lines = content.split('\n');
          const bulletLines: string[] = [];
          const npcLines: string[] = [];
          const psychLines: string[] = [];
          let wisdomId: string | null = null;
          let inPsychBlock = false;

          // Markers that indicate leaked psychology / non-NPC content
          const psychMarkers = [
            "NPC's real thoughts:",
            "Player's real thoughts:",
            "Cultural subtext:",
            "NPC's inner thoughts:",
            "Player's inner thoughts:",
            "NPC心理活动：",
            "玩家心理活动：",
            "文化潜台词：",
            "NPC的真实想法：",
            "玩家的真实想法：",
          ];

          for (const line of lines) {
            const trimmed = line.trim();

            // Strip leaked wisdom card ID lines
            if (trimmed.startsWith('id:') && trimmed.length > 4 && !wisdomId) {
              wisdomId = trimmed.slice(3).trim();
              continue;
            }

            // Detect start of leaked psychology block
            const isPsychMarker = psychMarkers.some(m => trimmed.startsWith(m));
            if (isPsychMarker) {
              inPsychBlock = true;
              psychLines.push(line);
              continue;
            }

            // If we're in a psych block, check if the next line starts a new thought section
            if (inPsychBlock) {
              // Continue capturing psych content until we hit something that looks like normal dialogue
              const isStillPsych = psychMarkers.some(m => trimmed.startsWith(m))
                || trimmed.match(/^[A-Z][a-z]+'s (real|inner) thoughts/)
                || trimmed.match(/^(NPC|Player)/);
              if (isStillPsych || trimmed.length === 0 || trimmed.startsWith('(') === false) {
                psychLines.push(line);
                // If this line also starts another psych marker, keep going
                if (!isStillPsych && trimmed.length > 0) {
                  // Might be dialogue — check if it's clearly a psychology continuation
                  inPsychBlock = false;
                  npcLines.push(line);
                }
                continue;
              }
              inPsychBlock = false;
            }

            // Strip leaked bullet-point options (including [ACCEPT] prefixed)
            if (trimmed.startsWith('- ') && trimmed.length > 2) {
              bulletLines.push(trimmed.slice(2).trim());
            } else if (trimmed.startsWith('-[') && trimmed.length > 3) {
              // Handle "-[ACCEPT] ..." format
              bulletLines.push(trimmed.slice(1).trim());
            } else {
              npcLines.push(line);
            }
          }

          this.parsed.npcText = npcLines.join('\n').trim();

          // Detect regurgitated options leaked into NPC text (LLM failure mode):
          // The text contains 3+ segments that look like option-style action+dialogue
          // blocks — each starting with "(...)" and containing dialogue.
          // Pattern: "(action) dialogue text..." repeated multiple times.
          if (this.parsed.npcText) {
            const actionBlockCount = (this.parsed.npcText.match(/\([^)]+\)\s*[A-ZĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙa-z]/g) || []).length;
            // If 3+ action+dialogue blocks detected and no options were separately parsed,
            // this is likely the LLM regurgitating option texts into NPC
            if (actionBlockCount >= 3 && this.parsed.options.length === 0) {
              // Try to extract just the first segment as the NPC response
              // Split on action+dialogue boundaries: ) followed by capital letter or Chinese
              const segments = this.parsed.npcText.split(/\)\s*(?=[A-ZĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙa-z\u4e00-\u9fff])/);
              if (segments.length > 0) {
                // First segment is likely the warm closing — rest is regurgitated options
                const firstSegment = segments[0].trim();
                if (firstSegment.length > 10) {
                  this.parsed.npcText = firstSegment + (firstSegment.endsWith(')') ? '' : ')');
                }
              }
            }
          }

          // If we stripped psychology content and no psychology was set, use it
          if (psychLines.length > 0 && !this.parsed.psychologyText) {
            this.parsed.psychologyText = psychLines.join('\n').trim();
          }

          // If we found leaked options (3+), use them only if no options were parsed yet
          if (bulletLines.length >= 3 && this.parsed.options.length === 0) {
            this.parsed.options = bulletLines.map(text => {
              let isAcceptance = false;
              let cleanText = text;
              // Detect [ACCEPT] at start or end (LLM places it inconsistently)
              if (cleanText.startsWith('[ACCEPT]')) {
                isAcceptance = true;
                cleanText = cleanText.slice(8).trim();
              } else if (cleanText.endsWith('[ACCEPT]')) {
                isAcceptance = true;
                cleanText = cleanText.slice(0, -8).trim();
              }
              return { text: cleanText, isAcceptance };
            });
          }
          // If we found a leaked wisdom ID and no wisdom was set yet, use it
          if (wisdomId && !this.parsed.wisdom) {
            this.parsed.wisdom = { id: wisdomId };
          }
        }
        break;
      case 'PLAYER':
        this.parsed.playerText = content;
        break;
      case 'CONTEXT':
        this.parsed.contextText = content;
        break;
      case 'PSYCHOLOGY':
        this.parsed.psychologyText = content;
        break;
      case 'FEEDBACK':
        this.parsed.feedbackText = content;
        break;
      case 'OPTIONS':
        this.parseOptions(content);
        break;
      case 'WISDOM':
        this.parseWisdom(content);
        break;
      case 'END':
        this.parseEndTitle(content);
        break;
    }
    this.buffer = [];
  }

  private parseOptions(content: string) {
    this.parsed.options = [];
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('- ')) continue;
      let text = trimmed.slice(2).trim();
      let isAcceptance = false;
      // Detect [ACCEPT] marker — LLM may place it at start or end of option
      if (text.startsWith('[ACCEPT]')) {
        isAcceptance = true;
        text = text.slice(8).trim();
      } else if (text.endsWith('[ACCEPT]')) {
        isAcceptance = true;
        text = text.slice(0, -8).trim();
      }
      if (text) {
        this.parsed.options.push({ text, isAcceptance });
      }
    }
  }

  private parseWisdom(content: string) {
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (t.startsWith('id:')) {
        const id = t.replace(/^id:\s*/, '').trim();
        if (id) this.parsed.wisdom = { id };
        return;
      }
    }
    const firstLine = content.split('\n')[0]?.trim();
    if (firstLine) this.parsed.wisdom = { id: firstLine };
  }

  /** Validate parsed output against expected structure for the given stage.
   *  @param roundNumber — current conversation round (1-based). Used to skip
   *  FEEDBACK checks when the stage prompt doesn't require FEEDBACK yet (e.g.
   *  guided/practice round 1 where there's no player choice to reflect on). */
  validateOutput(stage: string, roundNumber?: number): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const r = this.parsed;
    const round = roundNumber ?? 1;

    if (!r.hasAnyTag && stage !== 'challenge') {
      issues.push('No LLM output tags detected — raw text may not be parseable');
    }

    if (stage === 'observe') {
      if (!r.npcText) issues.push('Observe mode: missing <<NPC>> dialogue');
      if (!r.playerText) issues.push('Observe mode: missing <<PLAYER>> dialogue');
    }

    if (stage === 'guided') {
      if (!r.npcText) issues.push('Guided mode: missing <<NPC>> dialogue');
      if (r.options.length === 0 && !r.isEnd) issues.push('Guided mode: missing <<OPTIONS>> and no <<END>>');
      // Round 1 in guided mode: prompt says "No <<FEEDBACK>> needed yet"
      if (!r.feedbackText && r.options.length > 0 && round > 1) {
        issues.push('Guided mode: missing <<FEEDBACK>> after options');
      }
    }

    if (stage === 'practice') {
      if (!r.npcText) issues.push('Practice mode: missing <<NPC>> dialogue');
      // Round 1 in practice mode: no player message to give feedback on yet
      if (!r.feedbackText && !r.isEnd && round > 1) {
        issues.push('Practice mode: missing <<FEEDBACK>>');
      }
    }

    // Wisdom reference check (all modes)
    if (r.wisdom && !r.wisdom.id) {
      issues.push('Wisdom card referenced but has no id');
    }

    return { valid: issues.length === 0, issues };
  }

  getResult(): ParsedSections {
    this.flushSection();
    // Fallback: if no NPC text, use accumulated raw text (strip tags and already-parsed content)
    if (!this.parsed.npcText && this.rawText.length > 0) {
      // Collect content that was already parsed into other sections
      const alreadyParsed = new Set<string>();
      if (this.parsed.contextText) {
        this.parsed.contextText.split('\n').forEach(l => alreadyParsed.add(l.trim()));
      }
      if (this.parsed.playerText) {
        this.parsed.playerText.split('\n').forEach(l => alreadyParsed.add(l.trim()));
      }
      if (this.parsed.psychologyText) {
        this.parsed.psychologyText.split('\n').forEach(l => alreadyParsed.add(l.trim()));
      }
      if (this.parsed.feedbackText) {
        this.parsed.feedbackText.split('\n').forEach(l => alreadyParsed.add(l.trim()));
      }

      const cleaned = this.rawText
        .map(l => l.trim())
        .filter(l => {
          if (!l) return false;
          if (l.startsWith('<<') || l.endsWith('>>') || l.startsWith('</') || l.endsWith('>')) return false;
          if (l.startsWith('- ') || l.startsWith('-[')) return false; // option bullets
          if (l.startsWith('id:') && l.length < 60) return false; // wisdom IDs
          // Skip lines that look like psychology markers
          if (/^(NPC|Player)'s (real|inner) thoughts/i.test(l)) return false;
          if (/^(NPC|玩家)心理活动/.test(l)) return false;
          if (l.startsWith('Cultural subtext:') || l.startsWith('文化潜台词：')) return false;
          // Skip lines already parsed into other sections
          if (alreadyParsed.has(l)) return false;
          return true;
        })
        .join('\n');
      if (cleaned) this.parsed.npcText = cleaned;
    }
    return this.parsed;
  }

  private parseEndTitle(content: string) {
    const titleData: Partial<ParsedTitle> = {};
    for (const raw of content.split('\n')) {
      const t = raw.trim();
      if (t.startsWith('title_name_en:')) titleData.nameEn = t.replace(/^title_name_en:\s*/, '').trim();
      else if (t.startsWith('title_name_zh:')) titleData.nameZh = t.replace(/^title_name_zh:\s*/, '').trim();
      else if (t.startsWith('title_emoji:')) titleData.emoji = t.replace(/^title_emoji:\s*/, '').trim();
      else if (t.startsWith('title_desc_en:')) titleData.descEn = t.replace(/^title_desc_en:\s*/, '').trim();
      else if (t.startsWith('title_desc_zh:')) titleData.descZh = t.replace(/^title_desc_zh:\s*/, '').trim();
    }

    if (titleData.nameEn || titleData.nameZh) {
      this.parsed.title = {
        nameEn: titleData.nameEn || '',
        nameZh: titleData.nameZh || '',
        emoji: titleData.emoji || '🌟',
        descEn: titleData.descEn || '',
        descZh: titleData.descZh || '',
      };
    }
  }
}
