import { describe, expect, it } from 'vitest';
import { blankRule } from './blankRule';
import { songRuleOf } from './songRuleOf';
import { titleRuleOf } from './titleRuleOf';

describe('blankRule', () => {
  it('starts every song rule as one that could be saved straight away', () => {
    for (const kind of ['liked', 'followedArtist', 'plays', 'lastPlayed', 'added'] as const) {
      expect(songRuleOf(blankRule(kind, 'k'))).not.toBeNull();
    }
  });

  it('starts every film rule but those that need choosing as one that could be saved', () => {
    for (const kind of [
      'runtime',
      'watched',
      'rating',
      'yourStars',
      'added',
      'ageRating',
    ] as const) {
      expect(titleRuleOf(blankRule(kind, 'k'))).not.toBeNull();
    }
  });

  it('leaves a genre, years or a library to be chosen', () => {
    expect(titleRuleOf(blankRule('genre', 'k'))).toBeNull();
    expect(titleRuleOf(blankRule('released', 'k'))).toBeNull();
    expect(titleRuleOf(blankRule('library', 'k'))).toBeNull();
  });

  it('keeps the key it was given', () => {
    expect(blankRule('liked', 'mine').key).toBe('mine');
  });
});
