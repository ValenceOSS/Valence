import { describe, expect, it } from 'vitest';
import { readDiscoverFound } from './readDiscoverFound';

describe('readDiscoverFound', () => {
  it('reads the kind and the words, colons and all', () => {
    expect(readDiscoverFound('found:film:dune')).toEqual({ kind: 'film', query: 'dune' });
    expect(readDiscoverFound('found:series:Re:ZERO')).toEqual({
      kind: 'series',
      query: 'Re:ZERO',
    });
  });

  it('reads nothing from anything else', () => {
    expect(readDiscoverFound('find:dune')).toBeNull();
    expect(readDiscoverFound('found:book:dune')).toBeNull();
    expect(readDiscoverFound('found:film:')).toBeNull();
    expect(readDiscoverFound('found:film')).toBeNull();
    expect(readDiscoverFound(null)).toBeNull();
  });
});
