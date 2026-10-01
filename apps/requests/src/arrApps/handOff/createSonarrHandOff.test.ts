import { describe, expect, it } from 'vitest';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { ArrQueuePageSchema } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { createSonarrHandOff } from './createSonarrHandOff';

const HAND_OFF = {
  appId: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
  rootFolderPath: '/tv',
  qualityProfileId: 4,
  metadataProfileId: null,
  searchesOnAdd: true,
};

const SEVERANCE_REQUEST = aMediaRequest({
  kind: 'series',
  title: 'Severance',
  tmdbId: 95_396,
  tvdbId: 371_980,
  seasons: [2],
});

const LOOKED_UP = {
  title: 'Severance',
  tvdbId: 371_980,
  tmdbId: 95_396,
  seasons: [
    { seasonNumber: 0, monitored: false },
    { seasonNumber: 1, monitored: true },
    { seasonNumber: 2, monitored: true },
  ],
};

const SONARR = anArrApp({ kind: 'sonarr', name: 'Sonarr' });

/**
 * An episode as Sonarr lists it, aired long ago unless the test says otherwise.
 *
 * @param fields - What to change.
 * @returns The episode.
 */
const anEpisode = (fields: Record<string, number | boolean | string | null>) => ({
  seriesId: 3,
  seasonNumber: 2,
  episodeNumber: 1,
  title: 'Hello, Ms. Cobel',
  airDateUtc: '2025-01-17T08:00:00Z',
  hasFile: false,
  monitored: false,
  episodeFileId: 0,
  id: 51,
  ...fields,
});

