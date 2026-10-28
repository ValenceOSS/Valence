import { describe, expect, it } from 'vitest';
import { describeCatalogueSearch } from '@ValenceClient/requests/describeCatalogueSearch';

describe('describeCatalogueSearch', () => {
  it('names the page by the kind and the words', () => {
    expect(describeCatalogueSearch({ kind: 'film', query: 'toy' })).toBe('Films for “toy”');
    expect(describeCatalogueSearch({ kind: 'series', query: 'toy' })).toBe('Shows for “toy”');
  });
});
