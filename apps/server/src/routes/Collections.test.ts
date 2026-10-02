import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import type { Collection } from '@ValenceContracts/schemas/Collection';
import type { CollectionService } from '@ValenceServer/collections/CollectionService';

const BASE = 'http://localhost:8420';

const SAGA = '00000000-0000-4000-8000-00000000c011';

const ENTRY = '00000000-0000-4000-8000-00000000e001';

const FILM = '00000000-0000-4000-8000-00000000f001';

const COLLECTION: Collection = {
  id: SAGA,
  name: 'Saga',
  description: null,
  isOrdered: true,
  hasOwnArtwork: false,
  entryCount: 0,
  coverMediaIds: [],
  updatedAt: '2026-10-02T00:00:00.000Z',
};

/**
 * A collection service answering every question the same way, with each call recorded.
 *
 * @returns The service.
 */
const aCollectionService = () =>
  ({
    list: vi.fn<CollectionService['list']>(() => Promise.resolve([COLLECTION])),
    get: vi.fn<CollectionService['get']>(() =>
      Promise.resolve({ collection: COLLECTION, entries: [] }),
    ),
    create: vi.fn<CollectionService['create']>(() => Promise.resolve(COLLECTION)),
    update: vi.fn<CollectionService['update']>(() => Promise.resolve(null)),
    remove: vi.fn<CollectionService['remove']>(() => Promise.resolve(true)),
    replaceEntries: vi.fn<CollectionService['replaceEntries']>(() => Promise.resolve(true)),
    add: vi.fn<CollectionService['add']>(() => Promise.resolve(1)),
    move: vi.fn<CollectionService['move']>(() => Promise.resolve(true)),
    drop: vi.fn<CollectionService['drop']>(() => Promise.resolve(false)),
    readArtwork: vi.fn<CollectionService['readArtwork']>(() => Promise.resolve(null)),
    saveArtwork: vi.fn<CollectionService['saveArtwork']>(() => Promise.resolve(null)),
    dropArtwork: vi.fn<CollectionService['dropArtwork']>(() => Promise.resolve(true)),
  }) satisfies CollectionService;

/**
 * The server with a stand-in collection service, and somebody signed in to it.
 *
 * @param mayEditLibraries - Whether they may edit libraries, and so change collections.
 * @returns How to ask it things, and the service behind it.
 */
const aServer = async (mayEditLibraries: boolean) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const collections = aCollectionService();
  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({ libraries: [], media: [] }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    profiles: createMemoryProfileService(),
    collections,
  });
  const cookie = await signUpForTest(app);
  const userId = store.user[0]?.id ?? '';

  if (mayEditLibraries) {
    await permissions.setOverride(userId, { permission: 'library.edit', effect: 'allow' });
  }

  const ask = (path: string, init: RequestInit = {}, isSignedIn = true) =>
    Promise.resolve(
      app.request(`${BASE}${path}`, {
        ...init,
        headers: {
          origin: BASE,
          'content-type': 'application/json',
          ...(isSignedIn ? { cookie } : {}),
        },
      }),
    );

  return { ask, collections, userId };
};

