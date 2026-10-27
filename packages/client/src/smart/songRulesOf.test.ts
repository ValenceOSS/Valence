import { describe, expect, it } from 'vitest';
import { blankRule } from './blankRule';
import { draftOfSongRules } from './draftOfSongRules';
import { songRulesOf } from './songRulesOf';

describe('songRulesOf', () => {
  it('reads every rule, the order and the most it holds', () => {
    expect(
      songRulesOf({ ...draftOfSongRules(null), rules: [blankRule('liked', 'k')], limit: '25' }),
    ).toEqual({ rules: [{ kind: 'liked', is: true }], order: 'random', limit: 25 });
  });

  it('holds up to the most there can be where no limit is typed', () => {
    expect(songRulesOf({ ...draftOfSongRules(null), limit: ' ' })?.limit).toBeNull();
  });

  it('says nothing while a rule is unfinished or the limit is not a whole number', () => {
    expect(songRulesOf({ ...draftOfSongRules(null), rules: [blankRule('genre', 'k')] })).toBeNull();
    expect(songRulesOf({ ...draftOfSongRules(null), limit: '2.5' })).toBeNull();
  });
});
