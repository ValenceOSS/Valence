import { describe, expect, it } from 'vitest';
import { blankRule } from './blankRule';
import { titleRuleOf } from './titleRuleOf';

describe('titleRuleOf', () => {
  it('takes a finished rule about films and shows', () => {
    expect(titleRuleOf(blankRule('runtime', 'k'))).toEqual({
      kind: 'runtime',
      atLeastMinutes: null,
      atMostMinutes: 100,
    });
  });

  it('refuses a rule only songs have, and one out of range', () => {
    expect(titleRuleOf(blankRule('liked', 'k'))).toBeNull();
    expect(titleRuleOf({ ...blankRule('rating', 'k'), first: '11' })).toBeNull();
  });
});
