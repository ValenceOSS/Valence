import { describe, expect, it } from 'vitest';
import { freshnessOf } from './freshnessOf';

const HELD = { data: [1], isRefetchError: false };

const NOT_YET = { data: undefined, isRefetchError: false };

describe('freshnessOf', () => {
  it('says what is shown is being checked while the panel waits on the server again', () => {
    expect(freshnessOf([HELD, NOT_YET], true)).toEqual({ isChecking: true, couldNotCheck: false });
  });

  it('says nothing is being checked once the panel has its answers', () => {
    expect(freshnessOf([HELD], false).isChecking).toBe(false);
  });

  it('says nothing is being checked where there is nothing shown yet to check', () => {
    expect(freshnessOf([NOT_YET], true).isChecking).toBe(false);
  });

  it('says the check failed where the server did not answer one asked again', () => {
    expect(freshnessOf([HELD, { ...HELD, isRefetchError: true }], false).couldNotCheck).toBe(true);
  });
});
