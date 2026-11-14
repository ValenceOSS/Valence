import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
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
import { aLibraryAt } from '@ValenceServer/files/aLibraryAt';
import { jobDefinitionsFor } from '@ValenceServer/jobs/jobDefinitions';
import { z } from 'zod';
import { LibrarySchema } from '@ValenceContracts/schemas/Library';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { ArtworkKind } from '@ValenceContracts/schemas/ArtworkChoice';
import type { LibraryService } from '@ValenceServer/library/LibraryService';

const LibraryListSchema = z.array(LibrarySchema);

const MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';
const ON_DISK = 'valence-disk:L2ZpbG1zL3Bvc3Rlci5qcGc';

type Upload = NonNullable<LibraryService['uploadArtwork']>;

/**
 * An application whose library takes uploaded artwork, answering each upload as told.
 *
 * @param answer - What the library says to an upload.
 * @returns A way to ask the application, and what the library was asked.
 */
const build = async (
  answer: Awaited<ReturnType<Upload>> = { jobId: null },
  serverFolders: readonly string[] = [],
  libraries: Library[] = [],
  grants: readonly Permission[] = ['library.create'],
) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const uploadArtwork = vi.fn(
    (_mediaId: string, _kind: ArtworkKind, _artwork: { body: Uint8Array; contentType: string }) =>
      Promise.resolve(answer),
  );
  const chooseVersion = vi.fn(
    (mediaId: string, _choice: { label?: string | null; isStanding?: boolean }) =>
      Promise.resolve(mediaId === MEDIA_ID),
  );
  const pinEpisode = vi.fn(
    (
      _mediaId: string,
      _pin: { seasonNumber: number; episodeNumber: number; episodeNumberEnd: number | null } | null,
    ) => Promise.resolve({ corrected: 1, jobId: 'job' }),
  );
  const chooseSeasonSource = vi.fn(
    (_mediaId: string, source: { externalId: string; externalSeason: number } | null) =>
      Promise.resolve(
        source?.externalSeason === 9
          ? ('noSuchSeason' as const)
          : source?.externalId === '500'
            ? ('catalogueUnavailable' as const)
            : { corrected: 6, jobId: 'job' },
      ),
  );
  const listItemsAcross = vi.fn(
    (_viewer: object, _libraryIds: readonly string[], _options: object) =>
      Promise.resolve({ items: [], total: 7 }),
  );
  const readImage = vi.fn((_url: string, _width?: number) =>
    Promise.resolve({ body: new TextEncoder().encode('picture').buffer, contentType: 'image/png' }),
  );
  const app = createApp({
    auth,
    settings,
    permissions,
    requests: null,
    requestsClient: null,
    jobDefinitions: jobDefinitionsFor(false),
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: {
      ...createMemoryLibraryService({ libraries, media: [] }),
      uploadArtwork,
      listItemsAcross,
      isOwnArtwork: (_mediaId, url) => Promise.resolve(url === ON_DISK),
      chooseVersion,
      pinEpisode,
      chooseExtra: (_mediaId, choice) =>
        Promise.resolve(
          choice.extraKind !== null && choice.parentId === null
            ? null
            : { corrected: 1, jobId: 'job' },
        ),
      chooseEpisodeOrder: (mediaId, order) =>
        Promise.resolve(
          mediaId === MEDIA_ID && order !== 'gone' ? { corrected: 4, jobId: 'job' } : null,
        ),
      readEpisodeOrders: () =>
        Promise.resolve({ orders: [{ id: 'dvd', name: 'DVD', type: 3 }], chosen: null }),
      readSeasonSource: (mediaId) =>
        Promise.resolve(
          mediaId === MEDIA_ID
            ? {
                source: { externalId: '900', externalSeason: 1, title: 'Revival', year: 2026 },
                canChoose: true,
              }
            : { source: null, canChoose: false },
        ),
      chooseSeasonSource,
      readCatalogueSeasons: (externalId) =>
        Promise.resolve(
          externalId === '900'
            ? { seasons: [{ seasonNumber: 1, name: null, episodeCount: 6, airDate: '2026-09-04' }] }
            : null,
        ),
    },
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    readImage,
    serverFolders,
  });
  const cookie = await signUpForTest(app, auth);

  permissions.state.overrides[store.user[0]?.id ?? ''] = [
    { permission: 'media.override', effect: 'allow' },
    ...grants.map((permission) => ({ permission, effect: 'allow' as const })),
  ];
  const ask = (path: string, init: RequestInit = {}) =>
    app.request(`${TEST_ORIGIN}${path}`, {
      ...init,
      headers: { cookie, origin: TEST_ORIGIN, ...init.headers },
    });

  return {
    ask,
    uploadArtwork,
    readImage,
    chooseVersion,
    pinEpisode,
    chooseSeasonSource,
    listItemsAcross,
  };
};

