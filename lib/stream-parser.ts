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
    livePsychologyText: string;
  } {
    const trimmed = line.trim();

    if (trimmed) this.rawText.push(line);

    const empty = {
      liveNpcText: this.parsed.npcText,
      livePlayerText: this.parsed.playerText,
      livePsychologyText: this.parsed.psychologyText,
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
          let wisdomId: string | null = null;
          for (const line of lines) {
            const trimmed = line.trim();
            // Strip leaked wisdom card ID lines
            if (trimmed.startsWith('id:') && trimmed.length > 4 && !wisdomId) {
              wisdomId = trimmed.slice(3).trim();
              continue;
            }
            // Strip leaked bullet-point options
            if (trimmed.startsWith('- ') && trimmed.length > 2) {
              bulletLines.push(trimmed.slice(2).trim());
            } else {
              npcLines.push(line);
            }
          }
          this.parsed.npcText = npcLines.join('\n').trim();
          // If we found leaked options (3+), use them
          if (bulletLines.length >= 3) {
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
    // Fallback: if no NPC text, use accumulated raw text (strip tags)
    if (!this.parsed.npcText && this.rawText.length > 0) {
      const cleaned = this.rawText
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('<<') && !l.endsWith('>>') && !l.startsWith('</') && !l.endsWith('>'))
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
