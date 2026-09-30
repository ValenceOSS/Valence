import { describe, expect, it } from 'vitest';
import { sayingList } from './sayingList';
import { sayVerbatim } from './sayVerbatim';

describe('sayingList', () => {
  it('says one reason as it is', () => {
    expect(sayingList([sayVerbatim('too big')])).toEqual(sayVerbatim('too big'));
  });

  it('runs several reasons together in order', () => {
    expect(
      sayingList([sayVerbatim('too big'), sayVerbatim('too old'), sayVerbatim('banned')]).message,
    ).toBe('too big; too old; banned');
  });
});
