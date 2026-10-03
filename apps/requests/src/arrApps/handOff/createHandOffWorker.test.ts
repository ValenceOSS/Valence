import { describe, expect, it, vi } from 'vitest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { ArrAppFailure } from '@ValenceRequests/arrApps/ArrAppFailure';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { ArrQueuePageSchema } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';
import { createMemoryEventStore } from '@ValenceRequests/events/createMemoryEventStore';
import { createMemoryRequestLogStore } from '@ValenceRequests/mediaRequests/createMemoryRequestLogStore';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import type { ArrAppRecord } from '@ValenceRequests/arrApps/ArrAppRecord';
import type { HandOffHandler, ItemSighting } from './HandOffHandler';
import { createHandOffWorker } from './createHandOffWorker';

const RADARR = anArrApp({ remotePath: '/movies', localPath: '/media/Films' });

const HAND_OFF = {
  appId: RADARR.id,
  rootFolderPath: '/movies',
  qualityProfileId: 4,
  metadataProfileId: null,
  searchesOnAdd: true,
};

const QUEUE_PAGE = {
  records: [
    {
      id: 5,
      movieId: 12,
      title: 'Dune.2021.1080p',
      status: 'downloading',
      size: 1000,
      sizeleft: 400,
    },
  ],
};

const QUEUED = ArrQueuePageSchema.parse(QUEUE_PAGE).records;

/**
 * A hand-off worker over memory stores, a Radarr whose queue holds one film, and a hand-off that
 * places at 12 and sees what the test says.
 *
 * @param given - The request, its items, the apps there are, and what the hand-off sees.
 * @returns The worker and everything it keeps.
 */
const aWorker = ({
  request = aMediaRequest({ handOff: HAND_OFF }),
  others = [],
  items = [aRequestItem()],
  apps = [RADARR],
  sees = (all: readonly RequestItemRecord[]): ItemSighting[] =>
    all.map((item) => ({ itemId: item.id, kind: 'missing' })),
  place = () => Promise.resolve(12),
  handler = true,
  now = () => new Date('2026-10-01T09:00:00.000Z'),
}: {
  request?: MediaRequestRecord;
  others?: MediaRequestRecord[];
  items?: RequestItemRecord[];
  apps?: ArrAppRecord[];
  sees?: (all: readonly RequestItemRecord[]) => ItemSighting[];
  place?: HandOffHandler['place'];
  handler?: boolean;
  now?: () => Date;
} = {}) => {
  const requests = createMemoryRecordStore([request, ...others]);
  const itemStore = createMemoryRecordStore(items);
  const events = createMemoryEventStore();
  const log = createMemoryRequestLogStore();
  const arr = aFakeArr({ 'GET /api/v3/queue': { body: QUEUE_PAGE } });
  const watch = vi.fn<HandOffHandler['watch']>((_request, all) => Promise.resolve(sees(all)));
  const placing = vi.fn<HandOffHandler['place']>(place);
  const worker = createHandOffWorker({
    requests,
    items: itemStore,
    apps: createMemoryRecordStore(apps),
    connect: (app) => createArrCaller(arr.fetch, app),
    events,
    log: log.store,
    handlerFor: () => (handler ? { place: placing, watch } : null),
    now,
  });

  return { worker, requests, items: itemStore, events, log, arr, watch, placing };
};

