import { describe, expect, it } from 'vitest';
import { blankRule } from './blankRule';
import { songRuleOf } from './songRuleOf';

describe('songRuleOf', () => {
  it('takes a finished rule about songs', () => {
    expect(songRuleOf(blankRule('liked', 'k'))).toEqual({ kind: 'liked', is: true });
  });

  it('refuses a rule only films have, and one out of range', () => {
    expect(songRuleOf(blankRule('runtime', 'k'))).toBeNull();
    expect(songRuleOf({ ...blankRule('released', 'k'), first: '2000', second: '1990' })).toBeNull();
  });
});
