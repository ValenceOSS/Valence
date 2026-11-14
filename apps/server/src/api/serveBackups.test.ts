import { describe, expect, it } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import type { BackupService } from '@ValenceServer/backups/BackupService';
import type { Permission } from '@ValenceContracts/schemas/Permission';

const BACKUPS: BackupService = {
  list: () =>
    Promise.resolve({
      backups: [],
      folder: '/backups',
      tool: 'pg_dump',
      isToolInstalled: true,
      kept: 7,
      restoreCommand: 'pg_restore',
    }),
  take: () => Promise.resolve('missing'),
  remove: () => Promise.resolve(false),
  fileOf: () => Promise.resolve(null),
};

/**
 * Signs somebody into a server keeping backups, holding exactly the permissions named.
 *
 * @param granted - What their role allows.
 * @returns A way to ask the server as them.
 */
const signedInWith = async (granted: readonly Permission[]) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    backups: BACKUPS,
  });
  const cookie = await signUpForTest(app, auth);
  const role = await permissions.createRole({
    name: 'Purpose-made',
    position: 50,
    color: null,
    permissions: [...granted],
  });

  await permissions.assignRole(store.user[0]?.id ?? '', role.id);

  return (path: string, method = 'GET') =>
    app.request(`${TEST_ORIGIN}${path}`, { method, headers: { cookie, origin: TEST_ORIGIN } });
};

describe('serveBackups', () => {
  it('keeps every backup route from somebody who may only change settings', async () => {
    const ask = await signedInWith(['server.settings']);

    expect((await ask('/api/admin/backups')).status).toBe(403);
    expect((await ask('/api/admin/backups', 'POST')).status).toBe(403);
    expect((await ask('/api/admin/backups/a.dump')).status).toBe(403);
    expect((await ask('/api/admin/backups/a.dump', 'DELETE')).status).toBe(403);
  });

  it('lets somebody who may back the server up list, take and remove copies', async () => {
    const ask = await signedInWith(['server.backup']);

    expect((await ask('/api/admin/backups')).status).toBe(200);
    expect((await ask('/api/admin/backups', 'POST')).status).toBe(503);
    expect((await ask('/api/admin/backups/a.dump', 'DELETE')).status).toBe(404);
  });

  it('hands a copy of the whole database only to an administrator', async () => {
    expect(
      (await (await signedInWith(['server.backup']))('/api/admin/backups/a.dump')).status,
    ).toBe(403);
    expect(
      (await (await signedInWith(['administrator']))('/api/admin/backups/a.dump')).status,
    ).toBe(404);
  });
});
