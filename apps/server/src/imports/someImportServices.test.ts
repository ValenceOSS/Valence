import { describe, expect, it } from 'vitest';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aLibraryToImportInto } from './aLibraryToImportInto';
import { someImportServices } from './someImportServices';

describe('someImportServices', { timeout: 60_000 }, () => {
  it('stands in for the services an import works with, remembering what they were asked', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const { services, asked } = someImportServices(db);
    const viewer = {
      kind: 'account' as const,
      accountId: 'account',
      profileId: 'pat',
      isAdministrator: false,
    };
    const made = await services.library.create({
      name: 'Elsewhere',
      kind: 'movies',
      path: '/nowhere',
    });
    const playlist = await services.playlists.create(viewer, { name: 'P' });

    expect(made).toBeNull();
    expect(
      (await services.library.list({ kind: 'server' })).map((library) => library.kind),
    ).toContain('shows');
    expect(playlist).not.toBeNull();
    expect(await services.playlists.update(viewer, 'missing', { isShared: true })).toBeNull();
    expect(await services.playlists.add(viewer, 'missing', ['x'])).toBeNull();
    expect(await services.playlists.drop(viewer, 'missing', 'x')).toBe(false);
    expect(await services.playlists.read(viewer, 'missing')).toBeNull();
    expect(await services.collections?.replaceEntries('missing', [])).toBe(false);
    expect(await services.jobs.cancel('job')).toBe(true);
    expect(services.jobs.isCancelled('job')).toBe(true);
    expect(services.jobs.readProgress('job')).toBeNull();
    services.log('hello');
    expect(asked.logged).toEqual(['hello']);
    await expect(
      services.fetch('http://x', { method: 'GET', headers: {}, signal: AbortSignal.timeout(10) }),
    ).rejects.toThrow();
  });
});
