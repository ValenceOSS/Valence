import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseLanguage } from './chooseLanguage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chooseLanguage', () => {
  it('takes the first wanted language Valence has', () => {
    expect(chooseLanguage(['xx', 'de-DE', 'fr'])).toBe('de');
  });

  it('reads Chinese by its script or country and Portuguese by its country', () => {
    expect(chooseLanguage(['zh-TW'])).toBe('zh-Hant');
    expect(chooseLanguage(['zh-Hant-HK'])).toBe('zh-Hant');
    expect(chooseLanguage(['zh-CN'])).toBe('zh-Hans');
    expect(chooseLanguage(['pt_BR'])).toBe('pt-BR');
    expect(chooseLanguage(['pt-AO'])).toBe('pt-PT');
    expect(chooseLanguage(['no-NO'])).toBe('nb');
  });

  it('speaks English where nothing matches', () => {
    expect(chooseLanguage(['xx'])).toBe('en');
    expect(chooseLanguage([])).toBe('en');
  });

  it('chooses without Intl.Locale, which an app’s engine may not have', () => {
    vi.stubGlobal('Intl', { ...Intl, Locale: undefined });

    expect(chooseLanguage(['fr-CA'])).toBe('fr');
  });
});
