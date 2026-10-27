import { describe, expect, it } from 'vitest';
import { draftOfSongRules } from './draftOfSongRules';

describe('draftOfSongRules', () => {
  it('starts a new playlist as fifty shuffled songs', () => {
    expect(draftOfSongRules(null)).toEqual({
      holds: 'films',
      rules: [],
      order: 'random',
      limit: '50',
    });
  });

  it('holds a playlist’s rules to edit, each with its own key', () => {
    const draft = draftOfSongRules({
      rules: [
        { kind: 'liked', is: true },
        { kind: 'added', withinDays: 7 },
      ],
      order: 'added',
      limit: null,
    });

    expect(draft.order).toBe('added');
    expect(draft.limit).toBe('');
    expect(new Set(draft.rules.map((rule) => rule.key)).size).toBe(2);
  });
});
