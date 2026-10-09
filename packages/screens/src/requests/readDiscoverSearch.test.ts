import { describe, expect, it } from 'vitest';
import { readDiscoverSearch } from './readDiscoverSearch';

describe('readDiscoverSearch', () => {
  it('reads the words Discover is searching for, colons and all', () => {
    expect(readDiscoverSearch('find:dune')).toBe('dune');
    expect(readDiscoverSearch('find:Re:ZERO')).toBe('Re:ZERO');
  });

  it('reads nothing from anything else', () => {
    expect(readDiscoverSearch('film:popular')).toBeNull();
    expect(readDiscoverSearch('find:')).toBeNull();
    expect(readDiscoverSearch(null)).toBeNull();
  });
});
