import { describe, it, expect } from 'vitest';
import { StreamParser } from '@/lib/stream-parser';

describe('StreamParser', () => {
  it('parses NPC dialogue from <<NPC>> tags', () => {
    const parser = new StreamParser();
    parser.feed('<<NPC>>');
    parser.feed('Hello there!');
    parser.feed('<</NPC>>');
    const result = parser.getResult();
    expect(result.npcText).toBe('Hello there!');
    expect(result.hasAnyTag).toBe(true);
  });

  it('parses options from <<OPTIONS>> tags', () => {
    const parser = new StreamParser();
    parser.feed('<<OPTIONS>>');
    parser.feed('- Option one');
    parser.feed('- [ACCEPT] Polite acceptance');
    parser.feed('<</OPTIONS>>');
    const result = parser.getResult();
    expect(result.options).toHaveLength(2);
    expect(result.options[0].text).toBe('Option one');
    expect(result.options[0].isAcceptance).toBe(false);
    expect(result.options[1].text).toBe('Polite acceptance');
    expect(result.options[1].isAcceptance).toBe(true);
  });

  it('handles multiple sections in sequence', () => {
    const parser = new StreamParser();
    parser.feed('<<CONTEXT>>');
    parser.feed('You are at a family dinner.');
    parser.feed('<</CONTEXT>>');
    parser.feed('<<NPC>>');
    parser.feed('Welcome! Please sit down.');
    parser.feed('<</NPC>>');
    const result = parser.getResult();
    expect(result.contextText).toBe('You are at a family dinner.');
    expect(result.npcText).toBe('Welcome! Please sit down.');
  });

  it('detects <<END_AVAILABLE>> tag', () => {
    const parser = new StreamParser();
    parser.feed('<<END_AVAILABLE>>');
    const result = parser.getResult();
    expect(result.endAvailable).toBe(true);
  });

  it('detects <<END>> tag and sets isEnd', () => {
    const parser = new StreamParser();
    parser.feed('<<END>>');
    parser.feed('title_name_en: The Gracious Guest');
    parser.feed('<</END>>');
    const result = parser.getResult();
    expect(result.isEnd).toBe(true);
    expect(result.title?.nameEn).toBe('The Gracious Guest');
  });

  it('handles empty input gracefully', () => {
    const parser = new StreamParser();
    const result = parser.getResult();
    expect(result.npcText).toBe('');
    expect(result.options).toEqual([]);
    expect(result.isEnd).toBe(false);
  });

  it('handles closing tags without << prefix (XML-style)', () => {
    const parser = new StreamParser();
    parser.feed('<<NPC>>');
    parser.feed('Some dialogue');
    parser.feed('</NPC>');
    const result = parser.getResult();
    expect(result.npcText).toBe('Some dialogue');
  });

  it('trims whitespace from section content', () => {
    const parser = new StreamParser();
    parser.feed('<<NPC>>');
    parser.feed('  ');
    parser.feed('  Hello  ');
    parser.feed('  ');
    parser.feed('<</NPC>>');
    const result = parser.getResult();
    expect(result.npcText).toBe('Hello');
  });

  it('validateOutput detects missing NPC in guided mode', () => {
    const parser = new StreamParser();
    parser.feed('<<OPTIONS>>');
    parser.feed('- Option A');
    parser.feed('<</OPTIONS>>');
    parser.getResult();
    const validation = parser.validateOutput('guided');
    expect(validation.valid).toBe(false);
    expect(validation.issues.some(i => i.includes('NPC'))).toBe(true);
  });

  it('validateOutput passes for valid guided mode output', () => {
    const parser = new StreamParser();
    parser.feed('<<NPC>>');
    parser.feed('Hello!');
    parser.feed('<</NPC>>');
    parser.feed('<<OPTIONS>>');
    parser.feed('- [ACCEPT] Sure');
    parser.feed('<</OPTIONS>>');
    parser.feed('<<FEEDBACK>>');
    parser.feed('Good job!');
    parser.feed('<</FEEDBACK>>');
    parser.getResult();
    const validation = parser.validateOutput('guided');
    expect(validation.valid).toBe(true);
  });
});
