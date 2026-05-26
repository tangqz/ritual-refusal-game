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

// Close tags: accept both <</TAG>> (correct) and </TAG> (XML-style, common LLM mistake)
function makeCloseRegex(tag: string): RegExp {
  return /^<<\/TAG>>$/.source
    ? new RegExp(`^(<<\\/${tag}>>|<\\/${tag}>)$`)
    : new RegExp(`^(<<\\/${tag}>>|<\\/${tag}>)$`);
}

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

    // Check for open tags
    for (const [type, regex] of OPEN_TAGS) {
      if (regex.test(trimmed)) {
        this.flushSection();
        this.currentSection = type;
        this.buffer = [];
        // <<END>> immediately signals conversation end (title content parsed on flush)
        if (type === 'END') {
          this.parsed.isEnd = true;
        }
        return empty;
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
      this.buffer.push(line);
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

          // If we stripped psychology content and no psychology was set, use it
          if (psychLines.length > 0 && !this.parsed.psychologyText) {
            this.parsed.psychologyText = psychLines.join('\n').trim();
          }

          // If we found leaked options (3+), use them only if no options were parsed yet
          if (bulletLines.length >= 3 && this.parsed.options.length === 0) {
            this.parsed.options = bulletLines.map(text => {
              let isAcceptance = false;
              let cleanText = text;
              if (cleanText.startsWith('[ACCEPT]')) {
                isAcceptance = true;
                cleanText = cleanText.slice(8).trim();
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
      // Detect [ACCEPT] marker
      if (text.startsWith('[ACCEPT]')) {
        isAcceptance = true;
        text = text.slice(8).trim();
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
