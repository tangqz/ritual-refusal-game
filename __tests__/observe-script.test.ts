import { describe, it, expect } from 'vitest';
import { getObserveScript, chunkForStreaming } from '@/lib/observe-script';

describe('getObserveScript', () => {
  it('returns script for known scenario in English', () => {
    const script = getObserveScript('hongbao', 'en');
    expect(script).not.toBeNull();
    expect(script!.scenarioId).toBe('hongbao');
    expect(script!.rounds.length).toBeGreaterThan(0);
  });

  it('returns script for known scenario in Chinese', () => {
    const script = getObserveScript('hongbao', 'zh');
    expect(script).not.toBeNull();
    expect(script!.scenarioId).toBe('hongbao');
  });

  it('returns null for unknown scenario', () => {
    const script = getObserveScript('nonexistent' as 'hongbao', 'en');
    expect(script).toBeNull();
  });

  it('all 8 scenarios have scripts in both languages', () => {
    const scenarios = ['hongbao', 'compliment', 'guest', 'gift', 'bill', 'dinner', 'workplace', 'refusal'];
    for (const id of scenarios) {
      const en = getObserveScript(id, 'en');
      const zh = getObserveScript(id, 'zh');
      expect(en, `Missing EN script for ${id}`).not.toBeNull();
      expect(zh, `Missing ZH script for ${id}`).not.toBeNull();
      expect(en!.rounds.length, `${id} EN should have rounds`).toBeGreaterThan(0);
      expect(zh!.rounds.length, `${id} ZH should have rounds`).toBeGreaterThan(0);
    }
  });
});

describe('chunkForStreaming', () => {
  it('splits text at sentence-ending punctuation', () => {
    const chunks = chunkForStreaming('Hello. World!');
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toContain('Hello');
  });

  it('preserves whitespace between sentences', () => {
    const chunks = chunkForStreaming('Hello. World');
    const joined = chunks.join('');
    expect(joined).toBe('Hello. World');
  });

  it('handles Chinese punctuation', () => {
    const chunks = chunkForStreaming('你好。世界！');
    expect(chunks.length).toBeGreaterThan(1);
    const joined = chunks.join('');
    expect(joined).toBe('你好。世界！');
  });

  it('handles text without punctuation as single chunk', () => {
    const chunks = chunkForStreaming('Hello World');
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe('Hello World');
  });

  it('returns array with original text when empty', () => {
    const chunks = chunkForStreaming('');
    expect(chunks).toEqual(['']);
  });

  it('splits long segments at comma breaks', () => {
    const longText = 'A'.repeat(90) + ', rest of text';
    const chunks = chunkForStreaming(longText);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('handles newlines as chunk boundaries', () => {
    const chunks = chunkForStreaming('Line 1\nLine 2');
    expect(chunks.length).toBe(2);
    const joined = chunks.join('');
    expect(joined).toBe('Line 1\nLine 2');
  });
});
