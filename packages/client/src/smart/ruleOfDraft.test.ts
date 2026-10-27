import { describe, expect, it } from 'vitest';
import { blankRule } from './blankRule';
import { ruleOfDraft } from './ruleOfDraft';

describe('ruleOfDraft', () => {
  it('reads the numbers typed, an empty field as none', () => {
    expect(ruleOfDraft({ ...blankRule('released', 'k'), first: '1990', second: '' })).toEqual({
      kind: 'released',
      from: 1990,
      to: null,
    });
  });

  it('says nothing where a number typed is not one, or one it needs is missing', () => {
    expect(ruleOfDraft({ ...blankRule('plays', 'k'), first: 'lots' })).toBeNull();
    expect(ruleOfDraft({ ...blankRule('added', 'k'), first: '' })).toBeNull();
  });

  it('reads which way a choice was made', () => {
    expect(ruleOfDraft({ ...blankRule('liked', 'k'), choice: 'isNot' })).toEqual({
      kind: 'liked',
      is: false,
    });
    expect(ruleOfDraft({ ...blankRule('genre', 'k'), choice: 'isNot', picked: ['Drama'] })).toEqual(
      { kind: 'genre', anyOf: ['Drama'], isNegated: true },
    );
    expect(ruleOfDraft({ ...blankRule('lastPlayed', 'k'), choice: 'notWithin' })).toEqual({
      kind: 'lastPlayed',
      withinDays: 30,
      isNegated: true,
    });
  });

  it('says nothing for a watched state it does not know', () => {
    expect(ruleOfDraft({ ...blankRule('watched', 'k'), choice: 'sideways' })).toBeNull();
  });
});
