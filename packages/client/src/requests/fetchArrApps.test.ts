import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addArrApp,
  changeArrApp,
  fetchArrAppChoices,
  fetchArrApps,
  fetchArrQueue,
  importArrIndexers,
  removeArrApp,
  testArrApp,
  tryArrApp,
} from './fetchArrApps';

const AN_APP = {
  id: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
  name: 'Radarr',
  kind: 'radarr',
  url: 'http://radarr:7878',
  hasApiKey: true,
  remotePath: '',
  localPath: '',
  isEnabled: true,
  isWorking: null,
  version: null,
  lastCheckedAt: null,
  lastProblem: null,
  lastProblemCode: null,
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
};

const A_TEST = { isWorking: true, problem: null, problemCode: null, version: '5.14.0.9383' };

const A_DRAFT = { name: 'Radarr', kind: 'radarr' as const, url: 'http://radarr:7878' };

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

describe('fetchArrApps', () => {
  it('reads the apps, their queues and a library’s choices', async () => {
    answering([AN_APP]);
    expect(await fetchArrApps()).toEqual([AN_APP]);

    answering({ apps: [], items: [] });
    expect(await fetchArrQueue()).toEqual({ apps: [], items: [] });

    const choices = answering({ rootFolders: [], qualityProfiles: [], metadataProfiles: [] });

    expect(await fetchArrAppChoices(AN_APP.id)).toEqual({
      rootFolders: [],
      qualityProfiles: [],
      metadataProfiles: [],
    });
    expect(addressed(choices)).toEqual([`GET /api/admin/requests/arr-apps/${AN_APP.id}/choices`]);
  });

  it('connects, changes, tests, tries, imports from and removes an app', async () => {
    const kept = answering(AN_APP, 201);

    expect((await addArrApp(A_DRAFT)).value).toEqual(AN_APP);
    expect((await changeArrApp(AN_APP.id, { name: 'Films' })).value).toEqual(AN_APP);

    const tested = answering(A_TEST);

    expect((await testArrApp(AN_APP.id)).value).toEqual(A_TEST);
    expect((await tryArrApp(A_DRAFT)).value).toEqual(A_TEST);
    expect((await tryArrApp(A_DRAFT, AN_APP.id)).value).toEqual(A_TEST);

    const imported = answering({ added: 1, updated: 0, removed: 0, unchanged: 0 });

    expect((await importArrIndexers(AN_APP.id)).value).toMatchObject({ added: 1 });

    const removed = answering(null, 204);

    expect(await removeArrApp(AN_APP.id)).toBeNull();
    expect([
      ...addressed(kept),
      ...addressed(tested),
      ...addressed(imported),
      ...addressed(removed),
    ]).toEqual([
      'POST /api/admin/requests/arr-apps',
      `PATCH /api/admin/requests/arr-apps/${AN_APP.id}`,
      `POST /api/admin/requests/arr-apps/${AN_APP.id}/test`,
      'POST /api/admin/requests/arr-apps/try',
      `POST /api/admin/requests/arr-apps/${AN_APP.id}/try`,
      `POST /api/admin/requests/arr-apps/${AN_APP.id}/import-indexers`,
      `DELETE /api/admin/requests/arr-apps/${AN_APP.id}`,
    ]);
  });

  it('says why an app was not connected', async () => {
    answering({ error: 'That isn’t a valid connected app.' }, 400);

    expect(await addArrApp(A_DRAFT)).toEqual({
      value: null,
      refusal: { message: 'That isn’t a valid connected app.' },
    });
  });
});
