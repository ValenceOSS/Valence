import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { catalogueIdOfRequest } from './catalogueIdOfRequest';

describe('catalogueIdOfRequest', () => {
  it('opens a book by its Open Library number', () => {
    expect(
      catalogueIdOfRequest(aMediaRequest({ kind: 'book', tmdbId: null, openLibraryId: 42 })),
    ).toBe('42');
  });

  it('opens music by its MusicBrainz id, and a film by its TMDB id', () => {
    expect(
      catalogueIdOfRequest(aMediaRequest({ kind: 'album', tmdbId: null, musicBrainzId: 'mb' })),
    ).toBe('mb');
    expect(catalogueIdOfRequest(aMediaRequest({ tmdbId: 438631 }))).toBe('438631');
  });
});
