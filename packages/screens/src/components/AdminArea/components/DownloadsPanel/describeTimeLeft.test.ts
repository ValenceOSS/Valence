import { describe, expect, it } from 'vitest';
import { describeTimeLeft } from './describeTimeLeft';

describe('describeTimeLeft', () => {
  it.each([
    [30, 'Under a minute'],
    [60, '1 min'],
    [12 * 60 + 20, '12 min'],
    [3 * 3600 + 4 * 60, '3 h 4 min'],
    [2 * 3600, '2 h'],
    [2 * 3600 + 3590, '3 h'],
    [86_400, '1 day'],
    [3 * 86_400, '3 days'],
  ])('says %i seconds as %s', (seconds, said) => {
    expect(describeTimeLeft(seconds)).toBe(said);
  });
});
