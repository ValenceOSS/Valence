import { describe, expect, it } from 'vitest';
import { isLanguage } from './isLanguage';

describe('isLanguage', () => {
  it('knows the languages Valence is translated into, as they are written', () => {
    expect(isLanguage('de')).toBe(true);
    expect(isLanguage('zh-Hant')).toBe(true);
    expect(isLanguage('zh-hant')).toBe(false);
    expect(isLanguage('xx')).toBe(false);
  });
});
