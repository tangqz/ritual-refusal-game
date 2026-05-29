/**
 * Structured logger for LLM API calls. Logs request/response details
 * to the server console for debugging prompt engineering and API issues.
 *
 * Set LLM_DEBUG=true in .env.local to enable verbose logging (full payloads).
 * By default, logs only summaries to keep noise low.
 *
 * When LLM_DEBUG=true, full request/response payloads are also written to
 * llm-logs/ as JSON files for offline analysis.
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const DEBUG = process.env.LLM_DEBUG === 'true';
const LOGS_DIR = join(process.cwd(), 'llm-logs');

interface LogEntry {
  timestamp: string;
  type: 'chat' | 'hint' | 'fim';
  phase: 'request' | 'response' | 'error';
  requestId: string;
  data: Record<string, unknown>;
}

const recentLogs: LogEntry[] = [];
const MAX_RECENT = 200;

/** Pending file writes — resolved before next write to avoid race conditions */
let writeChain: Promise<void> = Promise.resolve();

/** Save or merge log data for a requestId. Uses a combined JSON file that
 *  accumulates request + response + error phases as they occur. */
function saveLogFile(requestId: string, newData: Record<string, unknown>): void {
  writeChain = writeChain.then(async () => {
    try {
      await mkdir(LOGS_DIR, { recursive: true });
      const filename = join(LOGS_DIR, `${requestId}.json`);

      // Try to read existing data and merge
      let existing: Record<string, unknown> = {};
      try {
        const raw = await readFile(filename, 'utf-8');
        existing = JSON.parse(raw);
      } catch { /* file doesn't exist yet — start fresh */ }

      const merged = { ...existing, ...newData };
      await writeFile(filename, JSON.stringify(merged, null, 2), 'utf-8');
    } catch {
      // Silently ignore — file logging is best-effort
    }
  });
}

function rid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function fmtTime(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 23);
}

function summarizeMessages(msgs: Array<{ role: string; content: string }>): string {
  return msgs.map((m) => {
    const preview = m.content.length > 120
      ? m.content.slice(0, 120) + '...'
      : m.content;
    return `  [${m.role}] ${preview.replace(/\n/g, '\\n')}`;
  }).join('\n');
}

export function logChatRequest(
  requestId: string,
  params: {
    scenario: string;
    stage: string;
    roundNumber: number;
    lang: string;
    refusalCount: number;
    systemPromptLength: number;
    messageCount: number;
    messages: Array<{ role: string; content: string }>;
  }
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    type: 'chat',
    phase: 'request',
    requestId,
    data: params as unknown as Record<string, unknown>,
  };
  recentLogs.push(entry);
  if (recentLogs.length > MAX_RECENT) recentLogs.shift();

  console.log(
    `\n${'='.repeat(60)}` +
    `\n[LLM:chat:request] ${fmtTime()} | id=${requestId}` +
    `\n  scenario=${params.scenario} stage=${params.stage} round=${params.roundNumber} lang=${params.lang}` +
    `\n  systemPrompt=${params.systemPromptLength}chars messages=${params.messageCount} refusals=${params.refusalCount}`
  );
  if (DEBUG) {
    console.log(`  --- messages ---\n${summarizeMessages(params.messages)}\n  --- end messages ---`);
    // Save full request to file for offline analysis
    saveLogFile(requestId, {
      phase: 'request',
      requestId,
      timestamp: entry.timestamp,
      scenario: params.scenario,
      stage: params.stage,
      roundNumber: params.roundNumber,
      lang: params.lang,
      refusalCount: params.refusalCount,
      systemPromptLength: params.systemPromptLength,
      messageCount: params.messageCount,
      messages: params.messages,
    });
  }
}

