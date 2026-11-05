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
import { jobDefinitionsFor } from '@ValenceServer/jobs/jobDefinitions';
import type { ArtworkKind } from '@ValenceContracts/schemas/ArtworkChoice';
import type { LibraryService } from '@ValenceServer/library/LibraryService';

const MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';
const ON_DISK = 'valence-disk:L2ZpbG1zL3Bvc3Rlci5qcGc';

type Upload = NonNullable<LibraryService['uploadArtwork']>;

/**
 * An application whose library takes uploaded artwork, answering each upload as told.
 *
 * @param answer - What the library says to an upload.
 * @returns A way to ask the application, and what the library was asked.
 */
const build = async (answer: Awaited<ReturnType<Upload>> = { jobId: null }) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const uploadArtwork = vi.fn(
    (_mediaId: string, _kind: ArtworkKind, _artwork: { body: Uint8Array; contentType: string }) =>
      Promise.resolve(answer),
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
      ...createMemoryLibraryService({ libraries: [], media: [] }),
      uploadArtwork,
      isOwnArtwork: (_mediaId, url) => Promise.resolve(url === ON_DISK),
    },
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    readImage,
  });
  const cookie = await signUpForTest(app, auth);

  permissions.state.overrides[store.user[0]?.id ?? ''] = [
    { permission: 'media.override', effect: 'allow' },
  ];
  const ask = (path: string, init: RequestInit = {}) =>
    app.request(`${TEST_ORIGIN}${path}`, {
      ...init,
      headers: { cookie, origin: TEST_ORIGIN, ...init.headers },
    });

  return { ask, uploadArtwork, readImage };
};

describe('serveLibrary', () => {
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
});
