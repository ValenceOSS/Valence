import { describe, expect, it } from 'vitest';
import { aScratchDatabase } from '#dialect/aScratchDatabase';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { createDatabaseArrAppStore } from './createDatabaseArrAppStore';

const MISSING = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

describe('createDatabaseArrAppStore', () => {
  it('keeps an app, and reads it back as it was given', async () => {
    const store = createDatabaseArrAppStore(await aScratchDatabase());
    const radarr = anArrApp();

    expect(await store.insert(radarr)).toEqual(radarr);
    expect(await store.list()).toEqual([radarr]);
    expect(await store.find(radarr.id)).toEqual(radarr);
    expect(await store.find(MISSING)).toBeNull();
  });

  it('changes only what it is told to, how it was last found included', async () => {
    const store = createDatabaseArrAppStore(await aScratchDatabase());
    const radarr = anArrApp();

    await store.insert(radarr);

    expect(
      await store.update(radarr.id, {
        isWorking: false,
        version: '5.14.0.9383',
        lastCheckedAt: '2026-10-01T00:00:00.000Z',
        lastProblem: { code: null, message: 'Radarr could not be reached', values: {} },
        lastProblemCode: 'ArrAppUnreachable',
        createdAt: '2026-09-29T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      }),
    ).toEqual({
      ...radarr,
      isWorking: false,
      version: '5.14.0.9383',
      lastCheckedAt: '2026-10-01T00:00:00.000Z',
      lastProblem: { code: null, message: 'Radarr could not be reached', values: {} },
      lastProblemCode: 'ArrAppUnreachable',
      createdAt: '2026-09-29T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    });
    expect(await store.update(radarr.id, { lastCheckedAt: null })).toMatchObject({
      lastCheckedAt: null,
    });
    expect(await store.update(MISSING, { isEnabled: false })).toBeNull();
  });

  it('keeps one that was checked before it was kept', async () => {
    const store = createDatabaseArrAppStore(await aScratchDatabase());
    const sonarr = anArrApp({
      kind: 'sonarr',
      name: 'Sonarr',
      lastCheckedAt: '2026-10-01T00:00:00.000Z',
      isWorking: true,
    });

    expect(await store.insert(sonarr)).toEqual(sonarr);
  });

  it('forgets an app, and says whether there was one', async () => {
    const store = createDatabaseArrAppStore(await aScratchDatabase());
    const radarr = anArrApp();

    await store.insert(radarr);

    expect(await store.remove(radarr.id)).toBe(true);
    expect(await store.remove(radarr.id)).toBe(false);
  });
});
