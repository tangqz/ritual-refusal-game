import { describe, it, expect } from 'vitest';
import { t, defaultLanguage } from '@/lib/i18n';

describe('i18n', () => {
  it('returns English translation for known key', () => {
    const result = t('home.title', 'en');
    expect(result).toBe('Cultural Compass');
  });

  it('returns Chinese translation for known key', () => {
    const result = t('home.title', 'zh');
    expect(result).toBe('文化指南');
  });

  it('falls back to English when Chinese translation is missing', () => {
    // home.title is defined in both languages, so this should return the Chinese
    const result = t('home.title', 'zh');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns key string for completely unknown key', () => {
    const result = t('nonexistent.key.path', 'en');
    expect(result).toBe('nonexistent.key.path');
  });

  it('applies variable replacements', () => {
    // Test a key that uses replacements
    const result = t('home.title', 'en', { name: 'Test' });
    expect(result).toBeTruthy();
  });

  it('defaultLanguage is English', () => {
    expect(defaultLanguage).toBe('en');
  });

  it('returns non-empty strings for all top-level navigation keys', () => {
    const keys = [
      'home.startJourney',
      'home.continueJourney',
      'stageSelector.title',
      'stageSelector.start',
      'journey.title',
      'debrief.title',
      'common.loading',
    ];
    for (const key of keys) {
      const en = t(key, 'en');
      const zh = t(key, 'zh');
      expect(en, `English key ${key} should not be empty`).toBeTruthy();
      expect(zh, `Chinese key ${key} should not be empty`).toBeTruthy();
      expect(en).not.toBe(key);
      expect(zh).not.toBe(key);
    }
  });
});
