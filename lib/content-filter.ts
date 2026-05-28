/**
 * Basic content moderation filter for user input.
 * Catches common harmful patterns before messages reach the LLM.
 * For production, consider replacing with OpenAI Moderation API or similar.
 */

// Patterns that indicate prompt injection attempts
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /<<SYSTEM>>/i,
  /<<END>>/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /forget\s+(everything|all)\s+(you|we)\s+/i,
  /act\s+as\s+(a|an)\s+(different|new)\s+/i,
  /DAN\s+mode/i,
  /jailbreak/i,
];

// Patterns for personal information
const PERSONAL_INFO_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // phone (US/CA)
  /\b\d{3}[-.]?\d{4}[-.]?\d{4}\b/, // phone (CN)
  /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/, // SSN-like
];

// Patterns for harmful content
const HARMFUL_PATTERNS = [
  /\b(hate\s*speech|self[- ]?harm|suicide|kill\s*(yourself|myself))\b/i,
  /(暴力|自杀|自残|种族歧视)/,
];

export interface FilterResult {
  allowed: boolean;
  reason?: string;
}

export function filterUserInput(text: string): FilterResult {
  if (!text || text.trim().length === 0) {
    return { allowed: true }; // Empty messages handled by validation
  }

  // Check prompt injection
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { allowed: false, reason: 'Message contains prompt injection patterns.' };
    }
  }

  // Check personal information
  for (const pattern of PERSONAL_INFO_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: 'Please do not share personal information (email, phone, etc.) in conversations.',
      };
    }
  }

  // Check harmful content
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: 'Message contains concerning content. If you need support, please reach out to appropriate resources.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Post-processing safety filter for LLM-generated content.
 * Ensures NPC dialogue shown to the player does not contain harmful material.
 * Returns the original text if safe, or a replacement message if flagged.
 */
export function filterLlmOutput(text: string): { safe: boolean; text: string } {
  if (!text || text.trim().length === 0) return { safe: true, text };

  const replacements: Array<{ pattern: RegExp; replacement: string }> = [
    // Violence / self-harm
    { pattern: /\b(suicide|kill yourself|self-harm|self harm|cut yourself)\b/i, replacement: '…' },
    { pattern: /(自杀|自残|割腕|跳楼|上吊)/, replacement: '……' },
    // Sexual content
    { pattern: /\b(sexual|sexually explicit|porn|intercourse|masturbat)\b/i, replacement: '…' },
    { pattern: /(色情|性交|自慰|强奸|猥亵)/, replacement: '……' },
    // Extreme political/hate speech
    { pattern: /\b(terroris|massacre|genocide|ethnic cleansing|hate crime)\b/i, replacement: '…' },
    { pattern: /(恐怖主义|大屠杀|种族灭绝|仇恨犯罪)/, replacement: '……' },
  ];

  let filtered = text;
  let flagged = false;

  for (const { pattern, replacement } of replacements) {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(new RegExp(pattern.source, 'gi'), replacement);
      flagged = true;
    }
  }

  // If the text was heavily redacted (more than 30% replaced), return a safe fallback
  if (flagged && filtered.replace(/…+|\*+/g, '').length < text.replace(/\s/g, '').length * 0.5) {
    return {
      safe: false,
      text: '[This message was filtered for safety. If you believe this was an error, please try again.]',
    };
  }

  return { safe: !flagged || filtered !== text, text: filtered };
}
