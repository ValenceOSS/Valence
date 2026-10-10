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
import { ARTWORK_WIDTHS } from '@ValenceContracts/constants/ARTWORK_WIDTHS';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';

const MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';
const LIBRARY_ID = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';
const POSTER = `/api/media/${MEDIA_ID}/image/poster`;

const FILM: MediaDetail = {
  id: MEDIA_ID,
  libraryId: LIBRARY_ID,
  title: 'Arrival',
  year: 2016,
  container: 'mkv',
  durationSeconds: 7200,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 1920,
  height: 1080,
  bitrateKbps: 8000,
  audioStreams: [],
  subtitleStreams: [],
  addedAt: '2026-08-10T00:00:00.000Z',
  metadata: { hasPoster: true, hasBackdrop: false, hasLogo: false },
};

const build = async () => {
  const { auth, settings } = createMemoryAuth();
  const readImage = vi.fn((_url: string, width?: number) =>
    Promise.resolve({
      body: new TextEncoder().encode(width === undefined ? 'whole' : 'narrow').buffer,
      contentType: width === undefined ? 'image/jpeg' : 'image/webp',
    }),
  );

  const app = createApp({
    auth,
    settings,
    permissions: createMemoryPermissionService(),
    requests: null,
    requestsClient: null,
    jobDefinitions: jobDefinitionsFor(false),
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({
      libraries: [
        {
          id: LIBRARY_ID,
          name: 'Films',
          kind: 'movies',
          path: '/media/films',
          itemCount: 1,
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
      media: [FILM],
    }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    readImage,
  });

  const cookie = await signUpForTest(app);
  const ask = (path: string) =>
    app.request(`${TEST_ORIGIN}${path}`, { headers: { cookie, origin: TEST_ORIGIN } });

  return { ask, readImage };
};

describe('GET /api/media/{mediaId}/image/{kind}', () => {
  it('serves the whole picture when no size is asked for', async () => {
    const { ask, readImage } = await build();
    const response = await ask(POSTER);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(readImage).toHaveBeenCalledWith(`https://images.test/poster/${MEDIA_ID}.jpg`, undefined);
  });

  it('serves the small copy at the width the grid draws it', async () => {
    const { ask, readImage } = await build();
    const response = await ask(`${POSTER}?size=small`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/webp');
    expect(readImage).toHaveBeenCalledWith(
      `https://images.test/poster/${MEDIA_ID}.jpg`,
      ARTWORK_WIDTHS.small,
    );
  });

  it('serves the medium copy at the width a wide card draws it', async () => {
    const { ask, readImage } = await build();
    const response = await ask(`${POSTER}?size=medium`);

    expect(response.status).toBe(200);
    expect(readImage).toHaveBeenCalledWith(
      `https://images.test/poster/${MEDIA_ID}.jpg`,
      ARTWORK_WIDTHS.medium,
    );
  });

  it('tags the small copy apart from the whole picture', async () => {
    const { ask } = await build();
    const whole = await ask(POSTER);
    const small = await ask(`${POSTER}?size=small`);

    expect(small.headers.get('etag')).not.toBe(whole.headers.get('etag'));
  });

  it('refuses a size it does not make', async () => {
    const { ask } = await build();

    expect((await ask(`${POSTER}?size=huge`)).status).toBe(400);
  });
});
