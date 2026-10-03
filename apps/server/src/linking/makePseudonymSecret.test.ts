import { describe, expect, it } from 'vitest';
import { makePseudonymSecret } from './makePseudonymSecret';

describe('makePseudonymSecret', () => {
  it('makes a long secret, different every time', () => {
    const one = makePseudonymSecret();

    expect(one).toHaveLength(43);
    expect(makePseudonymSecret()).not.toBe(one);
  });
});