describe('serveLibrary', () => {
  it('shows where each library is on the machine only to somebody who may change libraries', async () => {
    const films = { ...aLibraryAt('/mnt/nas/films'), requestPath: '/mnt/nas/requested' };
    const plain = await build({ jobId: null }, [], [films], []);
    const shown = LibraryListSchema.parse(await (await plain.ask('/api/libraries')).json());

    expect(shown.map((one) => [one.path, one.requestPath])).toEqual([['/', null]]);

    const editor = await build({ jobId: null }, [], [films], ['library.edit']);
    const full = LibraryListSchema.parse(await (await editor.ask('/api/libraries')).json());

    expect(full.map((one) => [one.path, one.requestPath])).toEqual([
      ['/mnt/nas/films', '/mnt/nas/requested'],
    ]);
  });

  it('refuses a library on a folder the server keeps its own data in, or one that holds it', async () => {
    const root = await mkdtemp(join(tmpdir(), 'valence-library-'));

    await mkdir(join(root, 'config', 'backups'), { recursive: true });
    await mkdir(join(root, 'media'));

    const { ask } = await build({ jobId: null }, [join(root, 'config', 'backups')]);
    const adding = (path: string) =>
      ask('/api/libraries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Films', kind: 'movies', path }),
      });

    expect((await adding(join(root, 'config', 'backups'))).status).toBe(400);
    expect((await adding(root)).status).toBe(400);
    expect((await adding(join(root, 'media'))).status).toBe(201);
    await rm(root, { recursive: true, force: true });
  });

  it('refuses a request folder on a folder the server keeps its own data in, or one that holds it', async () => {
    const root = await mkdtemp(join(tmpdir(), 'valence-library-'));

    await mkdir(join(root, 'config', 'backups'), { recursive: true });
    await mkdir(join(root, 'media'));

    const films = aLibraryAt(join(root, 'media'));
    const { ask } = await build(
      { jobId: null },
      [join(root, 'config', 'backups')],
      [films],
      ['library.edit'],
    );
    const choosing = (requestPath: string) =>
      ask(`/api/libraries/${films.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ defaultAudioLanguage: null, requestPath }),
      });
    const refusedFor = async (requestPath: string) =>
      z.object({ code: z.string() }).parse(await (await choosing(requestPath)).json()).code;

    expect(await refusedFor(join(root, 'config', 'backups'))).toBe(
      'error.library.thatPathIsNotAReadable',
    );
    expect(await refusedFor(root)).toBe('error.library.thatPathIsNotAReadable');
    expect((await choosing(join(root, 'media'))).status).toBe(200);
    await rm(root, { recursive: true, force: true });
  });

  it('reads every library asked for in one request, counted unless told not to', async () => {
    const { ask, listItemsAcross } = await build();
    const counted = await ask('/api/library-items?libraryIds=films,shows&limit=5&order=rated');

    expect(counted.status).toBe(200);
    expect(await counted.json()).toEqual({ items: [], total: 7 });
    expect(listItemsAcross.mock.calls[0]?.[1]).toEqual(['films', 'shows']);
    expect(listItemsAcross.mock.calls[0]?.[2]).toMatchObject({
      limit: 5,
      offset: 0,
      order: 'rated',
      counted: true,
    });

    await ask('/api/library-items?libraryIds=films&counted=no');

    expect(listItemsAcross.mock.calls[1]?.[2]).toMatchObject({ counted: false });
  });

  it('serves the front page’s shelves a page at a time, with nothing past the end of nothing', async () => {
    const { ask } = await build();
    const response = await ask('/api/home-shelves?libraryIds=films,shows&count=5');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ shelves: [], cursor: null });
  });

  it('turns away a page of shelves asked for too many at once', async () => {
    const { ask } = await build();

    expect((await ask('/api/home-shelves?libraryIds=films&count=500')).status).toBe(400);
  });

  it('keeps an uploaded poster for a title, saying who chose it', async () => {
    const { ask, uploadArtwork } = await build();
    const response = await ask(`/api/media/${MEDIA_ID}/artwork/poster/upload`, {
      method: 'PUT',
      headers: { 'content-type': 'image/png' },
      body: new Uint8Array([1, 2, 3]),
    });

    expect(response.status).toBe(200);
    expect(uploadArtwork.mock.calls[0]?.[1]).toBe('poster');
    expect(uploadArtwork.mock.calls[0]?.[2].contentType).toBe('image/png');
  });

  it('turns away a kind of picture a title cannot have', async () => {
    const { ask, uploadArtwork } = await build();
    const response = await ask(`/api/media/${MEDIA_ID}/artwork/banner/upload`, {
      method: 'PUT',
      body: new Uint8Array([1]),
    });

    expect(response.status).toBe(404);
    expect(uploadArtwork).not.toHaveBeenCalled();
  });

  it('says what is wrong with a picture it would not keep', async () => {
    const { ask } = await build({ fault: 'notAPicture' });
    const response = await ask(`/api/media/${MEDIA_ID}/artwork/poster/upload`, {
      method: 'PUT',
      body: new Uint8Array([1]),
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('shows a picture beside the title’s files, and nothing else on the disk', async () => {
    const { ask, readImage } = await build();
    const own = await ask(
      `/api/media/${MEDIA_ID}/artwork/picture?url=${encodeURIComponent(ON_DISK)}`,
    );
    const other = await ask(
      `/api/media/${MEDIA_ID}/artwork/picture?url=${encodeURIComponent('valence-disk:L2V0Yy9wYXNzd2Q')}`,
    );

    expect(own.status).toBe(200);
    expect(other.status).toBe(404);
    expect(readImage).toHaveBeenCalledTimes(1);
  });

  it('names a version, or makes it play by default, and says when there is no such version', async () => {
    const { ask, chooseVersion } = await build();
    const put = (id: string, body: object) =>
      ask(`/api/media/${id}/version`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

    expect((await put(MEDIA_ID, { label: 'Extended', isStanding: true })).status).toBe(204);
    expect(chooseVersion).toHaveBeenCalledWith(MEDIA_ID, { label: 'Extended', isStanding: true });
    expect((await put('another', { label: 'x' })).status).toBe(404);
    expect((await put(MEDIA_ID, { label: 'x'.repeat(65) })).status).toBe(400);
  });

  it('says which episode a file is, refusing numbers that cannot be', async () => {
    const { ask, pinEpisode } = await build();
    const put = (body: object) =>
      ask(`/api/media/${MEDIA_ID}/episode-pin`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

    const pin = { seasonNumber: 1, episodeNumber: 2, episodeNumberEnd: 3 };

    expect((await put({ pin })).status).toBe(200);
    expect(pinEpisode).toHaveBeenCalledWith(MEDIA_ID, pin);
    expect((await put({ pin: { ...pin, episodeNumberEnd: 1 } })).status).toBe(400);
    expect((await put({ pin: null })).status).toBe(200);
  });

  it('lists a show’s episode orders, and chooses one', async () => {
    const { ask } = await build();
    const listed = await ask(`/api/media/${MEDIA_ID}/episode-orders`);
    const chosen = await ask(`/api/media/${MEDIA_ID}/episode-order`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ order: '5b6f1a2c3d4e5f6a7b8c9d0e' }),
    });
    const steered = await ask(`/api/media/${MEDIA_ID}/episode-order`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ order: '../../person/popular' }),
    });

    expect(await listed.json()).toEqual({
      orders: [{ id: 'dvd', name: 'DVD', type: 3 }],
      chosen: null,
    });
    expect(await chosen.json()).toEqual({ corrected: 4, jobId: 'job' });
    expect(steered.status).toBe(400);
  });

  it('says which show a season is read from, and lists the seasons a show has', async () => {
    const { ask } = await build();

    expect(await (await ask(`/api/media/${MEDIA_ID}/season-source`)).json()).toEqual({
      source: { externalId: '900', externalSeason: 1, title: 'Revival', year: 2026 },
      canChoose: true,
    });
    expect(await (await ask('/api/media/other/season-source')).json()).toEqual({
      source: null,
      canChoose: false,
    });
    expect(
      await (await ask(`/api/media/${MEDIA_ID}/season-source/seasons?show=900`)).json(),
    ).toEqual({
      seasons: [{ seasonNumber: 1, name: null, episodeCount: 6, airDate: '2026-09-04' }],
    });
    expect((await ask(`/api/media/${MEDIA_ID}/season-source/seasons?show=1`)).status).toBe(404);
    expect((await ask(`/api/media/${MEDIA_ID}/season-source/seasons?show=x`)).status).toBe(400);
  });

  it('reads a season from another show, refusing a season that show does not have', async () => {
    const { ask, chooseSeasonSource } = await build();
    const put = (body: object) =>
      ask(`/api/media/${MEDIA_ID}/season-source`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

    const answer = await put({ source: { externalId: '900', externalSeason: 1 } });

    expect(answer.status).toBe(200);
    expect(await answer.json()).toEqual({ corrected: 6, jobId: 'job' });
    expect(chooseSeasonSource).toHaveBeenCalledWith(MEDIA_ID, {
      externalId: '900',
      externalSeason: 1,
    });
    expect((await put({ source: { externalId: '900', externalSeason: 9 } })).status).toBe(400);
    expect((await put({ source: { externalId: 'not an id', externalSeason: 1 } })).status).toBe(
      400,
    );
    expect((await put({ source: { externalId: '500', externalSeason: 1 } })).status).toBe(502);
    expect((await put({ source: null })).status).toBe(200);
    expect(chooseSeasonSource).toHaveBeenLastCalledWith(MEDIA_ID, null);
  });

  it('marks a file an extra of a title, or not an extra, refusing a kind it does not know', async () => {
    const { ask } = await build();
    const put = (body: object) =>
      ask(`/api/media/${MEDIA_ID}/extra`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

    expect((await put({ extraKind: 'trailer', parentId: 'film' })).status).toBe(200);
    expect((await put({ extraKind: null, parentId: null, isForgotten: true })).status).toBe(200);
    expect((await put({ extraKind: 'trailer', parentId: null })).status).toBe(404);
    expect((await put({ extraKind: 'blooper', parentId: 'film' })).status).toBe(400);
  });
});
