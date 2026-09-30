import { describe, expect, it } from 'vitest';
import { readTruth } from './readTruth';

describe('readTruth', () => {
  it('reads every way a database writes yes', () => {
    expect([true, 1, '1', 't', 'true'].map(readTruth)).toEqual([true, true, true, true, true]);
  });

  it('and every way it writes no', () => {
    expect([false, 0, '0', 'f', 'false', null].map(readTruth)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});
