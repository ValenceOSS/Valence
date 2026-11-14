import { describe, expect, it } from 'vitest';
import { createJellyfinIdBook } from './createJellyfinIdBook';
import { libraryOfJellyfinView } from './libraryOfJellyfinView';
import { aFakeStore } from './testing/aFakeStore';
import { aJellyfinFilm } from './testing/aJellyfinFilm';

describe('libraryOfJellyfinView', () => {
  it('makes a films view a films library and any other a programmes library', () => {
    const book = createJellyfinIdBook(aFakeStore());

    expect(
      libraryOfJellyfinView(aJellyfinFilm({ Name: 'Films', CollectionType: 'movies' }), book).kind,
    ).toBe('movies');
    expect(
      libraryOfJellyfinView(aJellyfinFilm({ Name: 'Shows', CollectionType: 'tvshows' }), book).kind,
    ).toBe('shows');
  });
});
