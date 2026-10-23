import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { makeAdministrator, signUpForTest, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { BucketListSchema } from '@ValenceContracts/schemas/Bucket';
import type { BucketMounts } from '@ValenceServer/buckets/BucketMounts';

const CHANGE = {
  name: 'Films',
  provider: 'AWS',
  endpoint: '',
  region: 'eu-west-2',
  bucket: 'media',
  prefix: '',
  accessKeyId: 'key',
  secretAccessKey: 'secret',
};

const build = async (libraryPath = '/media/films') => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const apply = vi.fn<BucketMounts['apply']>(() => Promise.resolve());
  const test = vi.fn<BucketMounts['test']>(() =>
    Promise.resolve({ kind: 'reached', folders: ['Films'] }),
  );
  const buckets: BucketMounts = {
    canMount: () => Promise.resolve(true),
    apply,
    stateOf: () => ({ state: 'mounted' }),
    pathOf: (id) => `/buckets/${id}`,
    test,
  };

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({
      libraries: [
        {
          id: '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f',
          name: 'Films',
          kind: 'movies',
          path: libraryPath,
          itemCount: 0,
          lastScannedAt: null,
          defaultAudioLanguage: null,
          filesAtOnce: null,
          takesRequests: true,
          requestProfileId: null,
          requestPath: null,
          keepsShowsTogether: true,
          higherProfileAsks: 'ask',
        },
      ],
      media: [],
    }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    buckets,
  });

  const session = await signUpForTest(app, auth);
  const account = store.user[0];

  if (account !== undefined) {
    account.role = 'admin';
    await makeAdministrator(permissions, account.id);
  }

  const ask = (path: string, init: RequestInit = {}) =>
    app.request(`${TEST_ORIGIN}${path}`, {
      ...init,
      headers: { origin: TEST_ORIGIN, 'content-type': 'application/json', cookie: session },
    });

  return { ask, apply, test, settings };
};

describe('buckets over HTTP', () => {
  it('adds a bucket, mounts it, and never sends its secret back', async () => {
    const { ask, apply } = await build();
    const added = await ask('/api/admin/buckets', { method: 'POST', body: JSON.stringify(CHANGE) });
    const body = await added.text();

    expect(added.status).toBe(200);
    expect(body).not.toContain('secret');
    expect(BucketListSchema.parse(JSON.parse(body)).buckets).toMatchObject([
      { id: 'films', path: '/buckets/films', status: { state: 'mounted' } },
    ]);
    expect(apply).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'films', secretAccessKey: 'secret' }),
    ]);
  });

  it('keeps the saved secret where a change leaves it empty', async () => {
    const { ask, apply } = await build();

    await ask('/api/admin/buckets', { method: 'POST', body: JSON.stringify(CHANGE) });
    await ask('/api/admin/buckets/films', {
      method: 'PUT',
      body: JSON.stringify({ ...CHANGE, prefix: 'films', secretAccessKey: '' }),
    });

    expect(apply).toHaveBeenLastCalledWith([
      expect.objectContaining({ prefix: 'films', secretAccessKey: 'secret' }),
    ]);
  });

  it('refuses a new bucket with no secret', async () => {
    const { ask } = await build();
    const added = await ask('/api/admin/buckets', {
      method: 'POST',
      body: JSON.stringify({ ...CHANGE, secretAccessKey: '' }),
    });

    expect(added.status).toBe(400);
  });

  it('will not remove a bucket a library still reads from', async () => {
    const { ask } = await build('/buckets/films/Movies');

    await ask('/api/admin/buckets', { method: 'POST', body: JSON.stringify(CHANGE) });

    expect((await ask('/api/admin/buckets/films', { method: 'DELETE' })).status).toBe(409);
  });

  it('removes a bucket nothing reads from', async () => {
    const { ask, apply } = await build();

    await ask('/api/admin/buckets', { method: 'POST', body: JSON.stringify(CHANGE) });

    expect((await ask('/api/admin/buckets/films', { method: 'DELETE' })).status).toBe(200);
    expect(apply).toHaveBeenLastCalledWith([]);
  });

  it('tries a bucket with the saved secret where none was typed', async () => {
    const { ask, test } = await build();

    await ask('/api/admin/buckets', { method: 'POST', body: JSON.stringify(CHANGE) });

    const tried = await ask('/api/admin/buckets/test?id=films', {
      method: 'POST',
      body: JSON.stringify({ ...CHANGE, secretAccessKey: '' }),
    });

    expect(tried.status).toBe(200);
    expect(test).toHaveBeenCalledWith(expect.objectContaining({ secretAccessKey: 'secret' }));
  });
});
