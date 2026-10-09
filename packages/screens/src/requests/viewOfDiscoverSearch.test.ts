import { describe, expect, it } from 'vitest';
import { viewOfDiscoverSearch } from './viewOfDiscoverSearch';

describe('viewOfDiscoverSearch', () => {
  it('names a search of Discover by its words', () => {
    expect(viewOfDiscoverSearch(' dune ')).toBe('find:dune');
  });
});