export function logChatResponse(
  requestId: string,
  params: {
    latencyMs: number;
    totalChunks: number;
    totalChars: number;
    thinkingChars: number;
    parsedTags: string[];
    rawText?: string;
  }
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    type: 'chat',
    phase: 'response',
    requestId,
    data: params as unknown as Record<string, unknown>,
  };
  recentLogs.push(entry);
  if (recentLogs.length > MAX_RECENT) recentLogs.shift();

  console.log(
    `[LLM:chat:response] ${fmtTime()} | id=${requestId}` +
    `\n  latency=${params.latencyMs}ms chunks=${params.totalChunks} chars=${params.totalChars} thinking=${params.thinkingChars}` +
    `\n  tags=${params.parsedTags.join(', ') || '(none)'}`
  );
  if (DEBUG && params.rawText) {
    const preview = params.rawText.length > 500 ? params.rawText.slice(0, 500) + '...' : params.rawText;
    console.log(`  --- raw ---\n${preview}\n  --- end raw ---`);
    // Append response data to the same request log file
    saveLogFile(requestId, {
      phase: 'response',
      requestId,
      timestamp: entry.timestamp,
      latencyMs: params.latencyMs,
      totalChunks: params.totalChunks,
      totalChars: params.totalChars,
      thinkingChars: params.thinkingChars,
      parsedTags: params.parsedTags,
      rawText: params.rawText,
    });
  }
}

export function logChatError(
  requestId: string,
  params: {
    latencyMs: number;
    error: string;
    status?: number;
    attempt?: number;
  }
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    type: 'chat',
    phase: 'error',
    requestId,
    data: params as unknown as Record<string, unknown>,
  };
  recentLogs.push(entry);
  if (recentLogs.length > MAX_RECENT) recentLogs.shift();

  console.error(
    `[LLM:chat:error] ${fmtTime()} | id=${requestId}` +
    `\n  latency=${params.latencyMs}ms error=${params.error} status=${params.status || 'N/A'} attempt=${params.attempt ?? 1}`
  );
}

export function logHintRequest(
  requestId: string,
  params: {
    scenario: string;
    lang: string;
    messageCount: number;
  }
): void {
  console.log(
    `[LLM:hint:request] ${fmtTime()} | id=${requestId}` +
    `\n  scenario=${params.scenario} lang=${params.lang} messages=${params.messageCount}`
  );
}

export function logHintResponse(
  requestId: string,
  params: {
    latencyMs: number;
    hintLength: number;
    hint: string;
  }
): void {
  console.log(
    `[LLM:hint:response] ${fmtTime()} | id=${requestId}` +
    `\n  latency=${params.latencyMs}ms hintLen=${params.hintLength}` +
    (DEBUG ? `\n  hint="${params.hint}"` : '')
  );
}

export function logHintError(
  requestId: string,
  params: {
    latencyMs: number;
    error: string;
    status?: number;
  }
): void {
  console.error(
    `[LLM:hint:error] ${fmtTime()} | id=${requestId}` +
    `\n  latency=${params.latencyMs}ms error=${params.error} status=${params.status || 'N/A'}`
  );
}

export function logFimRequest(
  requestId: string,
  params: {
    promptLength: number;
    suffixLength: number;
  }
): void {
  console.log(
    `[LLM:fim:request] ${fmtTime()} | id=${requestId}` +
    `\n  promptLen=${params.promptLength} suffixLen=${params.suffixLength}`
  );
}

export function logFimResponse(
  requestId: string,
  params: {
    latencyMs: number;
    completionLength: number;
    completion: string;
  }
): void {
  console.log(
    `[LLM:fim:response] ${fmtTime()} | id=${requestId}` +
    `\n  latency=${params.latencyMs}ms completionLen=${params.completionLength}` +
    (DEBUG ? `\n  completion="${params.completion}"` : '')
  );
}

export function logFimError(
  requestId: string,
  params: {
    latencyMs: number;
    error: string;
    status?: number;
  }
): void {
  console.error(
    `[LLM:fim:error] ${fmtTime()} | id=${requestId}` +
    `\n  latency=${params.latencyMs}ms error=${params.error} status=${params.status || 'N/A'}`
  );
}

export { rid };
