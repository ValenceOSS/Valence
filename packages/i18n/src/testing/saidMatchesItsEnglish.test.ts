import { describe, expect, it } from 'vitest';
import { saidMatchesItsEnglish } from './saidMatchesItsEnglish';
import { saying } from '@ValenceI18n/saying';

describe('saidMatchesItsEnglish', () => {
  it('matches something said with the English it says', () => {
    expect(saidMatchesItsEnglish(saying('common.noReasonGiven'), 'no reason given')).toBe(true);
    expect(saidMatchesItsEnglish(saying('common.noReasonGiven'), 'something else')).toBe(false);
  });

  it('leaves anything else to the ordinary comparison', () => {
    expect(saidMatchesItsEnglish('no reason given', 'no reason given')).toBeUndefined();
    expect(saidMatchesItsEnglish(saying('common.noReasonGiven'), 3)).toBeUndefined();
  });
});
