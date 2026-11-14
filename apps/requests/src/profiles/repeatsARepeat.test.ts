import { describe, expect, it } from 'vitest';
import { hasWord } from './hasWord';
import { repeatsARepeat } from './repeatsARepeat';

describe('repeatsARepeat', () => {
  it('finds a repeated group that repeats, however deep', () => {
    for (const pattern of ['^(a+)+$', '((a+))+', '((?:a+))+', '(a*)*', '(a{2,})+', '(a{1,5})+']) {
      expect(repeatsARepeat(pattern), pattern).toBe(true);
    }
  });

  it('finds a repeated group that chooses', () => {
    for (const pattern of ['(a|aa)+$', '((a|b)c)*', '(x(a|aa))+']) {
      expect(repeatsARepeat(pattern), pattern).toBe(true);
    }
  });

  it('allows ordinary patterns, and a class or an escape that only looks like a repeat', () => {
    for (const pattern of [
      'hdr10\\+?',
      '([+-]?\\d)+',
      '(\\+)+',
      '([*+])+',
      '(a{2})+',
      '(?:dts|ac3)',
      '(a+)',
      '(a)?b+',
      '\\bx265\\b',
    ]) {
      expect(repeatsARepeat(pattern), pattern).toBe(false);
    }
  });

  it('lets hasWord refuse the bypasses at once and still run the safe ones', () => {
    const started = Date.now();

    expect(hasWord(`${'a'.repeat(5_000)}!`, '/(a|aa)+$/')).toBe(false);
    expect(hasWord(`${'a'.repeat(60)}!`, '/((a+))+$/')).toBe(false);
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(hasWord('Movie 2023 -5 x', '/([+-]?\\d)+ x/')).toBe(true);
  });
});
