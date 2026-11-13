import { describe, expect, it } from 'vitest';
import { languageName } from './languageName';

describe('languageName', () => {
  it('names a language in itself, starting with a capital where the script has them', () => {
    expect(languageName('de')).toBe('Deutsch');
    expect(languageName('fr')).toBe('Français');
    expect(languageName('ja')).toBe('日本語');
  });
});
