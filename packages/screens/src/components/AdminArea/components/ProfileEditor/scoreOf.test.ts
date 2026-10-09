import { describe, expect, it } from 'vitest';
import { scoreOf } from './scoreOf';

describe('scoreOf', () => {
  it('reads a whole number either side of nought', () => {
    expect(scoreOf(' 500 ')).toBe(500);
    expect(scoreOf('-10000')).toBe(-10_000);
  });

  it('reads nothing as none, and anything else as no score', () => {
    expect(scoreOf('  ')).toBeNull();
    expect(scoreOf('1.5')).toBeUndefined();
    expect(scoreOf('lots')).toBeUndefined();
  });
});
