import { describe, expect, it } from 'vitest';
import { translateReplacement } from './translateReplacement';

describe('translateReplacement', () => {
  it('turns the whole-match reference into the one JavaScript uses', () => {
    expect('abc'.replace(/b/, translateReplacement('[$0]'))).toBe('a[b]c');
  });

  it('leaves numbered groups alone', () => {
    expect(translateReplacement('$1$2 and $10')).toBe('$1$2 and $10');
  });
});
