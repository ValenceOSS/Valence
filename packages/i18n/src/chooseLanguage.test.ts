import { describe, expect, it } from 'vitest';
import { chooseLanguage } from './chooseLanguage';

describe('chooseLanguage', () => {
  it('takes the first wanted language Valence has', () => {
    expect(chooseLanguage(['xx', 'de-DE', 'fr'])).toBe('de');
  });

  it('reads Chinese by its script and Portuguese by its country', () => {
    expect(chooseLanguage(['zh-TW'])).toBe('zh-Hant');
    expect(chooseLanguage(['zh-CN'])).toBe('zh-Hans');
    expect(chooseLanguage(['pt-BR'])).toBe('pt-BR');
    expect(chooseLanguage(['pt-AO'])).toBe('pt-PT');
  });

  it('speaks English where nothing matches', () => {
    expect(chooseLanguage(['xx'])).toBe('en');
    expect(chooseLanguage([])).toBe('en');
  });
});
