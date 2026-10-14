import { describe, expect, it } from 'vitest';
import { libraryKindsFor } from './libraryKindsFor';

describe('libraryKindsFor', () => {
  it('files anime into an anime library first, then among the shows or films', () => {
    expect(libraryKindsFor('series', true)).toEqual(['anime', 'shows']);
    expect(libraryKindsFor('film', true)).toEqual(['anime', 'movies']);
  });

  it('files anything else into the one kind that holds it', () => {
    expect(libraryKindsFor('series', false)).toEqual(['shows']);
    expect(libraryKindsFor('film', false)).toEqual(['movies']);
    expect(libraryKindsFor('book', true)).toEqual(['books']);
  });
});
