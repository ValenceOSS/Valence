import { describe, expect, it } from 'vitest';
import { aShownRequest } from '@ValenceServer/testing/aShownRequest';
import { aShownRequestItem } from '@ValenceServer/testing/aShownRequestItem';
import { matchArrivals } from './matchArrivals';

const ALBUM = 'b1392450-e666-3926-a536-22c65f834433';

const OTHER_ALBUM = 'c1392450-e666-3926-a536-22c65f834434';

const LOOKUP = {
  films: (ids: readonly string[]) =>
    Promise.resolve(new Map(ids.filter((id) => id === '438631').map((id) => [id, 'dune']))),
  series: (ids: readonly string[]) =>
    Promise.resolve(new Map(ids.filter((id) => id === '95396').map((id) => [id, 'severance']))),
  albums: (ids: readonly string[]) =>
    Promise.resolve(new Map(ids.filter((id) => id === ALBUM).map((id) => [id, 'ok-computer']))),
};

/**
 * The episodes a library holds of Severance, and nothing of anything else.
 *
 * @param tmdbId - The series.
 * @returns The episodes.
 */
const heldEpisodes = (tmdbId: string) =>
  Promise.resolve(
    tmdbId === '95396'
      ? [
          { season: 1, episode: 1 },
          { season: 1, episode: 2 },
        ]
      : [],
  );

describe('matchArrivals', () => {
  it('finds a film by its catalogue id', async () => {
    const film = aShownRequest();

    expect(await matchArrivals({ requests: [film], lookup: LOOKUP, heldEpisodes })).toEqual([
      { request: film, arrivals: { mediaId: 'dune', episodes: null, albums: null } },
    ]);
  });

  it('names only the episodes held that the request still waits for', async () => {
    const series = aShownRequest({
      kind: 'series',
      tmdbId: 95_396,
      items: [
        aShownRequestItem({ season: 1, episode: 1, state: 'available' }),
        aShownRequestItem({ season: 1, episode: 2, state: 'downloading' }),
        aShownRequestItem({ season: 1, episode: 3 }),
      ],
    });

    expect(await matchArrivals({ requests: [series], lookup: LOOKUP, heldEpisodes })).toEqual([
      {
        request: series,
        arrivals: { mediaId: 'severance', episodes: [{ season: 1, episode: 2 }], albums: null },
      },
    ]);
  });

  it('finds albums by their release groups', async () => {
    const artist = aShownRequest({
      kind: 'artist',
      tmdbId: null,
      musicBrainzId: 'a74b1b7f-71a5-4011-9441-d0b5e4122711',
      items: [
        aShownRequestItem({ musicBrainzId: ALBUM }),
        aShownRequestItem({ musicBrainzId: OTHER_ALBUM }),
      ],
    });

    expect(await matchArrivals({ requests: [artist], lookup: LOOKUP, heldEpisodes })).toEqual([
      { request: artist, arrivals: { mediaId: 'ok-computer', episodes: null, albums: [ALBUM] } },
    ]);
  });

  it('passes over what is not there, already there, unapproved, a book or has no id', async () => {
    const requests = [
      aShownRequest({ tmdbId: 1 }),
      aShownRequest({ items: [aShownRequestItem({ state: 'available' })] }),
      aShownRequest({ approval: 'awaiting' }),
      aShownRequest({ kind: 'book', tmdbId: null, openLibraryId: 1 }),
      aShownRequest({ tmdbId: null }),
      aShownRequest({
        kind: 'series',
        tmdbId: 2,
        items: [aShownRequestItem({ season: 1, episode: 1 })],
      }),
      aShownRequest({
        kind: 'series',
        tmdbId: 95_396,
        items: [aShownRequestItem({ season: 2, episode: 1 })],
      }),
      aShownRequest({
        kind: 'album',
        tmdbId: null,
        musicBrainzId: OTHER_ALBUM,
        items: [
          aShownRequestItem({ musicBrainzId: OTHER_ALBUM }),
          aShownRequestItem({ musicBrainzId: null }),
        ],
      }),
    ];

    expect(await matchArrivals({ requests, lookup: LOOKUP, heldEpisodes })).toEqual([]);
  });
});
