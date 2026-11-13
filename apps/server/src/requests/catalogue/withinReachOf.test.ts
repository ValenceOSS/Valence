import { describe, expect, it } from 'vitest';
import { standTitles } from './standTitles';
import { withinReachOf } from './withinReachOf';
import type { CatalogueLookup } from './CatalogueLookup';

const KEPT_FROM_THEM = 'film-they-are-refused';

const aLookup = (): CatalogueLookup => ({
  films: () =>
    Promise.resolve(
      new Map([
        ['603', KEPT_FROM_THEM],
        ['604', 'film-they-may-see'],
      ]),
    ),
  series: () => Promise.resolve(new Map([['1399', 'series-they-are-refused']])),
  episodesHeld: () => Promise.resolve(new Map()),
  seriesFiles: () => Promise.resolve([]),
  heldTitles: () => Promise.resolve([]),
  titleFiles: () => Promise.resolve({ folder: null, files: [] }),
  elsewhere: () =>
    Promise.resolve(new Map([['605', { mediaId: KEPT_FROM_THEM, fromServer: 'Cabin' }]])),
  filmIn: () => Promise.resolve(null),
  artists: () => Promise.resolve(new Map()),
  albums: () => Promise.resolve(new Map()),
  albumQualities: () => Promise.resolve(new Map()),
  seriesNarrators: () => Promise.resolve([]),
  artistsNamed: () => Promise.resolve(new Map()),
  albumsNamed: () => Promise.resolve(new Map()),
  booksNamed: () => Promise.resolve(new Map()),
  booksAt: () => Promise.resolve(new Map()),
});

const REACH = {
  isItemOutOfReach: (mediaId: string) => Promise.resolve(mediaId === KEPT_FROM_THEM),
  isSeriesOutOfReach: (seriesId: string) => Promise.resolve(seriesId === 'series-they-are-refused'),
};

describe('withinReachOf', () => {
  it('leaves out a film, a series and a linked title that are refused, and nothing else', async () => {
    const lookup = withinReachOf(aLookup(), REACH);

    expect([...(await lookup.films(['603', '604']))]).toEqual([['604', 'film-they-may-see']]);
    expect([...(await lookup.series(['1399']))]).toEqual([]);
    expect([...(await lookup.elsewhere(['605']))]).toEqual([]);
  });

  it('stands a refused film as one that is not held, with no id and nobody who asked', async () => {
    const stood = await standTitles(
      [
        {
          kind: 'film',
          id: '603',
          title: 'Dune',
          subtitle: null,
          year: null,
          overview: null,
          posterUrl: null,
        },
      ],
      withinReachOf(aLookup(), REACH),
      [],
    );

    expect(stood[0]?.standing).toMatchObject({ status: 'askable', mediaId: null });
  });
});
