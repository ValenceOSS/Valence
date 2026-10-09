import { describe, expect, it } from 'vitest';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { createMemoryRequestLogStore } from '@ValenceRequests/mediaRequests/createMemoryRequestLogStore';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { createHandOffControl } from './createHandOffControl';

const RADARR = anArrApp();

const HANDED_OFF = aMediaRequest({
  handOff: {
    appId: RADARR.id,
    rootFolderPath: '/movies',
    qualityProfileId: 4,
    metadataProfileId: null,
    searchesOnAdd: true,
  },
  handOffId: 12,
});

const ITEM = aRequestItem();

const QUEUE = {
  records: [
    {
      id: 5,
      movieId: 12,
      title: 'A.Film.2021.1080p',
      downloadId: 'abc',
      size: 1000,
      sizeleft: 500,
      downloadClient: 'qBittorrent',
    },
    { id: 6, movieId: 13, title: 'Another.Film' },
  ],
};

const BLOCKLIST = {
  records: [
    {
      id: 3,
      movieId: 12,
      sourceTitle: 'A.Film.2021.720p',
      date: '2026-10-01T10:00:00Z',
      message: 'Download failed',
    },
    { id: 4, movieId: 12, sourceTitle: 'A.Film.2021.2160p', date: '2026-10-02T10:00:00Z' },
    { id: 8, movieId: 99, sourceTitle: 'Another.Film', date: '2026-10-02T10:00:00Z' },
  ],
};

/**
 * A control over one film handed to a Radarr that has it queued once and blocked twice.
 *
 * @param request - The request, handed off unless the test says otherwise.
 * @param isEnabled - Whether the app is switched on.
 * @returns The control, the fake app, and the request's history.
 */
const aControl = (request: MediaRequestRecord = HANDED_OFF, isEnabled = true) => {
  const arr = aFakeArr({
    'GET /api/v3/queue': { body: QUEUE },
    'DELETE /api/v3/queue/5': { body: null },
    'PUT /api/v3/movie/editor': { body: [] },
    'POST /api/v3/command': { status: 201, body: { name: 'MoviesSearch', id: 1 } },
    'GET /api/v3/blocklist': { body: BLOCKLIST },
    'DELETE /api/v3/blocklist/3': { body: null },
  });
  const log = createMemoryRequestLogStore();
  const control = createHandOffControl({
    requests: createMemoryRecordStore([request]),
    items: createMemoryRecordStore([ITEM]),
    apps: createMemoryRecordStore([{ ...RADARR, isEnabled }]),
    connect: (app) => createArrCaller(arr.fetch, app),
    log: log.store,
  });

  return { control, arr, said: () => log.said.map((line) => line.message.message) };
};

describe('createHandOffControl', () => {
  it('lists what the app is downloading for the film, and nothing for a request it was not handed', async () => {
    expect(await aControl().control.downloads(HANDED_OFF.id)).toEqual({
      kind: 'done',
      value: [
        {
          id: '5',
          releaseTitle: 'A.Film.2021.1080p',
          itemIds: [ITEM.id],
          clientName: 'qBittorrent',
          progress: 0.5,
          sizeBytes: 1000,
          secondsLeft: null,
          problem: null,
        },
      ],
    });
    expect(await aControl(aMediaRequest()).control.downloads(HANDED_OFF.id)).toEqual({
      kind: 'notHandedOff',
    });
    expect(await aControl(HANDED_OFF, false).control.downloads(HANDED_OFF.id)).toEqual({
      kind: 'notHandedOff',
    });
  });

  it('stops a download in the app, blocking it, and lets the app look for another', async () => {
    const { control, arr, said } = aControl();

    expect(await control.stop(HANDED_OFF.id, '5', 'another')).toEqual({
      kind: 'done',
      value: [ITEM.id],
    });
    expect(
      arr.asked
        .filter((one) => one.method === 'DELETE')
        .map((one) => [
          one.path,
          one.query.get('removeFromClient'),
          one.query.get('blocklist'),
          one.query.get('skipRedownload'),
        ]),
    ).toEqual([['/api/v3/queue/5', 'true', 'true', 'false']]);
    expect(arr.sent('PUT', '/api/v3/movie/editor')).toEqual([]);
    expect(said()).toEqual(['Asked Radarr to stop A.Film.2021.1080p.']);
  });

  it('stops a download and the film’s monitoring where nothing else is wanted', async () => {
    const { control, arr } = aControl();

    await control.stop(HANDED_OFF.id, '5', 'nothing');

    expect(arr.asked.find((one) => one.method === 'DELETE')?.query.get('skipRedownload')).toBe(
      'true',
    );
    expect(arr.sent('PUT', '/api/v3/movie/editor')).toEqual([{ movieIds: [12], monitored: false }]);
  });

  it('refuses to stop a download the app no longer has', async () => {
    const { control, arr } = aControl();

    expect(await control.stop(HANDED_OFF.id, '6', 'another')).toMatchObject({
      kind: 'failed',
      problem: { message: 'That isn’t one of the downloads its connected app has.' },
    });
    expect(arr.asked.filter((one) => one.method === 'DELETE')).toEqual([]);
  });

  it('lists the film’s entries on the app’s blocklist, and lifts one', async () => {
    const { control, arr, said } = aControl();

    expect(await control.blocklist(HANDED_OFF.id)).toMatchObject({
      kind: 'done',
      value: [
        {
          id: '3',
          requestId: HANDED_OFF.id,
          title: 'A.Film.2021.720p',
          reason: { message: 'Download failed' },
          at: '2026-10-01T10:00:00.000Z',
        },
        { id: '4', reason: { message: 'Blocked in Radarr.' } },
      ],
    });
    expect(await control.lift(HANDED_OFF.id, '3')).toEqual({ kind: 'done', value: true });
    expect(await control.lift(HANDED_OFF.id, '8')).toMatchObject({ kind: 'failed' });
    expect(arr.asked.filter((one) => one.method === 'DELETE').map((one) => one.path)).toEqual([
      '/api/v3/blocklist/3',
    ]);
    expect(said()).toEqual(['Asked Radarr to try A.Film.2021.720p again.']);
  });

  it('follows the film in the app, searching where the library says to, and lets it go', async () => {
    const { control, arr, said } = aControl();

    expect(await control.follow(HANDED_OFF.id, [ITEM.id], true)).toEqual({
      kind: 'done',
      value: true,
    });
    expect(await control.release(HANDED_OFF.id)).toEqual({ kind: 'done', value: true });
    expect(arr.sent('PUT', '/api/v3/movie/editor')).toEqual([
      { movieIds: [12], monitored: true },
      { movieIds: [12], monitored: false },
    ]);
    expect(arr.sent('POST', '/api/v3/command')).toEqual([{ name: 'MoviesSearch', movieIds: [12] }]);
    expect(said()).toEqual(['Asked Radarr to monitor it.', 'Asked Radarr to stop monitoring it.']);
  });

  it('says what the app said where it refuses', async () => {
    const arr = aFakeArr({});
    const control = createHandOffControl({
      requests: createMemoryRecordStore([HANDED_OFF]),
      items: createMemoryRecordStore([ITEM]),
      apps: createMemoryRecordStore([RADARR]),
      connect: (app) => createArrCaller(arr.fetch, app),
      log: createMemoryRequestLogStore().store,
    });

    const refused = await control.follow(HANDED_OFF.id, [ITEM.id], false);

    expect(refused.kind).toBe('failed');
    expect(refused.kind === 'failed' ? refused.problem.message : '').toContain('Radarr');
  });
});
