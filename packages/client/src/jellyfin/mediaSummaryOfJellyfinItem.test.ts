import { describe, expect, it } from 'vitest';
import { createJellyfinIdBook } from './createJellyfinIdBook';
import { mediaSummaryOfJellyfinItem } from './mediaSummaryOfJellyfinItem';
import { aFakeStore } from './testing/aFakeStore';
import { aJellyfinEpisode } from './testing/aJellyfinEpisode';
import { aJellyfinFilm } from './testing/aJellyfinFilm';

const LIBRARY = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

describe('mediaSummaryOfJellyfinItem', () => {
  it('summarises a film as Valence does', () => {
    const book = createJellyfinIdBook(aFakeStore());
    const summary = mediaSummaryOfJellyfinItem(aJellyfinFilm(), LIBRARY, {
      address: 'http://j.test',
      book,
    });

    expect(summary).toMatchObject({
      title: 'Sneakers',
      year: 1992,
      durationSeconds: 60,
      libraryId: LIBRARY,
      seriesId: null,
      externalId: '2322',
      hasPoster: true,
    });
    expect(book.jellyfinIdOf(summary.id)).toBe('87d216619130f7261a2f6c054af5ff81');
  });

  it('places an episode in its programme and season', () => {
    const book = createJellyfinIdBook(aFakeStore());

    expect(
      mediaSummaryOfJellyfinItem(aJellyfinEpisode(), LIBRARY, { address: 'http://j.test', book }),
    ).toMatchObject({
      seriesTitle: 'Twin Peaks',
      seriesId: book.valenceIdOf('8fda75b958575a5b48cb9ffb2a2fbff6'),
      seasonNumber: 1,
      episodeNumber: 1,
      width: 320,
    });
  });

  it('fills in what Valence needs and Jellyfin did not say', () => {
    const summary = mediaSummaryOfJellyfinItem(
      aJellyfinFilm({
        RunTimeTicks: null,
        Width: null,
        Height: null,
        DateCreated: null,
        ProductionYear: 12,
      }),
      LIBRARY,
      { address: 'http://j.test', book: createJellyfinIdBook(aFakeStore()) },
    );

    expect(summary).toMatchObject({ durationSeconds: 1, width: 1920, height: 1080, year: null });
  });
});
