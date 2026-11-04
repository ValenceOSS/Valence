import { describe, expect, it } from 'vitest';
import { valueOfTyped } from './valueOfTyped';

describe('valueOfTyped', () => {
  it('reads a score as a number, and nothing typed as no score', () => {
    expect(valueOfTyped('rating', ' 7.5 ')).toBe(7.5);
    expect(valueOfTyped('rating', '')).toBeNull();
  });

  it('reads an emptied field as nothing, but keeps an emptied title as typed', () => {
    expect(valueOfTyped('tagline', '  ')).toBeNull();
    expect(valueOfTyped('title', '')).toBe('');
  });
});
