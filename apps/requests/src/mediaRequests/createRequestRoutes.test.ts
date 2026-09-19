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
      await (await ask(`/requests/${id}`, 'PATCH', { change: { waitFor: 'physical' } })).json(),
    ).toMatchObject({ waitFor: 'physical' });
    expect((await ask(`/requests/${id}`, 'PATCH', { change: { waitFor: 'cinema' } })).status).toBe(
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
    const { ask } = theRoutes();
    const id = await madeDune(ask);

    expect(await (await ask('/requests/following')).json()).toHaveLength(1);
    expect((await ask(`/requests/${id}`)).status).toBe(200);
    expect((await ask(`/requests/${id}`, 'DELETE')).status).toBe(204);
    expect((await ask(`/requests/${id}`, 'DELETE')).status).toBe(404);
    expect((await ask(`/requests/${id}`)).status).toBe(404);
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
