import { describe, expect, it } from 'vitest';
import { holdTheSame } from './holdTheSame';

describe('holdTheSame', () => {
  it('ignores order and how the things are held', () => {
    expect(holdTheSame(['a', 'b'], new Set(['b', 'a']))).toBe(true);
  });

  it('tells apart collections that differ by one thing', () => {
    expect(holdTheSame(['a', 'b'], ['a'])).toBe(false);
    expect(holdTheSame(['a', 'b'], ['a', 'c'])).toBe(false);
  });

  it('counts a thing named twice once', () => {
    expect(holdTheSame(['a', 'a'], ['a'])).toBe(true);
  });
});
