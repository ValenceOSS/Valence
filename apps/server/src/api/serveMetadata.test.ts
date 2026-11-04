import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { signUpForTest } from '@ValenceServer/auth/signUpForTest';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import type { TitleMetadataService } from '@ValenceServer/metadata/createTitleMetadataService';
import type { TitleListService } from '@ValenceServer/metadata/createTitleListService';
import type { TitleMetadata } from '@ValenceContracts/schemas/TitleEdit';

const BASE = 'http://localhost:8420';

const FILE = '00000000-0000-4000-8000-000000000001';

const CHANGE = '00000000-0000-4000-8000-0000000000c1';

const METADATA: TitleMetadata = {
  subject: { kind: 'film', key: 'movie:603', libraryId: 'lib', isMatched: true },
  fields: { title: { value: 'A film', source: 'catalogue', catalogue: 'A film' } },
};

/**
 * The app, with a metadata service and a title list that answer as a test sets them to.
 *
 * @returns The app and the parts a test steers.
 */
const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const titleMetadata = {
    read: vi.fn<TitleMetadataService['read']>(() => Promise.resolve(METADATA)),
    edit: vi.fn<TitleMetadataService['edit']>(() =>
      Promise.resolve({ changeSetId: CHANGE, metadata: METADATA }),
    ),
    history: vi.fn<TitleMetadataService['history']>(() => Promise.resolve({ changes: [] })),
    undo: vi.fn<TitleMetadataService['undo']>(() => Promise.resolve('changedSince' as const)),
    preview: vi.fn<TitleMetadataService['preview']>(() =>
      Promise.resolve('notInCatalogue' as const),
    ),
    carry: vi.fn<TitleMetadataService['carry']>(() => Promise.resolve({ changeSetId: null })),
    refreshFields: vi.fn<TitleMetadataService['refreshFields']>(() =>
      Promise.resolve({ updated: 2, metadata: METADATA }),
    ),
  } satisfies TitleMetadataService;
  const titleList = {
    list: vi.fn<TitleListService['list']>(() => Promise.resolve({ titles: [], next: null })),
    filesOf: vi.fn<TitleListService['filesOf']>(() => Promise.resolve(null)),
    values: vi.fn<TitleListService['values']>(() =>
      Promise.resolve({ values: [{ value: 'Drama', count: 2 }] }),
    ),
  } satisfies TitleListService;
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
    profiles: createMemoryProfileService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    titleMetadata,
    titleList,
  });

  return { app, auth, permissions, store, titleMetadata, titleList };
};

let built: ReturnType<typeof build>;

/**
 * Somebody signed in, who may edit metadata only where they are given leave to.
 *
 * @param mayEdit - Whether they are given leave.
 * @returns A way to ask the server as them.
 */
const signedIn = async (mayEdit: boolean) => {
  const cookie = await signUpForTest(built.app, built.auth, {
    name: 'Dan',
    email: 'dan@valence.local',
    password: 'a-long-password',
  });

  if (mayEdit) {
    built.permissions.state.overrides[built.store.user[0]?.id ?? ''] = [
      { permission: 'media.override', effect: 'allow' },
    ];
  }

  return (path: string, init: { method?: string; body?: object } = {}) =>
    built.app.request(`${BASE}${path}`, {
      method: init.method ?? 'GET',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
};

beforeEach(() => {
  built = build();
});

describe('serveMetadata', () => {
  it('keeps every metadata route to somebody given leave to edit it', async () => {
    const ask = await signedIn(false);

    expect((await ask(`/api/media/${FILE}/metadata`)).status).toBe(404);
    expect(
      (await ask(`/api/media/${FILE}/metadata`, { method: 'PATCH', body: { set: {} } })).status,
    ).toBe(404);
    expect((await ask('/api/admin/titles')).status).toBe(404);
    expect(built.titleMetadata.read).not.toHaveBeenCalled();
  });

  it('reads and edits a title, by the scope asked', async () => {
    const ask = await signedIn(true);

    expect(await (await ask(`/api/media/${FILE}/metadata?scope=season`)).json()).toEqual(METADATA);
    expect(built.titleMetadata.read).toHaveBeenCalledWith(FILE, 'season');

    const edited = await ask(`/api/media/${FILE}/metadata`, {
      method: 'PATCH',
      body: { set: { title: 'Mine' } },
    });

    expect(edited.status).toBe(200);
    expect(built.titleMetadata.edit).toHaveBeenCalledWith(
      FILE,
      'title',
      { set: { title: 'Mine' } },
      expect.objectContaining({ name: 'Dan' }),
    );
  });

  it('refuses a value its rule refuses, an undo of a field changed since, and an unknown entry', async () => {
    const ask = await signedIn(true);

    built.titleMetadata.edit.mockResolvedValueOnce('invalid');

    expect(
      (await ask(`/api/media/${FILE}/metadata`, { method: 'PATCH', body: { set: { title: '' } } }))
        .status,
    ).toBe(400);
    expect(
      (await ask(`/api/media/${FILE}/metadata/history/${CHANGE}/undo`, { method: 'POST' })).status,
    ).toBe(409);
    expect((await ask(`/api/media/${FILE}/match/preview?externalId=604&kind=movie`)).status).toBe(
      404,
    );
  });

  it('asks again for chosen fields, and lists the words in use', async () => {
    const ask = await signedIn(true);
    const refreshed = await ask(`/api/media/${FILE}/refresh`, {
      method: 'POST',
      body: { mode: 'fields', fields: ['rating'] },
    });

    expect(await refreshed.json()).toEqual({ corrected: 2, jobId: null });
    expect(built.titleMetadata.refreshFields).toHaveBeenCalledWith(FILE, ['rating']);
    expect(await (await ask('/api/admin/titles/values?field=genres')).json()).toEqual({
      values: [{ value: 'Drama', count: 2 }],
    });
    expect((await ask(`/api/admin/titles/${FILE}`)).status).toBe(404);
  });
});
