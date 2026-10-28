import { describe, expect, it } from 'vitest';
import { viewOfDiscoverFound } from './viewOfDiscoverFound';

describe('viewOfDiscoverFound', () => {
  it('names what a search found by its kind and its words', () => {
    expect(viewOfDiscoverFound({ kind: 'series', query: ' dune ' })).toBe('found:series:dune');
  });
});
