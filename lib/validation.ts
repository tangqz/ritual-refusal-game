import { z } from 'zod';

const MAX_USER_MESSAGE_LENGTH = 500;
const MAX_MESSAGES_PER_CONVERSATION = 20;

export const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(MAX_USER_MESSAGE_LENGTH),
});

export const chatRequestSchema = z.object({
  messages: z.array(messageSchema).max(MAX_MESSAGES_PER_CONVERSATION),
  scenario: z.string().min(1).max(50),
  stage: z.enum(['observe', 'guided', 'practice', 'challenge']),
  roundNumber: z.number().int().min(1).max(100),
  lang: z.enum(['en', 'zh']),
  sessionId: z.string().max(100).optional(),
  /** When true, the server appends a strong format reminder to the system prompt.
   *  Used on retry when the previous attempt produced raw text without tags. */
  retryHint: z.boolean().optional(),
});

export const debriefRequestSchema = z.object({
  messages: z.array(messageSchema).max(MAX_MESSAGES_PER_CONVERSATION * 2),
  scenarioId: z.string().min(1).max(50),
  stage: z.enum(['observe', 'guided', 'practice', 'challenge']),
  roundsPlayed: z.number().int().min(1).max(100),
  insightsCollected: z.array(z.string()).max(50).optional(),
  lang: z.enum(['en', 'zh']).optional(),
});

const MAX_FIM_PROMPT_LENGTH = 8000;

export const fimCompleteRequestSchema = z.object({
  prompt: z.string().min(1).max(MAX_FIM_PROMPT_LENGTH),
  suffix: z.string().max(MAX_USER_MESSAGE_LENGTH).optional(),
  stop: z.array(z.string()).max(10).optional(),
});

export const hintRequestSchema = z.object({
  messages: z.array(messageSchema).max(MAX_MESSAGES_PER_CONVERSATION),
  scenario: z.string().min(1).max(50),
  lang: z.enum(['en', 'zh']).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type DebriefRequest = z.infer<typeof debriefRequestSchema>;
export type FimCompleteRequest = z.infer<typeof fimCompleteRequestSchema>;
export type HintRequest = z.infer<typeof hintRequestSchema>;
