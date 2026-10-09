import { describe, expect, it } from 'vitest';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { ArrQueuePageSchema } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { createRadarrHandOff } from './createRadarrHandOff';

const HAND_OFF = {
  appId: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
  rootFolderPath: '/movies',
  qualityProfileId: 4,
  metadataProfileId: null,
  searchesOnAdd: true,
};

const DUNE = {
  title: 'Dune',
  year: 2021,
  path: '/movies/Dune (2021)',
  hasFile: false,
  monitored: true,
  tmdbId: 438_631,
  id: 12,
};

describe('createRadarrHandOff', () => {
  it('adds a film Radarr lacks, monitored and searched for', async () => {
    const arr = aFakeArr({
      'GET /api/v3/movie': { body: [] },
      'POST /api/v3/movie': { status: 201, body: DUNE },
    });

    expect(
      await createRadarrHandOff(createArrCaller(arr.fetch, anArrApp())).place(
        aMediaRequest(),
        [aRequestItem()],
        HAND_OFF,
      ),
    ).toBe(12);
    expect(arr.asked[0]?.query.get('tmdbId')).toBe('438631');
    expect(arr.sent('POST', '/api/v3/movie')).toEqual([
      {
        title: 'Dune',
        year: 2021,
        tmdbId: 438_631,
        qualityProfileId: 4,
        rootFolderPath: '/movies',
        monitored: true,
        minimumAvailability: 'released',
        addOptions: { searchForMovie: true },
      },
    ]);
  });

  it('monitors and searches for a film Radarr has but is not watching', async () => {
    const arr = aFakeArr({
      'GET /api/v3/movie': { body: [{ ...DUNE, monitored: false }] },
      'PUT /api/v3/movie/editor': { status: 202, body: null },
      'POST /api/v3/command': { status: 201, body: { name: 'MoviesSearch', id: 1 } },
    });

    expect(
      await createRadarrHandOff(createArrCaller(arr.fetch, anArrApp())).place(
        aMediaRequest({ year: null }),
        [],
        HAND_OFF,
      ),
    ).toBe(12);
    expect(arr.sent('PUT', '/api/v3/movie/editor')).toEqual([{ movieIds: [12], monitored: true }]);
    expect(arr.sent('POST', '/api/v3/command')).toEqual([{ name: 'MoviesSearch', movieIds: [12] }]);
  });

  it('leaves alone a film Radarr already has and watches', async () => {
    const arr = aFakeArr({ 'GET /api/v3/movie': { body: [{ ...DUNE, hasFile: true }] } });

    await createRadarrHandOff(createArrCaller(arr.fetch, anArrApp())).place(
      aMediaRequest(),
      [],
      HAND_OFF,
    );

    expect(arr.asked).toHaveLength(1);
  });

  it('refuses a film with no catalogue id', async () => {
    const arr = aFakeArr({});

    await expect(
      createRadarrHandOff(createArrCaller(arr.fetch, anArrApp())).place(
        aMediaRequest({ tmdbId: null }),
        [],
        HAND_OFF,
      ),
    ).rejects.toThrow('It has no TMDB ID to send to Radarr.');
  });

  it('sees a film imported, queued or still missing', async () => {
    const item = aRequestItem();
    const queue = ArrQueuePageSchema.parse({
      records: [{ id: 5, movieId: 12, title: 'Dune.2021.1080p', status: 'downloading' }],
    }).records;
    const imported = aFakeArr({
      'GET /api/v3/movie/12': {
        body: {
          ...DUNE,
          hasFile: true,
          movieFile: { path: '/movies/Dune (2021)/Dune (2021).mkv', id: 3 },
        },
      },
    });
    const missing = aFakeArr({ 'GET /api/v3/movie/12': { body: { ...DUNE, path: null } } });

    expect(
      await createRadarrHandOff(createArrCaller(imported.fetch, anArrApp())).watch(
        aMediaRequest(),
        [item],
        HAND_OFF,
        12,
        queue,
      ),
    ).toEqual([
      {
        itemId: item.id,
        kind: 'imported',
        path: '/movies/Dune (2021)/Dune (2021).mkv',
        folder: '/movies/Dune (2021)',
      },
    ]);
    expect(
      await createRadarrHandOff(createArrCaller(missing.fetch, anArrApp())).watch(
        aMediaRequest(),
        [item],
        HAND_OFF,
        12,
        queue,
      ),
    ).toEqual([{ itemId: item.id, kind: 'queued', record: queue[0] }]);
    expect(
      await createRadarrHandOff(createArrCaller(missing.fetch, anArrApp())).watch(
        aMediaRequest(),
        [item],
        HAND_OFF,
        12,
        [],
      ),
    ).toEqual([{ itemId: item.id, kind: 'missing' }]);
  });

  it('asks Radarr to search for the film again, and says where its page is', async () => {
    const arr = aFakeArr({
      'POST /api/v3/command': { status: 201, body: { name: 'MoviesSearch', id: 1 } },
    });
    const handOff = createRadarrHandOff(createArrCaller(arr.fetch, anArrApp()));

    await handOff.search(aMediaRequest(), 12);

    expect(arr.sent('POST', '/api/v3/command')).toEqual([{ name: 'MoviesSearch', movieIds: [12] }]);
    expect(await handOff.pageOf(aMediaRequest(), 12)).toBe('/movie/438631');
  });

  it('lists the releases Radarr finds for the film', async () => {
    const arr = aFakeArr({
      'GET /api/v3/release': (asked) => ({
        body: [{ guid: `for-${asked.query.get('movieId') ?? ''}`, indexerId: 2 }],
      }),
    });

    expect(
      await createRadarrHandOff(createArrCaller(arr.fetch, anArrApp())).releases(
        aMediaRequest(),
        [aRequestItem()],
        12,
      ),
    ).toMatchObject([{ guid: 'for-12', indexerId: 2 }]);
  });

  it('finds the film’s downloads in Radarr’s queue, and monitors it or stops', async () => {
    const queue = ArrQueuePageSchema.parse({
      records: [
        { id: 5, movieId: 12, title: 'A.Film.2021.1080p' },
        { id: 6, movieId: 13, title: 'Another.Film' },
      ],
    }).records;
    const item = aRequestItem();
    const arr = aFakeArr({ 'PUT /api/v3/movie/editor': { body: [] } });
    const handOff = createRadarrHandOff(createArrCaller(arr.fetch, anArrApp()));

    expect(
      (await handOff.queued(aMediaRequest(), [item], 12, queue)).map((one) => [
        one.record.id,
        one.itemIds,
      ]),
    ).toEqual([[5, [item.id]]]);

    await handOff.monitor(aMediaRequest(), [item], 12, false);

    expect(arr.sent('PUT', '/api/v3/movie/editor')).toEqual([{ movieIds: [12], monitored: false }]);
  });
});
