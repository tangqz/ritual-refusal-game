import { describe, it, expect } from 'vitest';
import { SCENARIOS, getUnlockedScenarios, getScenariosByTier, type ScenarioId } from '@/lib/scenario-config';

describe('scenario-config', () => {
  it('all 8 scenarios have required metadata', () => {
    const ids = Object.keys(SCENARIOS) as ScenarioId[];
    expect(ids).toHaveLength(8);

    for (const id of ids) {
      const s = SCENARIOS[id];
      expect(s.id).toBe(id);
      expect(s.titleEn).toBeTruthy();
      expect(s.titleZh).toBeTruthy();
      expect(s.themeEn).toBeTruthy();
      expect(s.themeZh).toBeTruthy();
      expect(s.npcRoleEn).toBeTruthy();
      expect(s.npcRoleZh).toBeTruthy();
      expect(s.tier).toMatch(/^(beginner|intermediate|advanced)$/);
    }
  });

  it('beginner scenarios have no prerequisites', () => {
    const beginner = Object.values(SCENARIOS).filter(s => s.tier === 'beginner');
    for (const s of beginner) {
      const available = getUnlockedScenarios([]);
      const ids = available.map(a => a.id);
      expect(ids, `${s.id} should be available with no progress`).toContain(s.id);
    }
  });

  it('getUnlockedScenarios returns array with no completed scenarios', () => {
    const available = getUnlockedScenarios([]);
    expect(Array.isArray(available)).toBe(true);
    expect(available.length).toBeGreaterThan(0);
  });

  it('getScenariosByTier filters correctly', () => {
    const beginner = getScenariosByTier('beginner');
    expect(beginner.length).toBeGreaterThan(0);
    for (const s of beginner) {
      expect(s.tier).toBe('beginner');
    }
  });

  it('all scenarios have unique IDs', () => {
    const ids = Object.values(SCENARIOS).map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('scenarios have valid tier values', () => {
    const validTiers = ['beginner', 'intermediate', 'advanced'];
    for (const s of Object.values(SCENARIOS)) {
      expect(validTiers).toContain(s.tier);
    }
  });

  it('scenarios have start prompts defined', () => {
    for (const s of Object.values(SCENARIOS)) {
      expect(s.startPromptEn, `${s.id} missing EN start prompt`).toBeTruthy();
      expect(s.startPromptZh, `${s.id} missing ZH start prompt`).toBeTruthy();
    }
  });
});
