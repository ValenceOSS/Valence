import { describe, expect, it } from 'vitest';
import { wordsByLanguage } from './wordsByLanguage';

describe('wordsByLanguage', () => {
  it('offers a loader for every language but English', () => {
    const plugin = wordsByLanguage();
    const code = plugin.load(String(plugin.resolveId('virtual:valence-words'))) ?? '';

    expect(code).toContain("'de': () => import('virtual:valence-words/de')");
    expect(code).not.toContain("'en':");
  });

  it('gives a language its words by handler, without the translators’ notes', () => {
    const plugin = wordsByLanguage();
    const code = plugin.load(String(plugin.resolveId('virtual:valence-words/de'))) ?? '';

    expect(code).toContain('common.cancel');
    expect(code).not.toContain('context');
  });
});
