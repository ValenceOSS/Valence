import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signedInApp, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';

const MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';
const MISSING_ID = '0f0e0d0c-0b0a-4908-8706-050403020100';
const LIBRARY_ID = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';

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
  metadata: { hasPoster: false, hasBackdrop: false, hasLogo: false },
};

const CHAPTERS = [
  { title: 'Opening', startSeconds: 0, endSeconds: 600 },
  { title: null, startSeconds: 600, endSeconds: 7200 },
];

const INTRO = {
  kind: 'intro' as const,
  startSeconds: 30,
  endSeconds: 90,
  source: 'fingerprint' as const,
};

const AnswerSchema = z.object({
  chapters: z.array(
    z.object({ title: z.string().nullable(), startSeconds: z.number(), endSeconds: z.number() }),
  ),
});

const SegmentsSchema = z.object({ segments: z.array(z.object({ kind: z.string() })) });

const build = () => {
  const { auth, settings } = createMemoryAuth();

  return signedInApp(
    createApp({
      auth,
      settings,
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
      segments: createMemorySegmentService({ [MEDIA_ID]: [INTRO] }, { [MEDIA_ID]: CHAPTERS }),
      subtitles: createMemorySubtitleService({}),
      progress: createMemoryWatchProgressService(),
      favourites: createMemoryFavouriteService(),
      ratings: createMemoryRatingService(),
    }),
    { auth },
  );
};

describe('the timeline of an item', () => {
  it('lists the chapters its file marks, named where the file names them', async () => {
    const answer = await build().request(`${TEST_ORIGIN}/api/media/${MEDIA_ID}/chapters`);

    expect(answer.status).toBe(200);
    expect(AnswerSchema.parse(await answer.json()).chapters).toEqual(CHAPTERS);
  });

  it('lists the stretches it can skip', async () => {
    const answer = await build().request(`${TEST_ORIGIN}/api/media/${MEDIA_ID}/segments`);

    expect(SegmentsSchema.parse(await answer.json()).segments).toEqual([
      expect.objectContaining({ kind: 'intro' }),
    ]);
  });

  it('says there is no such item rather than listing nothing', async () => {
    const answer = await build().request(`${TEST_ORIGIN}/api/media/${MISSING_ID}/chapters`);

    expect(answer.status).toBe(404);
  });
});
