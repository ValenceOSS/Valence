import { describe, expect, it } from 'vitest';
import { sayContains } from './sayContains';

describe('sayContains', () => {
  it('says in one line what a title contains', () => {
    expect(sayContains(['violence', 'language'])).toBe('Contains violence and strong language');
  });

  it('says nothing for a title that contains nothing worth saying', () => {
    expect(sayContains([])).toBeNull();
    expect(sayContains(null)).toBeNull();
  });
});
