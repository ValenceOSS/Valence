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
import type { BulkTitleEditor } from '@ValenceServer/metadata/createBulkTitleEditor';
import type { OrphanedEditsService } from '@ValenceServer/metadata/createOrphanedEdits';
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
    noteCatalogueChanges: vi.fn<TitleMetadataService['noteCatalogueChanges']>(() =>
      Promise.resolve(0),
    ),
  } satisfies TitleMetadataService;
  const titleList = {
    list: vi.fn<TitleListService['list']>(() =>
      Promise.resolve({
        titles: [],
        next: null,
        total: 0,
        counts: { all: 0, look: 0, twice: 0, unreadable: 0, edited: 0 },
      }),
    ),
    keys: vi.fn<TitleListService['keys']>(() => Promise.resolve({ titles: [] })),
    choices: vi.fn<TitleListService['choices']>(() => Promise.resolve({ filters: [] })),
    problems: vi.fn<TitleListService['problems']>(() =>
      Promise.resolve({ libraries: [{ libraryId: 'lib', titles: 1 }] }),
    ),
    subjects: vi.fn<TitleListService['subjects']>(() => Promise.resolve([])),
    filesOf: vi.fn<TitleListService['filesOf']>(() => Promise.resolve(null)),
    values: vi.fn<TitleListService['values']>(() =>
      Promise.resolve({ values: [{ value: 'Drama', count: 2 }] }),
    ),
  } satisfies TitleListService;
  const bulkTitles = {
    readMany: vi.fn<BulkTitleEditor['readMany']>(() => Promise.resolve({ titles: 2, fields: {} })),
    editMany: vi.fn<BulkTitleEditor['editMany']>(() =>
      Promise.resolve({
        changeSetId: CHANGE,
        changed: [{ mediaId: FILE, scope: 'title' as const }],
        unchanged: 0,
        refused: 0,
        subjects: ['movie:603'],
      }),
    ),
    undoMany: vi.fn<BulkTitleEditor['undoMany']>(() => Promise.resolve('changedSince' as const)),
  } satisfies BulkTitleEditor;
  const orphanedEdits = {
    list: vi.fn<OrphanedEditsService['list']>(() => Promise.resolve({ orphans: [] })),
    attach: vi.fn<OrphanedEditsService['attach']>(() => Promise.resolve(null)),
    throwAway: vi.fn<OrphanedEditsService['throwAway']>(() => Promise.resolve(2)),
  } satisfies OrphanedEditsService;
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
    bulkTitles,
    orphanedEdits,
    findCataloguePeople: (name) =>
      Promise.resolve([{ personId: 7, name, imageUrl: null, knownFor: null }]),
  });

  return { app, auth, permissions, store, titleMetadata, titleList, bulkTitles };
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
    expect((await ask('/api/admin/titles?libraryId=lib')).status).toBe(404);
    expect(built.titleMetadata.read).not.toHaveBeenCalled();
  });

  it('exports a library’s titles as a spreadsheet, filtered as the list is', async () => {
    const ask = await signedIn(true);
    const sheet = await ask(
      '/api/admin/titles/export?libraryId=lib&filter=genre:Drama&filter=tag:x',
    );

    expect(sheet.status).toBe(200);
    expect(sheet.headers.get('content-type')).toContain('text/csv');
    expect(sheet.headers.get('content-disposition')).toContain('attachment');
    expect(built.titleList.list.mock.calls[0]?.[0]).toMatchObject({
      libraryId: 'lib',
      filter: ['genre:Drama', 'tag:x'],
    });
    expect((await sheet.text()).split('\r\n')[0]).toContain('kind,title');
  });

  it('finds people in the catalogue by name, for somebody given leave', async () => {
    const ask = await signedIn(true);
    const found = await ask('/api/admin/titles/people?name=An%20actor');

    expect(found.status).toBe(200);
    expect(await found.json()).toEqual({
      people: [{ personId: 7, name: 'An actor', imageUrl: null, knownFor: null }],
    });
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

  it('lists a library’s titles as asked, every title of a listing, its filters and its problems', async () => {
    const ask = await signedIn(true);

    expect(
      (await ask('/api/admin/titles?libraryId=lib&sort=size&desc=true&filter=genre:Crime')).status,
    ).toBe(200);
    expect(built.titleList.list).toHaveBeenCalledWith(
      {
        libraryId: 'lib',
        sort: 'size',
        desc: true,
        show: 'all',
        filter: ['genre:Crime'],
      },
      undefined,
      100,
    );
    expect((await ask('/api/admin/titles/keys?libraryId=lib&show=look')).status).toBe(200);
    expect((await ask('/api/admin/titles/choices?libraryId=lib')).status).toBe(200);
    expect(await (await ask('/api/admin/titles/problems')).json()).toEqual({
      libraries: [{ libraryId: 'lib', titles: 1 }],
    });
  });

  it('edits many titles as one change, without saying which subjects it reached', async () => {
    const ask = await signedIn(true);
    const edited = await ask('/api/admin/titles/bulk', {
      method: 'POST',
      body: { targets: [{ mediaId: FILE, scope: 'title' }], change: { lockAll: true } },
    });

    expect(await edited.json()).toEqual({
      changeSetId: CHANGE,
      changed: [{ mediaId: FILE, scope: 'title' }],
      unchanged: 0,
      refused: 0,
    });
    expect(
      (
        await ask('/api/admin/titles/bulk/read', {
          method: 'POST',
          body: { targets: [{ mediaId: FILE, scope: 'title' }] },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await ask('/api/admin/titles/bulk/undo', {
          method: 'POST',
          body: { changeSetId: CHANGE, targets: [{ mediaId: FILE, scope: 'title' }] },
        })
      ).status,
    ).toBe(409);
  });

  it('lists the edits of titles gone, refuses to attach them to a title not there, and throws them away', async () => {
    const ask = await signedIn(true);

    expect(await (await ask('/api/admin/titles/orphans?libraryId=lib')).json()).toEqual({
      orphans: [],
    });
    expect(
      (
        await ask('/api/admin/titles/orphans/attach', {
          method: 'POST',
          body: { libraryId: 'lib', key: 'movie:9', toId: 'nothing' },
        })
      ).status,
    ).toBe(404);
    expect(
      await (
        await ask('/api/admin/titles/orphans/forget', {
          method: 'POST',
          body: { libraryId: 'lib', key: 'movie:9' },
        })
      ).json(),
    ).toEqual({ edits: 2 });
  });
});
