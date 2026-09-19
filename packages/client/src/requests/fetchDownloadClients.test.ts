import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addDownloadClient,
  changeDownloadClient,
  fetchDownloadClients,
  removeDownloadClient,
  testDownloadClient,
  tryDownloadClient,
} from './fetchDownloadClients';

const A_CLIENT = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'qBittorrent',
  kind: 'qbittorrent',
  url: 'http://qbittorrent:8080',
  username: 'admin',
  hasPassword: true,
  hasApiKey: false,
  categories: {
    movies: 'valence-films',
    shows: 'valence-series',
    music: 'valence-music',
    books: 'valence-books',
  },
  priority: 25,
  isEnabled: true,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const A_TEST = { isWorking: true, problem: null, version: 'v5.0.1' };

const A_DRAFT = {
  name: 'qBittorrent',
  kind: 'qbittorrent' as const,
  url: 'http://qbittorrent:8080',
};

/**
 * The server, answering every question with the one body.
 */
const answering = (body: object | null, status = 200) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(new Response(body === null ? null : JSON.stringify(body), { status })),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

/**
 * Where each call went, and how.
 */
const addressed = (fetchMock: ReturnType<typeof answering>) =>
  fetchMock.mock.calls.map(([path, init]) => `${init?.method ?? 'GET'} ${path}`);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchDownloadClients', () => {
  it('reads the clients', async () => {
    answering([A_CLIENT]);

    expect(await fetchDownloadClients()).toEqual([A_CLIENT]);
  });

  it('adds, changes, tests, tries and removes a client', async () => {
    const kept = answering(A_CLIENT, 201);

    expect((await addDownloadClient(A_DRAFT)).value).toEqual(A_CLIENT);
    expect((await changeDownloadClient(A_CLIENT.id, { priority: 3 })).value).toEqual(A_CLIENT);

    const tested = answering(A_TEST);

    expect((await testDownloadClient(A_CLIENT.id)).value).toEqual(A_TEST);
    expect((await tryDownloadClient(A_DRAFT)).value).toEqual(A_TEST);
    expect((await tryDownloadClient(A_DRAFT, A_CLIENT.id)).value).toEqual(A_TEST);

    const removed = answering(null, 204);

    expect(await removeDownloadClient(A_CLIENT.id)).toBeNull();
    expect([...addressed(kept), ...addressed(tested), ...addressed(removed)]).toEqual([
      'POST /api/admin/requests/clients',
      `PATCH /api/admin/requests/clients/${A_CLIENT.id}`,
      `POST /api/admin/requests/clients/${A_CLIENT.id}/test`,
      'POST /api/admin/requests/clients/try',
      `POST /api/admin/requests/clients/${A_CLIENT.id}/try`,
      `DELETE /api/admin/requests/clients/${A_CLIENT.id}`,
    ]);
  });

  it('says why a client was not kept', async () => {
    answering({ error: 'That is not a download client.' }, 400);

    expect(await addDownloadClient(A_DRAFT)).toEqual({
      value: null,
      refusal: { message: 'That is not a download client.' },
    });
  });
});
