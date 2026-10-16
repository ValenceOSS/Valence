import { describe, expect, it, vi } from 'vitest';
import { createAnimeDescriber } from './createAnimeDescriber';
import type { QueryWeb } from '@ValenceServer/music/web/createMusicWeb';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';

const catalogue: RequestCatalogue = {
  title: 'Show',
  year: 2020,
  aliases: ['Shou'],
  overview: null,
  posterUrl: null,
  runtimeMinutes: 24,
  releaseDates: { theatrical: null, digital: null, physical: null },
  episodes: [{ season: 1, episode: 1, title: 'One', airDate: '2020-01-05' }],
  isEnded: true,
  artist: null,
  albums: [],
};

const media = (id: number, format: string, title: string, year: number) => ({
  id,
  idMal: null,
  format,
  episodes: 1,
  status: 'FINISHED',
  type: 'ANIME',
  title: { romaji: null, english: title, native: null },
  synonyms: [],
  startDate: { year, month: 1, day: 5 },
});

describe('createAnimeDescriber', () => {
  it("works out a show's cours and finds its films in the catalogue", async () => {
    const post = vi.fn<QueryWeb['post']>(() =>
      Promise.resolve({
        data: {
          Page: {
            media: [media(1, 'TV', 'Show', 2020), media(2, 'MOVIE', 'Show the Film', 2022)],
          },
        },
      }),
    );
    const describe = createAnimeDescriber({
      web: { post },
      readEpisodeGroups: () => Promise.resolve([]),
      searchFilms: () =>
        Promise.resolve([
          {
            externalId: '55',
            kind: 'movie',
            title: 'Show: The Film',
            year: 2022,
            overview: null,
            posterUrl: null,
          },
        ]),
    });

    const facts = await describe(7, catalogue);

    expect(facts).toMatchObject({ anilistId: 1, cours: [{ cour: 1, name: 'Show' }] });
    expect(facts.films).toEqual([{ anilistId: 2, title: 'Show the Film', year: 2022, tmdbId: 55 }]);

    await describe(7, catalogue);

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('asks by another name where the title finds nothing', async () => {
    const post = vi.fn<QueryWeb['post']>(() => Promise.resolve({ data: { Page: { media: [] } } }));
    const describe = createAnimeDescriber({
      web: { post },
      readEpisodeGroups: () => Promise.resolve([]),
      searchFilms: () => Promise.resolve([]),
    });

    expect((await describe(8, catalogue)).anilistId).toBeNull();
    expect(post.mock.calls.map((call) => call[1])).toMatchObject([
      { variables: { search: 'Show' } },
      { variables: { search: 'Shou' } },
    ]);
  });
});
