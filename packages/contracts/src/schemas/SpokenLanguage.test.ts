import { describe, expect, it } from 'vitest';
import { LanguagesInUseSchema, SpokenLanguageSchema } from './SpokenLanguage';

describe('SpokenLanguage', () => {
  it('takes a language Valence is translated into', () => {
    expect(SpokenLanguageSchema.parse('pt-BR')).toBe('pt-BR');
  });

  it('refuses a language Valence is not translated into', () => {
    expect(SpokenLanguageSchema.safeParse('xx').success).toBe(false);
  });

  it('reads the languages in use, either of which may be unchosen', () => {
    expect(LanguagesInUseSchema.parse({ server: 'de', profile: null })).toEqual({
      server: 'de',
      profile: null,
    });
  });
});
