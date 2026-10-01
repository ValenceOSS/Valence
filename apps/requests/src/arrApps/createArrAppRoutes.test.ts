import { describe, expect, it, vi } from 'vitest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { ArrApp } from '@ValenceContracts/schemas/ArrApp';
import type { ArrAppService } from './createArrAppService';
import { createArrAppRoutes } from './createArrAppRoutes';

const APP: ArrApp = {
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

const TEST = { isWorking: true, problem: null, problemCode: null, version: '5.14' };

const REFUSED = { refused: sayVerbatim('Nope') };

/**
 * The routes over a service that knows one app, and refuses what the test says.
 *
 * @param isRefusing - Whether choices and imports are refused.
 * @returns How to ask the routes.
 */
const aRoutes = (isRefusing = false) => {
  const known = (id: string) => id === APP.id;
  const apps: Parameters<typeof createArrAppRoutes>[0]['apps'] = {
    list: vi.fn(() => Promise.resolve([APP])),
    add: vi.fn(() => Promise.resolve(APP)),
    change: vi.fn((id: string) => Promise.resolve(known(id) ? APP : null)),
    remove: vi.fn((id: string) => Promise.resolve(known(id))),
    test: vi.fn((id: string) => Promise.resolve(known(id) ? TEST : null)),
    tryDraft: vi.fn(() => Promise.resolve(TEST)),
    choices: vi.fn<ArrAppService['choices']>((id) =>
      Promise.resolve(
        !known(id)
          ? null
          : isRefusing
            ? REFUSED
            : { rootFolders: [], qualityProfiles: [], metadataProfiles: [] },
      ),
    ),
    queue: vi.fn(() => Promise.resolve({ apps: [], items: [] })),
    importIndexers: vi.fn<ArrAppService['importIndexers']>((id) =>
      Promise.resolve(
        !known(id)
          ? null
          : isRefusing
            ? REFUSED
            : { added: 1, updated: 0, removed: 0, unchanged: 0 },
      ),
    ),
  };
  const routes = createArrAppRoutes({ apps });

  return {
    apps,
    ask: (path: string, method = 'GET', body?: object) =>
      routes.request(path, {
        method,
        ...(body === undefined
          ? {}
          : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }),
      }),
  };
};

const DRAFT = { name: 'Radarr', kind: 'radarr', url: 'http://radarr:7878', apiKey: 'k' };

describe('createArrAppRoutes', () => {
  it('lists, keeps, tries and reads the queues of apps', async () => {
    const { ask } = aRoutes();

    expect(await (await ask('/arr-apps')).json()).toEqual([APP]);
    expect((await ask('/arr-apps', 'POST', DRAFT)).status).toBe(201);
    expect((await ask('/arr-apps', 'POST', { name: '' })).status).toBe(400);
    expect(await (await ask('/arr-apps/try', 'POST', DRAFT)).json()).toEqual(TEST);
    expect((await ask('/arr-apps/try', 'POST', {})).status).toBe(400);
    expect(await (await ask('/arr-apps/queue')).json()).toEqual({ apps: [], items: [] });
  });

  it('changes, removes, tests and tries a kept app, or says there is none', async () => {
    const { ask } = aRoutes();
    const path = `/arr-apps/${APP.id}`;

    expect((await ask(path, 'PATCH', { name: 'Films' })).status).toBe(200);
    expect((await ask(path, 'PATCH', { name: 7 })).status).toBe(400);
    expect((await ask('/arr-apps/x', 'PATCH', { name: 'Films' })).status).toBe(404);
    expect((await ask(path, 'DELETE')).status).toBe(204);
    expect((await ask('/arr-apps/x', 'DELETE')).status).toBe(404);
    expect((await ask(`${path}/test`, 'POST')).status).toBe(200);
    expect((await ask('/arr-apps/x/test', 'POST')).status).toBe(404);
    expect((await ask(`${path}/try`, 'POST', DRAFT)).status).toBe(200);
    expect((await ask(`${path}/try`, 'POST', {})).status).toBe(400);
  });

  it('reads choices and imports indexers, passing on why not', async () => {
    const fine = aRoutes();
    const refusing = aRoutes(true);
    const path = `/arr-apps/${APP.id}`;

    expect((await fine.ask(`${path}/choices`)).status).toBe(200);
    expect((await fine.ask('/arr-apps/x/choices')).status).toBe(404);
    expect(await (await refusing.ask(`${path}/choices`)).json()).toMatchObject({ error: 'Nope' });
    expect(await (await fine.ask(`${path}/import-indexers`, 'POST')).json()).toMatchObject({
      added: 1,
    });
    expect((await fine.ask('/arr-apps/x/import-indexers', 'POST')).status).toBe(404);
    expect((await refusing.ask(`${path}/import-indexers`, 'POST')).status).toBe(400);
  });
});
