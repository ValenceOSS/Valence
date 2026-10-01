import { describe, expect, it } from 'vitest';
import type { MediaRequest, RequestItem } from '@ValenceContracts/schemas/MediaRequest';
import { matchArrivals } from './matchArrivals';

/**
 * A film, episode or album a request waits for, wanted unless the test says otherwise.
 *
 * @param overrides - What to change.
 * @returns The item, as the requests service shows it.
 */
const anItem = (overrides: Partial<RequestItem>): RequestItem => ({
  id: crypto.randomUUID(),
  musicBrainzId: null,
  season: null,
  episode: null,
  title: 'Dune',
  airDate: null,
  state: 'wanted',
  problem: null,
  problemCode: null,
  releaseTitle: null,
  downloadId: null,
  filePath: null,
  score: null,
  lastSearchedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

/**
 * An approved request for Dune waiting on the film, with anything the test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The request, as the requests service shows it.
 */
const aRequest = (overrides: Partial<MediaRequest> = {}): MediaRequest => ({
  id: crypto.randomUUID(),
  kind: 'film',
  tmdbId: 438_631,
  musicBrainzId: null,
  openLibraryId: null,
  title: 'Dune',
  artistName: null,
  year: 2021,
  overview: null,
  posterUrl: null,
  libraryId: 'films',
  profileId: null,
  profileName: null,
  isPickedByHand: false,
  state: 'wanted',
  problem: null,
  problemCode: null,
  approval: 'approved',
  refusedBecause: null,
  requestedBy: { id: 'someone', name: 'Sam' },
  seasons: null,
  releaseTypes: null,
  releaseDate: null,
  items: [anItem({})],
  mediaId: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

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
    const film = aRequest();

    expect(await matchArrivals({ requests: [film], lookup: LOOKUP, heldEpisodes })).toEqual([
      { request: film, arrivals: { mediaId: 'dune', episodes: null, albums: null } },
    ]);
  });

  it('names only the episodes held that the request still waits for', async () => {
    const series = aRequest({
      kind: 'series',
      tmdbId: 95_396,
      items: [
        anItem({ season: 1, episode: 1, state: 'available' }),
        anItem({ season: 1, episode: 2, state: 'downloading' }),
        anItem({ season: 1, episode: 3 }),
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
    const artist = aRequest({
      kind: 'artist',
      tmdbId: null,
      musicBrainzId: 'a74b1b7f-71a5-4011-9441-d0b5e4122711',
      items: [anItem({ musicBrainzId: ALBUM }), anItem({ musicBrainzId: OTHER_ALBUM })],
    });

    expect(await matchArrivals({ requests: [artist], lookup: LOOKUP, heldEpisodes })).toEqual([
      { request: artist, arrivals: { mediaId: 'ok-computer', episodes: null, albums: [ALBUM] } },
    ]);
  });

  it('passes over what is not there, already there, unapproved, a book or has no id', async () => {
    const requests = [
      aRequest({ tmdbId: 1 }),
      aRequest({ items: [anItem({ state: 'available' })] }),
      aRequest({ approval: 'awaiting' }),
      aRequest({ kind: 'book', tmdbId: null, openLibraryId: 1 }),
      aRequest({ tmdbId: null }),
      aRequest({ kind: 'series', tmdbId: 2, items: [anItem({ season: 1, episode: 1 })] }),
      aRequest({ kind: 'series', tmdbId: 95_396, items: [anItem({ season: 2, episode: 1 })] }),
      aRequest({
        kind: 'album',
        tmdbId: null,
        musicBrainzId: OTHER_ALBUM,
        items: [anItem({ musicBrainzId: OTHER_ALBUM }), anItem({ musicBrainzId: null })],
      }),
    ];

    expect(await matchArrivals({ requests, lookup: LOOKUP, heldEpisodes })).toEqual([]);
  });
});
