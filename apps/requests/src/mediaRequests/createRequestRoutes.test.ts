import type { Said } from '@ValenceI18n/SaidSchema';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { describe, expect, it, vi } from 'vitest';
import {
  MediaRequestAddedSchema,
  MediaRequestSchema,
} from '@ValenceContracts/schemas/MediaRequest';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { aRelease } from '@ValenceRequests/testing/aRelease';
import { createRequestRoutes } from './createRequestRoutes';
import { createRequestService } from './createRequestService';
import { createMemoryRequestLogStore } from './createMemoryRequestLogStore';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { HandedTo } from '@ValenceContracts/schemas/ArrApp';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

const DUNE = {
  kind: 'film',
  tmdbId: 438631,
  libraryId: 'films',
  libraryPath: '/media/Films',
  requestedBy: { id: 'someone', name: 'Someone' },
  isApproved: false,
  catalogue: { title: 'Dune', year: 2021 },
};

/**
 * The routes over no requests to begin with, and a worker that answers as told.
 */
const theRoutes = (
  picked: MediaRequest | { refused: Said } | null = null,
  handOff:
    | {
        searchNow: (id: string) => Promise<'searched' | 'failed' | 'notApproved' | 'notHandedOff'>;
        handedTo: (id: string) => Promise<HandedTo | null>;
      }
    | undefined = undefined,
) => {
  const worker = {
    searchMissing: vi.fn(() =>
      Promise.resolve({ searched: 2, startedAt: '2026-09-19T00:00:00.000Z' }),
    ),
    releasesFor: vi.fn((id: string) =>
      Promise.resolve(
        id === 'missing' ? null : { releases: [], indexers: [], judgements: [], pickedId: null },
      ),
    ),
    pick: vi.fn(() => Promise.resolve(picked)),
    releasesForDraft: vi.fn(() =>
      Promise.resolve({ releases: [], indexers: [], judgements: [], pickedId: null }),
    ),
    dropDownloads: vi.fn(() => Promise.resolve(1)),
    unfinishedDownloadsOf: vi.fn(() => Promise.resolve(['d1'])),
    stopDownload: vi.fn((id: string): Promise<MediaRequest | null> =>
      Promise.resolve(id === 'missing' ? null : null),
    ),
    deleteFiled: vi.fn(() => Promise.resolve(['/media/Films/Dune (2021)'])),
    blockedFor: vi.fn((id: string) =>
      Promise.resolve([
        {
          id: '0b1d2c3e-4f56-4a78-9b01-23456789abcd',
          requestId: id,
          title: 'Dune.2021.2160p',
          infoHash: null,
          indexerId: null,
          reason: sayVerbatim('It stalled'),
          at: '2026-09-19T00:00:00.000Z',
        },
      ]),
    ),
    unblock: vi.fn((id: string) => Promise.resolve(id !== 'missing')),
  };
  const log = createMemoryRequestLogStore();
  const routes = createRequestRoutes({
    log: log.store,
    service: createRequestService({
      requests: createMemoryRecordStore<MediaRequestRecord>(),
      items: createMemoryRecordStore<RequestItemRecord>(),
    }),
    worker,
    ...(handOff === undefined ? {} : { handOff }),
  });

  const ask = (path: string, method = 'GET', body?: object) =>
    routes.request(path, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  return { ask, worker, log };
};

/**
 * Makes the Dune request, and says its id.
 */
const madeDune = async (ask: ReturnType<typeof theRoutes>['ask']) =>
  MediaRequestAddedSchema.parse(await (await ask('/requests', 'POST', DUNE)).json()).request.id;

describe('createRequestRoutes', () => {
  it('makes a request, and adds to it when it is asked for again', async () => {
    const { ask } = theRoutes();

    expect((await ask('/requests', 'POST', DUNE)).status).toBe(201);
    expect((await ask('/requests', 'POST', DUNE)).status).toBe(200);
    expect(await (await ask('/requests')).json()).toHaveLength(1);
    expect((await ask('/requests', 'POST', { kind: 'film' })).status).toBe(400);
  });

  it('adds somebody else who wants a request, and takes them off again', async () => {
    const { ask } = theRoutes();
    const id = await madeDune(ask);

    const joined = await ask(`/requests/${id}/askers`, 'POST', { id: 'another', name: 'Another' });

    expect(joined.status).toBe(200);
    expect(MediaRequestSchema.parse(await joined.json()).alsoAskedBy).toEqual([
      { id: 'another', name: 'Another' },
    ]);
    expect((await ask(`/requests/${id}/askers`, 'POST', { name: 'Nobody' })).status).toBe(400);
    expect((await ask('/requests/missing/askers', 'POST', { id: 'a', name: 'A' })).status).toBe(
      404,
    );

    const left = await ask(`/requests/${id}/askers/someone`, 'DELETE');

    expect(MediaRequestSchema.parse(await left.json()).requestedBy.id).toBe('another');
    expect((await ask(`/requests/${id}/askers/another`, 'DELETE')).status).toBe(404);
  });

  it('refuses to settle a higher-quality ask that is not there, or a choice that is not one', async () => {
    const { ask } = theRoutes();
    const id = await madeDune(ask);

    expect((await ask(`/requests/${id}/profile-ask`, 'POST', { choice: 'keep' })).status).toBe(404);
    expect((await ask(`/requests/${id}/profile-ask`, 'POST', { choice: 'never' })).status).toBe(
      400,
    );
  });

  it('searches a handed-off request in its app, and says which app has it', async () => {
    const searchNow = vi.fn((): Promise<'searched' | 'failed' | 'notApproved' | 'notHandedOff'> =>
      Promise.resolve('searched'),
    );
    const handedTo = vi.fn((): Promise<HandedTo | null> =>
      Promise.resolve({
        appId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        appName: 'Radarr',
        appKind: 'radarr',
        link: 'http://radarr.local/movie/438631',
      }),
    );
    const { ask } = theRoutes(null, { searchNow, handedTo });
    const id = await madeDune(ask);

    expect((await ask(`/requests/${id}/retry`, 'POST')).status).toBe(200);
    expect(searchNow).toHaveBeenCalledWith(id);

    searchNow.mockResolvedValue('failed');

    expect((await ask(`/requests/${id}/retry`, 'POST')).status).toBe(409);

    searchNow.mockResolvedValue('notApproved');

    expect(await (await ask(`/requests/${id}/retry`, 'POST')).json()).toMatchObject({
      code: 'error.requests.itIsNotApprovedSoNothingIsSearched',
    });
    expect(await (await ask(`/requests/${id}/handed-to`)).json()).toMatchObject({
      appName: 'Radarr',
    });

    handedTo.mockResolvedValue(null);

    expect((await ask(`/requests/${id}/handed-to`)).status).toBe(404);
  });

  it('keeps only a film in two versions', async () => {
    const { ask } = theRoutes();
    const book = MediaRequestAddedSchema.parse(
      await (
        await ask('/requests', 'POST', {
          kind: 'book',
          openLibraryId: 1,
          libraryId: 'books',
          libraryPath: '/media/Books',
          requestedBy: { id: 'someone', name: 'Someone' },
          isApproved: false,
          catalogue: { title: 'A Book', year: null },
        })
      ).json(),
    ).request.id;

    expect((await ask(`/requests/${book}/profile-ask`, 'POST', { choice: 'both' })).status).toBe(
      400,
    );
  });

  it('approves, refuses, retries and marks a request arrived', async () => {
    const { ask } = theRoutes();
    const id = await madeDune(ask);

    expect(await (await ask(`/requests/${id}/approve`, 'POST')).json()).toMatchObject({
      approval: 'approved',
    });
    expect(
      await (await ask(`/requests/${id}/refuse`, 'POST', { reason: 'No room' })).json(),
    ).toMatchObject({ refusedBecause: 'No room' });
    expect((await ask(`/requests/${id}/refuse`, 'POST', { reason: 5 })).status).toBe(400);
    expect((await ask(`/requests/${id}/retry`, 'POST')).status).toBe(200);
    expect(
      await (await ask(`/requests/${id}/arrived`, 'POST', { mediaId: 'media-1' })).json(),
    ).toMatchObject({ request: { mediaId: 'media-1' }, newlyAvailable: 0 });
    expect((await ask(`/requests/${id}/arrived`, 'POST', {})).status).toBe(400);
    expect((await ask('/requests/missing/approve', 'POST')).status).toBe(404);
  });

  it('says a request was met by hand, and says nothing of one that does not exist', async () => {
    const { ask } = theRoutes();
    const id = await madeDune(ask);

    await ask(`/requests/${id}/approve`, 'POST');

    expect(await (await ask(`/requests/${id}/fulfil`, 'POST')).json()).toMatchObject({
      state: 'available',
    });
    expect((await ask('/requests/missing/fulfil', 'POST')).status).toBe(404);
  });

  it('changes a request, and brings it up to date with the catalogue', async () => {
    const { ask } = theRoutes();
    const id = await madeDune(ask);

    expect(
      await (await ask(`/requests/${id}`, 'PATCH', { change: { isPickedByHand: true } })).json(),
    ).toMatchObject({ isPickedByHand: true });
    expect((await ask(`/requests/${id}`, 'PATCH', { change: { seasons: 'all' } })).status).toBe(
      400,
    );
    expect(
      await (
        await ask(`/requests/${id}/catalogue`, 'PUT', {
          catalogue: { title: 'Dune: Part One', year: 2021 },
        })
      ).json(),
    ).toMatchObject({ title: 'Dune: Part One' });
    expect((await ask(`/requests/${id}/catalogue`, 'PUT', {})).status).toBe(400);
  });

  it('searches by hand for a request not yet made, making nothing', async () => {
    const { ask, worker } = theRoutes();

    expect((await ask('/requests/releases', 'POST', DUNE)).status).toBe(200);
    expect(worker.releasesForDraft).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 438631 }),
    );
    expect(await (await ask('/requests')).json()).toEqual([]);
    expect((await ask('/requests/releases', 'POST', { kind: 'film' })).status).toBe(400);
  });

  it('reads what a request has done', async () => {
    const { ask, log } = theRoutes();
    const id = await madeDune(ask);

    await log.store.add(id, sayVerbatim('Searched for it.'));

    expect(await (await ask(`/requests/${id}/log`)).json()).toMatchObject([
      { message: 'Searched for it.' },
    ]);
    expect((await ask('/requests/missing/log')).status).toBe(404);
  });

  it('lists what is followed, finds one, and removes one', async () => {
    const { ask, worker } = theRoutes();
    const id = await madeDune(ask);

    expect(await (await ask('/requests/following')).json()).toHaveLength(1);
    expect((await ask(`/requests/${id}`)).status).toBe(200);
    expect((await ask(`/requests/${id}`, 'DELETE')).status).toBe(204);
    expect(worker.dropDownloads).not.toHaveBeenCalled();
    expect((await ask(`/requests/${id}`, 'DELETE')).status).toBe(404);
    expect((await ask(`/requests/${id}`)).status).toBe(404);
  });

  it('cancels a request with the downloads it had not finished, files and all', async () => {
    const { ask, worker } = theRoutes();
    const id = await madeDune(ask);

    expect((await ask(`/requests/${id}?deleteDownloads=true`, 'DELETE')).status).toBe(204);
    expect(worker.unfinishedDownloadsOf).toHaveBeenCalledWith(id);
    expect(worker.dropDownloads).toHaveBeenCalledWith(['d1']);
    expect((await ask('/requests/missing?deleteDownloads=true', 'DELETE')).status).toBe(404);
    expect(worker.dropDownloads).toHaveBeenCalledTimes(1);
  });

  it('answers a cancel at once, while the worker is still busy', async () => {
    const { ask, worker } = theRoutes();
    const id = await madeDune(ask);

    worker.dropDownloads.mockReturnValue(new Promise(() => undefined));

    expect((await ask(`/requests/${id}?deleteDownloads=true`, 'DELETE')).status).toBe(204);
    expect((await ask(`/requests/${id}`)).status).toBe(404);
  });

  it('stops what a refused request was downloading', async () => {
    const { ask, worker } = theRoutes();
    const id = await madeDune(ask);

    await ask(`/requests/${id}/refuse`, 'POST', { reason: '' });

    expect(worker.dropDownloads).toHaveBeenCalledWith(['d1']);
  });

  it('stops one download of a request, saying what comes next', async () => {
    const { ask, worker } = theRoutes();
    const id = await madeDune(ask);

    expect(
      (await ask(`/requests/${id}/downloads/d1/stop`, 'POST', { next: 'another' })).status,
    ).toBe(404);
    expect(worker.stopDownload).toHaveBeenCalledWith(id, 'd1', {
      next: 'another',
      isDeletingFiles: true,
    });
    expect((await ask(`/requests/${id}/downloads/d1/stop`, 'POST', { next: 'soon' })).status).toBe(
      400,
    );
  });

  it('follows and stops following what a request waits for', async () => {
    const { ask } = theRoutes();
    const id = await madeDune(ask);
    const made = MediaRequestSchema.parse(await (await ask(`/requests/${id}`)).json());
    const itemIds = made.items.map((item) => item.id);

    expect(
      await (await ask(`/requests/${id}/follow`, 'POST', { itemIds, isFollowed: false })).json(),
    ).toMatchObject({ items: [{ isFollowed: false }] });
    expect((await ask(`/requests/${id}/follow`, 'POST', { isFollowed: false })).status).toBe(400);
    expect(
      (await ask('/requests/missing/follow', 'POST', { itemIds, isFollowed: true })).status,
    ).toBe(404);
  });

  it('deletes the files a request filed, and says the folders they were in', async () => {
    const { ask } = theRoutes();
    const id = await madeDune(ask);

    expect(await (await ask(`/requests/${id}/files/delete`, 'POST')).json()).toEqual({
      folders: ['/media/Films/Dune (2021)'],
    });
    expect((await ask('/requests/missing/files/delete', 'POST')).status).toBe(404);
  });

  it('lists the releases a request will not try again, and lifts one', async () => {
    const { ask, worker } = theRoutes();
    const id = await madeDune(ask);

    expect(await (await ask(`/requests/${id}/blocklist`)).json()).toEqual([
      {
        id: '0b1d2c3e-4f56-4a78-9b01-23456789abcd',
        requestId: id,
        title: 'Dune.2021.2160p',
        infoHash: null,
        indexerId: null,
        reason: 'It stalled',
        at: '2026-09-19T00:00:00.000Z',
      },
    ]);
    expect((await ask('/requests/missing/blocklist')).status).toBe(404);

    expect(
      (await ask(`/requests/${id}/blocklist/0b1d2c3e-4f56-4a78-9b01-23456789abcd`, 'DELETE'))
        .status,
    ).toBe(204);
    expect(worker.unblock).toHaveBeenCalledWith('0b1d2c3e-4f56-4a78-9b01-23456789abcd');
    expect((await ask(`/requests/${id}/blocklist/missing`, 'DELETE')).status).toBe(404);
  });

  it('searches for what is missing, and by hand, and sends a pick', async () => {
    const { ask, worker } = theRoutes({ refused: sayVerbatim('No torrent client is set up') });

    expect(await (await ask('/requests/missing', 'POST')).json()).toEqual({
      searched: 2,
      startedAt: '2026-09-19T00:00:00.000Z',
    });
    expect((await ask('/requests/some/releases')).status).toBe(200);
    expect((await ask('/requests/missing/releases')).status).toBe(404);
    expect(
      await (await ask('/requests/some/pick', 'POST', { release: aRelease('Dune') })).json(),
    ).toEqual({ error: 'No torrent client is set up', code: null, values: {} });
    expect((await ask('/requests/some/pick', 'POST', {})).status).toBe(400);
    expect(worker.pick).toHaveBeenCalledTimes(1);
  });
});
