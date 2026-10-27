import { describe, expect, it } from 'vitest';
import { SongRulesSchema, TitleRulesSchema } from './SmartRules';

const SONGS = { rules: [], order: 'random', limit: 50 };

const TITLES = { holds: 'films', rules: [], order: 'added', limit: null };

describe('SmartRules', () => {
  it('takes rules for songs, and refuses one only films have', () => {
    expect(
      SongRulesSchema.safeParse({ ...SONGS, rules: [{ kind: 'liked', is: true }] }).success,
    ).toBe(true);
    expect(
      SongRulesSchema.safeParse({
        ...SONGS,
        rules: [{ kind: 'watched', state: 'unwatched' }],
      }).success,
    ).toBe(false);
  });

  it('takes rules for films and shows, and refuses one only songs have', () => {
    expect(
      TitleRulesSchema.safeParse({
        ...TITLES,
        rules: [{ kind: 'runtime', atLeastMinutes: null, atMostMinutes: 100 }],
      }).success,
    ).toBe(true);
    expect(
      TitleRulesSchema.safeParse({
        ...TITLES,
        rules: [{ kind: 'plays', atLeast: 1, atMost: null }],
      }).success,
    ).toBe(false);
  });

  it('refuses a range with neither end, or with its ends the wrong way round', () => {
    const released = (from: number | null, to: number | null) =>
      SongRulesSchema.safeParse({ ...SONGS, rules: [{ kind: 'released', from, to }] }).success;

    expect(released(1990, null)).toBe(true);
    expect(released(null, null)).toBe(false);
    expect(released(2000, 1990)).toBe(false);
  });

  it('holds no more than a thousand, and at least one where it is limited', () => {
    expect(SongRulesSchema.safeParse({ ...SONGS, limit: 1000 }).success).toBe(true);
    expect(SongRulesSchema.safeParse({ ...SONGS, limit: 1001 }).success).toBe(false);
    expect(SongRulesSchema.safeParse({ ...SONGS, limit: 0 }).success).toBe(false);
  });

  it('refuses something it was not told about', () => {
    expect(SongRulesSchema.safeParse({ ...SONGS, extra: true }).success).toBe(false);
  });
});