describe('collections over HTTP', () => {
  it('reads nothing to somebody who is not signed in', async () => {
    const { ask } = await aServer(false);

    expect((await ask('/api/collections', {}, false)).status).toBe(401);
    expect((await ask(`/api/collections/${SAGA}`, {}, false)).status).toBe(401);
  });

  it('lists the collections for anybody signed in, without the empty ones unless they look after them', async () => {
    const { ask, collections } = await aServer(false);

    const response = await ask(`/api/collections?mediaId=${FILM}&withEmpty=true`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ collections: [COLLECTION] });
    expect(collections.list.mock.calls[0]?.[1]).toEqual({
      containing: { mediaItemId: FILM },
      withEmpty: false,
    });
  });

  it('shows the empty ones to somebody who may edit libraries', async () => {
    const { ask, collections } = await aServer(true);

    await ask('/api/collections?withEmpty=true');

    expect(collections.list.mock.calls[0]?.[1]).toEqual({ withEmpty: true });
  });

  it('reads one collection, and says when there is no such thing', async () => {
    const { ask, collections } = await aServer(false);

    expect((await ask(`/api/collections/${SAGA}`)).status).toBe(200);

    collections.get.mockResolvedValueOnce(null);

    expect((await ask(`/api/collections/${SAGA}`)).status).toBe(404);
  });

  it('lets only somebody who may edit libraries make one', async () => {
    const refused = await aServer(false);
    const body = JSON.stringify({ name: 'Saga', entries: [{ mediaItemId: FILM }] });

    expect((await refused.ask('/api/collections', { method: 'POST', body })).status).toBe(403);
    expect(refused.collections.create).not.toHaveBeenCalled();

    const allowed = await aServer(true);
    const made = await allowed.ask('/api/collections', { method: 'POST', body });

    expect(made.status).toBe(201);
    expect(allowed.collections.create).toHaveBeenCalledWith({
      name: 'Saga',
      description: null,
      entries: [{ mediaItemId: FILM }],
      createdBy: allowed.userId,
    });
  });

  it('refuses every change to somebody who may not edit libraries', async () => {
    const { ask, collections } = await aServer(false);

    expect(
      (
        await ask(`/api/collections/${SAGA}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Trilogy' }),
        })
      ).status,
    ).toBe(403);
    expect((await ask(`/api/collections/${SAGA}`, { method: 'DELETE' })).status).toBe(403);
    expect((await ask(`/api/collections/${SAGA}/artwork`, { method: 'DELETE' })).status).toBe(403);
    expect(collections.update).not.toHaveBeenCalled();
    expect(collections.remove).not.toHaveBeenCalled();
  });

  it('changes a collection, and says when there was none to change', async () => {
    const { ask } = await aServer(true);

    expect(
      (
        await ask(`/api/collections/${SAGA}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Trilogy' }),
        })
      ).status,
    ).toBe(404);
    expect((await ask(`/api/collections/${SAGA}`, { method: 'DELETE' })).status).toBe(204);
  });

  it('adds, replaces, moves and takes out entries', async () => {
    const { ask, collections } = await aServer(true);
    const entries = JSON.stringify({ entries: [{ seriesId: FILM }] });

    const added = await ask(`/api/collections/${SAGA}/entries`, { method: 'POST', body: entries });

    expect(await added.json()).toEqual({ added: 1 });
    expect(
      (await ask(`/api/collections/${SAGA}/entries`, { method: 'PUT', body: entries })).status,
    ).toBe(204);
    expect(collections.replaceEntries).toHaveBeenCalledWith(SAGA, [{ seriesId: FILM }]);
    expect(
      (
        await ask(`/api/collections/${SAGA}/entries/${ENTRY}`, {
          method: 'PATCH',
          body: JSON.stringify({ afterEntryId: null }),
        })
      ).status,
    ).toBe(204);
    expect(
      (await ask(`/api/collections/${SAGA}/entries/${ENTRY}`, { method: 'DELETE' })).status,
    ).toBe(404);
  });

  it('says a collection has no artwork of its own', async () => {
    const { ask } = await aServer(false);

    expect((await ask(`/api/collections/${SAGA}/artwork`)).status).toBe(404);
  });

  it('serves artwork a collection has', async () => {
    const { ask, collections } = await aServer(false);

    collections.readArtwork.mockResolvedValueOnce({
      body: new Uint8Array([1, 2, 3]),
      contentType: 'image/png',
    });

    const response = await ask(`/api/collections/${SAGA}/artwork?v=1`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
  });

  it('keeps artwork for a collection that is there, and turns it away for one that is not', async () => {
    const { ask, collections } = await aServer(true);

    expect(
      (await ask(`/api/collections/${SAGA}/artwork`, { method: 'PUT', body: 'picture' })).status,
    ).toBe(204);

    collections.saveArtwork.mockResolvedValueOnce('missing');

    expect(
      (await ask(`/api/collections/${SAGA}/artwork`, { method: 'PUT', body: 'picture' })).status,
    ).toBe(404);

    collections.saveArtwork.mockResolvedValueOnce('notAPicture');

    expect(
      (await ask(`/api/collections/${SAGA}/artwork`, { method: 'PUT', body: 'picture' })).status,
    ).toBe(400);
  });
});
