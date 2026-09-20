import { describe, expect, it } from 'vitest';
import { readRequestCatalogue } from './readRequestCatalogue';

/**
 * A poster's address, as the catalogue would serve it.
 */
const posterUrlOf = (path: string | null | undefined) =>
  path === null || path === undefined ? null : `https://image.tmdb.org/t/p/w342${path}`;

describe('readRequestCatalogue', () => {
  it('takes the first day a film was out in each way, anywhere', () => {
    expect(
      readRequestCatalogue(
        {
          title: 'Dune',
          release_date: '2021-09-15',
          overview: 'Spice.',
          poster_path: '/dune.jpg',
          release_dates: {
            results: [
              {
                release_dates: [
                  { type: 3, release_date: '2021-10-22T00:00:00.000Z' },
                  { type: 5, release_date: '2022-01-11T00:00:00.000Z' },
                ],
              },
              {
                release_dates: [
                  { type: 2, release_date: '2021-09-15T00:00:00.000Z' },
                  { type: 4, release_date: '2021-12-03T00:00:00.000Z' },
                  { type: 1, release_date: '2021-09-03T00:00:00.000Z' },
                ],
              },
            ],
          },
        },
        [],
        posterUrlOf,
      ),
    ).toEqual({
      title: 'Dune',
      year: 2021,
      aliases: [],
      overview: 'Spice.',
      posterUrl: 'https://image.tmdb.org/t/p/w342/dune.jpg',
      runtimeMinutes: null,
      releaseDates: { theatrical: '2021-09-15', digital: '2021-12-03', physical: '2022-01-11' },
      episodes: [],
      isEnded: false,
      artist: null,
      albums: [],
    });
  });

  it('keeps the other titles written in the Latin alphabet, once each', () => {
    expect(
      readRequestCatalogue(
        {
          name: 'Frieren: Beyond Journey’s End',
          original_name: '葬送のフリーレン',
          alternative_titles: {
            results: [{ title: 'Sousou no Frieren' }, { title: 'Sousou no Frieren' }],
          },
          episode_run_time: [24],
          status: 'Ended',
        },
        [],
        posterUrlOf,
      ),
    ).toMatchObject({
      aliases: ['Sousou no Frieren'],
      runtimeMinutes: 24,
      isEnded: true,
      year: null,
    });
  });

  it('reads every episode of every season, and the day each aired', () => {
    expect(
      readRequestCatalogue(
        { name: 'Severance', first_air_date: '2022-02-18' },
        [
          {
            season_number: 1,
            episodes: [
              { episode_number: 1, name: 'Good News About Hell', air_date: '2022-02-18' },
              { episode_number: 2, air_date: '' },
            ],
          },
          null,
        ],
        posterUrlOf,
      )?.episodes,
    ).toEqual([
      { season: 1, episode: 1, title: 'Good News About Hell', airDate: '2022-02-18' },
      { season: 1, episode: 2, title: '', airDate: null },
    ]);
  });

  it('has nothing to say about a record that is not one', () => {
    expect(readRequestCatalogue(null, [], posterUrlOf)).toBeNull();
    expect(readRequestCatalogue({ title: '' }, [], posterUrlOf)).toBeNull();
  });
});