describe('createHandOffWorker', () => {
  it('hands an approved request over once, and remembers what the app calls it', async () => {
    const { worker, requests, placing, log } = aWorker();

    await worker.step();
    await worker.step();

    expect(placing).toHaveBeenCalledTimes(1);
    expect(await requests.find(aMediaRequest().id)).toMatchObject({ handOffId: 12 });
    expect(log.said.map((line) => line.message.message)).toEqual(['Sent to Radarr.']);
  });

  it('leaves alone what is not handed off, not approved, or not due to be watched again', async () => {
    const own = aWorker({ request: aMediaRequest() });
    const awaiting = aWorker({
      request: aMediaRequest({ handOff: HAND_OFF, approval: 'awaiting' }),
    });
    const watched = aWorker({ request: aMediaRequest({ handOff: HAND_OFF, handOffId: 12 }) });

    await own.worker.step();
    await awaiting.worker.step();
    await watched.worker.step();
    await watched.worker.step();

    expect(own.placing).not.toHaveBeenCalled();
    expect(awaiting.placing).not.toHaveBeenCalled();
    expect(watched.placing).not.toHaveBeenCalled();
    expect(watched.watch).toHaveBeenCalledTimes(1);
  });

  it('moves a film to downloading as the app queues it, saying so once', async () => {
    const item = aRequestItem();
    const { worker, items, events, watch } = aWorker({
      request: aMediaRequest({ handOff: HAND_OFF, handOffId: 12 }),
      items: [item],
      sees: (all) =>
        all.flatMap((one): ItemSighting[] =>
          QUEUED.map((record) => ({ itemId: one.id, kind: 'queued', record })),
        ),
    });

    await worker.step();

    expect(watch.mock.calls[0]?.[4]).toEqual(QUEUED);
    expect(await items.find(item.id)).toMatchObject({
      state: 'downloading',
      releaseTitle: 'Dune.2021.1080p',
      downloadedBytes: 600,
    });
    expect((await events.pending()).map((event) => event.kind)).toEqual(['chosen', 'started']);
  });

  it('files what the app imported, where Valence sees it, and tells the server which folder to read', async () => {
    const item = aRequestItem({ state: 'downloading' });
    const { worker, items, events } = aWorker({
      request: aMediaRequest({ handOff: HAND_OFF, handOffId: 12 }),
      items: [item],
      sees: (all) =>
        all.map((one) => ({
          itemId: one.id,
          kind: 'imported',
          path: '/movies/Dune (2021)/Dune (2021).mkv',
          folder: '/movies/Dune (2021)',
        })),
    });

    await worker.step();

    expect(await items.find(item.id)).toMatchObject({
      state: 'filed',
      filePath: '/media/Films/Dune (2021)/Dune (2021).mkv',
      filedTitle: 'Dune (2021).mkv',
    });
    expect(await events.pending()).toMatchObject([
      {
        kind: 'filed',
        requestKind: 'film',
        tmdbId: 438_631,
        musicBrainzId: null,
        libraryId: 'films',
        folder: '/media/Films/Dune (2021)',
      },
    ]);
  });

  it('tells the server of each album filed, by its release group', async () => {
    const albums = [
      aRequestItem({ id: 'a', musicBrainzId: 'b1392450-e666-3926-a536-22c65f834433' }),
      aRequestItem({ id: 'b', musicBrainzId: 'c1392450-e666-3926-a536-22c65f834434' }),
    ];
    const { worker, events } = aWorker({
      request: aMediaRequest({
        kind: 'artist',
        tmdbId: null,
        musicBrainzId: 'a74b1b7f-71a5-4011-9441-d0b5e4122711',
        handOff: HAND_OFF,
        handOffId: 2,
      }),
      items: albums,
      sees: (all) =>
        all.map((one) => ({
          itemId: one.id,
          kind: 'imported',
          path: `/music/${one.id}/1.flac`,
          folder: `/music/${one.id}`,
        })),
    });

    await worker.step();

    expect(
      (await events.pending()).map((event) => event.kind === 'filed' && event.musicBrainzId),
    ).toEqual(['b1392450-e666-3926-a536-22c65f834433', 'c1392450-e666-3926-a536-22c65f834434']);
  });

  it('passes on what the app says is wrong with a download once, as a failure', async () => {
    const item = aRequestItem({ state: 'downloading', releaseTitle: 'Dune.2021.1080p' });
    const [failing] = ArrQueuePageSchema.parse({
      records: [
        {
          id: 5,
          movieId: 12,
          title: 'Dune.2021.1080p',
          status: 'completed',
          trackedDownloadStatus: 'warning',
          statusMessages: [{ messages: ['No files found are eligible for import'] }],
        },
      ],
    }).records;
    const { worker, items, events } = aWorker({
      request: aMediaRequest({ handOff: HAND_OFF, handOffId: 12 }),
      items: [item],
      sees: (all) =>
        failing === undefined
          ? []
          : all.map((one) => ({ itemId: one.id, kind: 'queued', record: failing })),
    });

    await worker.step();

    expect(await items.find(item.id)).toMatchObject({
      state: 'downloading',
      problem: { message: 'No files found are eligible for import' },
      downloadedBytes: null,
    });
    expect(await events.pending()).toMatchObject([
      {
        kind: 'failed',
        clientName: 'Radarr',
        problem: { message: 'No files found are eligible for import' },
      },
    ]);
  });

  it('puts back what the app no longer has queued, as wanted where it is out and waiting where not', async () => {
    const items = [
      aRequestItem({ id: 'out', state: 'downloading', releaseTitle: 'x', downloadedBytes: 5 }),
      aRequestItem({ id: 'soon', season: 1, episode: 1, airDate: '2099-01-01' }),
      aRequestItem({ id: 'undated', season: 1, episode: 2, airDate: null, state: 'wanted' }),
      aRequestItem({ id: 'done', state: 'available' }),
      aRequestItem({ id: 'same', state: 'wanted' }),
    ];
    const { worker, items: store } = aWorker({
      request: aMediaRequest({ handOff: HAND_OFF, handOffId: 12 }),
      items,
      sees: (all) => [
        ...all.map((one): ItemSighting => ({ itemId: one.id, kind: 'missing' })),
        { itemId: 'gone', kind: 'missing' },
        { itemId: 'same', kind: 'unchanged' },
      ],
    });

    await worker.step();

    expect(await store.find('out')).toMatchObject({
      state: 'wanted',
      releaseTitle: null,
      downloadedBytes: null,
    });
    expect(await store.find('soon')).toMatchObject({ state: 'waiting' });
    expect(await store.find('undated')).toMatchObject({ state: 'waiting' });
    expect(await store.find('done')).toMatchObject({ state: 'available' });
    expect((await store.find('same'))?.updatedAt).toBe(aRequestItem().updatedAt);
  });

  it('says why a request could not be handed over, once, and clears it when it can', async () => {
    let isRefusing = true;
    const { worker, requests, log } = aWorker({
      place: () =>
        isRefusing
          ? Promise.reject(
              new ArrAppFailure(sayVerbatim('Couldn’t connect to Radarr'), 'ArrAppUnreachable'),
            )
          : Promise.resolve(12),
    });
    const id = aMediaRequest().id;

    await worker.step();
    await worker.step();

    expect(await requests.find(id)).toMatchObject({
      problem: { message: 'Radarr couldn’t add it: Couldn’t connect to Radarr' },
      problemCode: 'ArrAppUnreachable',
    });
    expect(log.said).toHaveLength(1);

    isRefusing = false;
    await worker.step();

    expect(await requests.find(id)).toMatchObject({ handOffId: 12, problem: null });
  });

  it('asks an app that cannot be reached once a round, giving its other requests the same problem', async () => {
    const second = aMediaRequest({ id: crypto.randomUUID(), handOff: HAND_OFF });
    const { worker, requests, placing } = aWorker({
      others: [second],
      place: () =>
        Promise.reject(
          new ArrAppFailure(sayVerbatim('Couldn’t connect to Radarr'), 'ArrAppUnreachable'),
        ),
    });

    await worker.step();

    expect(placing).toHaveBeenCalledTimes(1);
    expect(await requests.find(second.id)).toMatchObject({
      problem: { message: 'Radarr couldn’t add it: Couldn’t connect to Radarr' },
      problemCode: 'ArrAppUnreachable',
    });

    await worker.step();

    expect(placing).toHaveBeenCalledTimes(2);
  });

  it('keeps asking an app about its other requests where it refused only one', async () => {
    const second = aMediaRequest({ id: crypto.randomUUID(), handOff: HAND_OFF });
    const { worker, placing } = aWorker({
      others: [second],
      place: () =>
        Promise.reject(new ArrAppFailure(sayVerbatim('Radarr returned HTTP 400'), null, 400)),
    });

    await worker.step();

    expect(placing).toHaveBeenCalledTimes(2);
  });

  it('hands over again a film the app no longer knows', async () => {
    const { worker, requests } = aWorker({
      request: aMediaRequest({ handOff: HAND_OFF, handOffId: 12 }),
      sees: () => {
        throw new ArrAppFailure(sayVerbatim('Radarr returned HTTP 404'), null, 404);
      },
    });

    await worker.step();

    expect(await requests.find(aMediaRequest().id)).toMatchObject({ handOffId: null });
  });

  it('says where the app is gone, switched off, or takes no requests', async () => {
    const gone = aWorker({ apps: [] });
    const off = aWorker({ apps: [{ ...RADARR, isEnabled: false }] });
    const prowlarr = aWorker({ handler: false });

    await gone.worker.step();
    await off.worker.step();
    await prowlarr.worker.step();

    expect((await gone.requests.find(aMediaRequest().id))?.problem?.message).toBe(
      'The connected app it was sent to has been removed.',
    );
    expect((await off.requests.find(aMediaRequest().id))?.problem?.message).toBe(
      'Radarr is turned off, or can’t take requests.',
    );
    expect((await prowlarr.requests.find(aMediaRequest().id))?.problem?.message).toBe(
      'Radarr is turned off, or can’t take requests.',
    );
  });

  it('lets anything but an app’s failure through', async () => {
    const { worker } = aWorker({ place: () => Promise.reject(new Error('Broken')) });

    await expect(worker.step()).rejects.toThrow('Broken');
  });
});
