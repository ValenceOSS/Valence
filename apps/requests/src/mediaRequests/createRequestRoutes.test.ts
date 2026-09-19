import { describe, expect, it, vi } from 'vitest';
import { MediaRequestAddedSchema } from '@ValenceContracts/schemas/MediaRequest';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { aRelease } from '@ValenceRequests/testing/aRelease';
import { createRequestRoutes } from './createRequestRoutes';
import { createRequestService } from './createRequestService';
import { createMemoryRequestLogStore } from './createMemoryRequestLogStore';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
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
const theRoutes = (picked: MediaRequest | string | null = null) => {
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
    blockedFor: vi.fn((id: string) =>
      Promise.resolve([
        {
          id: '0b1d2c3e-4f56-4a78-9b01-23456789abcd',
          requestId: id,
          title: 'Dune.2021.2160p',
          indexerId: null,
          reason: 'It stalled',
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
    ).toMatchObject({ mediaId: 'media-1' });
    expect((await ask(`/requests/${id}/arrived`, 'POST', {})).status).toBe(400);
    expect((await ask('/requests/missing/approve', 'POST')).status).toBe(404);
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

    await log.store.add(id, 'Searched for it.');

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
    expect(worker.dropDownloads).toHaveBeenCalledWith(id);
    expect((await ask('/requests/missing?deleteDownloads=true', 'DELETE')).status).toBe(404);
    expect(worker.dropDownloads).toHaveBeenCalledTimes(1);
  });

  it('lists the releases a request will not try again, and lifts one', async () => {
    const { ask, worker } = theRoutes();
    const id = await madeDune(ask);

    expect(await (await ask(`/requests/${id}/blocklist`)).json()).toEqual([
      {
        id: '0b1d2c3e-4f56-4a78-9b01-23456789abcd',
        requestId: id,
        title: 'Dune.2021.2160p',
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
    const { ask, worker } = theRoutes('No torrent client is set up');

    expect(await (await ask('/requests/missing', 'POST')).json()).toEqual({
      searched: 2,
      startedAt: '2026-09-19T00:00:00.000Z',
    });
    expect((await ask('/requests/some/releases')).status).toBe(200);
    expect((await ask('/requests/missing/releases')).status).toBe(404);
    expect(
      await (await ask('/requests/some/pick', 'POST', { release: aRelease('Dune') })).json(),
    ).toEqual({ error: 'No torrent client is set up' });
    expect((await ask('/requests/some/pick', 'POST', {})).status).toBe(400);
    expect(worker.pick).toHaveBeenCalledTimes(1);
  });
});
