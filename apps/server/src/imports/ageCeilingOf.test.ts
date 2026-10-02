import { describe, expect, it } from 'vitest';
import { ageCeilingOf } from './ageCeilingOf';

describe('ageCeilingOf', () => {
  it('is the oldest age among the ratings allowed', () => {
    expect(ageCeilingOf(['G', 'PG', 'PG-13'], ['US'])).toBe(13);
  });

  it('is nought where nothing could be read', () => {
    expect(ageCeilingOf(['Approved'], ['US'])).toBe(0);
    expect(ageCeilingOf([], ['US'])).toBe(0);
  });
});
