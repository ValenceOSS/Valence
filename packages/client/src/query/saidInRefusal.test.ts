import { describe, expect, it } from 'vitest';
import { saidInRefusal } from './saidInRefusal';

describe('saidInRefusal', () => {
  it('says a refusal it knows the words for in its own words', () => {
    expect(
      saidInRefusal({
        error: 'anything',
        code: 'error.sources.sourceIsLimitingHowOften',
        values: { source: 'TMDB' },
      }),
    ).toBe('TMDB is limiting how often Valence can ask. Try again in a minute.');
  });

  it('falls back to the server’s English for words it does not know', () => {
    expect(saidInRefusal({ error: 'Something new went wrong.' })).toBe('Something new went wrong.');
  });

  it('says nothing for a body that is not a refusal', () => {
    expect(saidInRefusal(undefined)).toBeNull();
    expect(saidInRefusal({ matches: [] })).toBeNull();
  });
});