describe('createSonarrHandOff', () => {
  it('adds a series Sonarr lacks, watching only the seasons asked for', async () => {
    const arr = aFakeArr({
      'GET /api/v3/series': { body: [] },
      'GET /api/v3/series/lookup': { body: [LOOKED_UP] },
      'POST /api/v3/series': { status: 201, body: { ...LOOKED_UP, id: 3 } },
    });

    expect(
      await createSonarrHandOff(createArrCaller(arr.fetch, SONARR)).place(
        SEVERANCE_REQUEST,
        [],
        HAND_OFF,
      ),
    ).toBe(3);
    expect(arr.asked[0]?.query.get('tvdbId')).toBe('371980');
    expect(arr.asked[1]?.query.get('term')).toBe('tvdb:371980');
    expect(arr.sent('POST', '/api/v3/series')).toEqual([
      {
        title: 'Severance',
        tvdbId: 371_980,
        qualityProfileId: 4,
        languageProfileId: 1,
        rootFolderPath: '/tv',
        monitored: true,
        seasonFolder: true,
        seriesType: 'standard',
        seasons: [
          { seasonNumber: 0, monitored: false },
          { seasonNumber: 1, monitored: false },
          { seasonNumber: 2, monitored: true },
        ],
        addOptions: {
          searchForMissingEpisodes: true,
          ignoreEpisodesWithFiles: true,
          ignoreEpisodesWithoutFiles: false,
        },
      },
    ]);
  });

  it('watches every season but the specials where every season was asked for', async () => {
    const arr = aFakeArr({
      'GET /api/v3/series': { body: [] },
      'GET /api/v3/series/lookup': { body: [LOOKED_UP] },
      'POST /api/v3/series': { status: 201, body: { ...LOOKED_UP, id: 3 } },
    });

    await createSonarrHandOff(createArrCaller(arr.fetch, SONARR)).place(
      { ...SEVERANCE_REQUEST, seasons: null },
      [],
      HAND_OFF,
    );

    expect(arr.sent('POST', '/api/v3/series')[0]).toMatchObject({
      seasons: [
        { seasonNumber: 0, monitored: false },
        { seasonNumber: 1, monitored: true },
        { seasonNumber: 2, monitored: true },
      ],
    });
  });

  it('finds the TVDB id by the TMDB one where the catalogue gave none', async () => {
    const arr = aFakeArr({
      'GET /api/v3/series/lookup': (asked) => ({
        body: asked.query.get('term') === 'tmdb:95396' ? [LOOKED_UP] : [],
      }),
      'GET /api/v3/series': { body: [{ ...LOOKED_UP, id: 3, monitored: true }] },
      'GET /api/v3/episode': { body: [] },
    });

    expect(
      await createSonarrHandOff(createArrCaller(arr.fetch, SONARR)).place(
        { ...SEVERANCE_REQUEST, tvdbId: null },
        [],
        HAND_OFF,
      ),
    ).toBe(3);
  });

  it('refuses a series Sonarr cannot find', async () => {
    const arr = aFakeArr({
      'GET /api/v3/series/lookup': { body: [] },
      'GET /api/v3/series': { body: [] },
    });
    const handOff = createSonarrHandOff(createArrCaller(arr.fetch, SONARR));

    await expect(
      handOff.place({ ...SEVERANCE_REQUEST, tvdbId: null }, [], HAND_OFF),
    ).rejects.toThrow('Sonarr cannot find it by its TVDB or TMDB id.');
    await expect(
      handOff.place({ ...SEVERANCE_REQUEST, tvdbId: null, tmdbId: null }, [], HAND_OFF),
    ).rejects.toThrow('Sonarr cannot find it by its TVDB or TMDB id.');
    await expect(handOff.place(SEVERANCE_REQUEST, [], HAND_OFF)).rejects.toThrow(
      'Sonarr cannot find it by its TVDB or TMDB id.',
    );
  });

  it('monitors the episodes asked for in a series Sonarr has, and searches for those aired', async () => {
    const arr = aFakeArr({
      'GET /api/v3/series': { body: [{ ...LOOKED_UP, id: 3, monitored: true }] },
      'GET /api/v3/episode': {
        body: [
          anEpisode({}),
          anEpisode({ episodeNumber: 2, id: 52, airDateUtc: '2099-01-01T00:00:00Z' }),
          anEpisode({ episodeNumber: 3, id: 53, airDateUtc: null }),
          anEpisode({ episodeNumber: 4, id: 54, monitored: true }),
          anEpisode({ seasonNumber: 1, id: 11 }),
        ],
      },
      'PUT /api/v3/episode/monitor': { status: 202, body: null },
      'POST /api/v3/command': { status: 201, body: { name: 'EpisodeSearch', id: 9 } },
    });
    const items = [1, 2, 3, 4].map((episode) =>
      aRequestItem({ id: `item-${episode.toString()}`, season: 2, episode }),
    );

    await createSonarrHandOff(
      createArrCaller(arr.fetch, SONARR),
      () => new Date('2026-10-01T00:00:00Z'),
    ).place(SEVERANCE_REQUEST, items, HAND_OFF);

    expect(arr.sent('PUT', '/api/v3/episode/monitor')).toEqual([
      { episodeIds: [51, 52, 53], monitored: true },
    ]);
    expect(arr.sent('POST', '/api/v3/command')).toEqual([
      { name: 'EpisodeSearch', episodeIds: [51] },
    ]);
  });

  it('does not search where the library says not to', async () => {
    const arr = aFakeArr({
      'GET /api/v3/series': { body: [{ ...LOOKED_UP, id: 3 }] },
      'GET /api/v3/episode': { body: [anEpisode({})] },
      'PUT /api/v3/episode/monitor': { status: 202, body: null },
    });

    await createSonarrHandOff(createArrCaller(arr.fetch, SONARR)).place(
      SEVERANCE_REQUEST,
      [aRequestItem({ season: 2, episode: 1 })],
      { ...HAND_OFF, searchesOnAdd: false },
    );

    expect(arr.sent('PUT', '/api/v3/episode/monitor')).toHaveLength(1);
    expect(arr.sent('POST', '/api/v3/command')).toEqual([]);
  });

  it('sees each episode imported, queued or still missing', async () => {
    const items = [
      aRequestItem({ id: 'imported', season: 2, episode: 1 }),
      aRequestItem({ id: 'queued', season: 2, episode: 2 }),
      aRequestItem({ id: 'missing', season: 2, episode: 3 }),
      aRequestItem({ id: 'unknown', season: 2, episode: 9 }),
    ];
    const arr = aFakeArr({
      'GET /api/v3/series/3': { body: { ...LOOKED_UP, id: 3, path: '/tv/Severance' } },
      'GET /api/v3/episode': {
        body: [
          anEpisode({ hasFile: true, monitored: true, episodeFileId: 77 }),
          anEpisode({ episodeNumber: 2, id: 52, monitored: true }),
          anEpisode({ episodeNumber: 3, id: 53, monitored: true }),
        ],
      },
      'GET /api/v3/episodefile': {
        body: [{ id: 77, path: '/tv/Severance/Season 02/Severance - S02E01.mkv' }],
      },
    });
    const queue = ArrQueuePageSchema.parse({
      records: [
        { id: 5, seriesId: 3, episodeId: 52, title: 'Severance.S02E02', status: 'downloading' },
      ],
    }).records;

    expect(
      await createSonarrHandOff(createArrCaller(arr.fetch, SONARR)).watch(
        SEVERANCE_REQUEST,
        items,
        HAND_OFF,
        3,
        queue,
      ),
    ).toEqual([
      {
        itemId: 'imported',
        kind: 'imported',
        path: '/tv/Severance/Season 02/Severance - S02E01.mkv',
        folder: '/tv/Severance',
      },
      { itemId: 'queued', kind: 'queued', record: queue[0] },
      { itemId: 'missing', kind: 'missing' },
      { itemId: 'unknown', kind: 'missing' },
    ]);
  });

  it('takes the series folder from the file where Sonarr gives none', async () => {
    const arr = aFakeArr({
      'GET /api/v3/series/3': { body: { ...LOOKED_UP, id: 3 } },
      'GET /api/v3/episode': {
        body: [anEpisode({ hasFile: true, monitored: true, episodeFileId: 77 })],
      },
      'GET /api/v3/episodefile': {
        body: [{ id: 77, path: '/tv/Severance/Season 02/Severance - S02E01.mkv' }],
      },
    });

    expect(
      await createSonarrHandOff(createArrCaller(arr.fetch, SONARR)).watch(
        SEVERANCE_REQUEST,
        [aRequestItem({ season: 2, episode: 1 })],
        HAND_OFF,
        3,
        [],
      ),
    ).toMatchObject([{ folder: '/tv/Severance' }]);
  });
});
