import { describe, expect, it } from 'vitest';
import { blankRule } from './blankRule';
import { draftOfTitleRules } from './draftOfTitleRules';
import { titleRulesOf } from './titleRulesOf';

describe('titleRulesOf', () => {
  it('reads what it holds, every rule, the order and the most it holds', () => {
    expect(
      titleRulesOf({
        ...draftOfTitleRules(null),
        holds: 'series',
        rules: [blankRule('watched', 'k')],
        order: 'rating',
        limit: '10',
      }),
    ).toEqual({
      holds: 'series',
      rules: [{ kind: 'watched', state: 'unwatched' }],
      order: 'rating',
      limit: 10,
    });
  });

  it('says nothing while a rule is unfinished, or with an order songs have', () => {
    expect(
      titleRulesOf({ ...draftOfTitleRules(null), rules: [blankRule('library', 'k')] }),
    ).toBeNull();
    expect(titleRulesOf({ ...draftOfTitleRules(null), order: 'mostPlayed' })).toBeNull();
  });
});
