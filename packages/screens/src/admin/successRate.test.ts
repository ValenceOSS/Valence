import { describe, expect, it } from 'vitest';
import { successRate, toneOfSuccessRate } from './successRate';

describe('successRate', () => {
  it('is the share of finished runs that ended well', () => {
    expect(successRate(9, 1)).toBe(0.9);
    expect(successRate(4, 0)).toBe(1);
    expect(successRate(0, 3)).toBe(0);
  });

  it('is nothing where no run has ended', () => {
    expect(successRate(0, 0)).toBeNull();
  });
});

describe('toneOfSuccessRate', () => {
  it.each([
    [null, 'quiet'],
    [1, 'success'],
    [0.99, 'success'],
    [0.98, 'warning'],
    [0.9, 'warning'],
    [0.89, 'danger'],
    [0, 'danger'],
  ] as const)('judges %s as %s', (rate, tone) => {
    expect(toneOfSuccessRate(rate)).toBe(tone);
  });
});
