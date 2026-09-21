import { describe, expect, it } from 'vitest';
import { describeElapsed } from './describeElapsed';

describe('describeElapsed', () => {
  it.each([
    [0, '0 ms'],
    [850, '850 ms'],
    [1000, '1 s'],
    [1400, '1.4 s'],
    [9949, '9.9 s'],
    [12_400, '12 s'],
    [59_400, '59 s'],
    [60_000, '1 min'],
    [125_000, '2 min 5 s'],
    [3_600_000, '1 h'],
    [3_780_000, '1 h 3 min'],
  ])('says %d milliseconds as %s', (ms, said) => {
    expect(describeElapsed(ms)).toBe(said);
  });
});
