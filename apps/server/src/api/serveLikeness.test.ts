import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signedInApp } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import type { LikenessService } from '@ValenceServer/likeness/createLikenessService';

const BASE = 'http://localhost:8420';

const MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

const FILM = {
  id: '6f1c2a1e-6c7b-4f0e-9a51-0d5f8e3a9b10',
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Two',
  year: 2026,
  durationSeconds: 5400,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-09-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
};

/**
 * Builds the app around a likeness service that answers as told.
 *
 * @param likeness - What finds titles like others.
 * @param isSignedIn - Whether the requests come from somebody signed in.
 * @returns The app.
 */
const appOf = (likeness: Partial<LikenessService>, isSignedIn = true) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    subtitles: createMemorySubtitleService(),
    segments: createMemorySegmentService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    playback: createMemoryPlaybackService(),
    likeness: {
      likeThis: () => Promise.resolve([]),
      becauseYouWatched: () => Promise.resolve([]),
      forget: () => {},
      ...likeness,
    },
  });

  return isSignedIn ? signedInApp(app, { auth, store, permissions, isAdministrator: false }) : app;
};

describe('GET /api/media/{id}/like-this', () => {
  it('lists the titles like one, asking for as many as the caller wants', async () => {
    const likeThis = vi.fn(() => Promise.resolve([FILM]));
    const response = await appOf({ likeThis }).request(
      `${BASE}/api/media/${MEDIA_ID}/like-this?limit=5`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ items: [{ id: FILM.id, title: 'Two' }] });
    expect(likeThis).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'account' }),
      MEDIA_ID,
      5,
    );
  });

  it('asks for twenty where the caller does not say', async () => {
    const likeThis = vi.fn(() => Promise.resolve([]));

    await appOf({ likeThis }).request(`${BASE}/api/media/${MEDIA_ID}/like-this`);

    expect(likeThis).toHaveBeenCalledWith(expect.anything(), MEDIA_ID, 20);
  });

  it('says there is no such item where there is none', async () => {
    const response = await appOf({ likeThis: () => Promise.resolve(null) }).request(
      `${BASE}/api/media/${MEDIA_ID}/like-this`,
    );

    expect(response.status).toBe(404);
  });

  it('tells somebody not signed in nothing', async () => {
    expect((await appOf({}, false).request(`${BASE}/api/media/${MEDIA_ID}/like-this`)).status).toBe(
      401,
    );
  });
});

describe('GET /api/because-you-watched', () => {
  it('suggests three rows of twenty where the caller does not say otherwise', async () => {
    const becauseYouWatched = vi.fn(() =>
      Promise.resolve([
        { watched: { title: 'One', mediaId: MEDIA_ID, seriesId: null }, items: [FILM] },
      ]),
    );
    const response = await appOf({ becauseYouWatched }).request(`${BASE}/api/because-you-watched`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      rows: [{ watched: { title: 'One' }, items: [{ id: FILM.id }] }],
    });
    expect(becauseYouWatched).toHaveBeenCalledWith(expect.anything(), 3, 20);
  });

  it('refuses more rows than it will suggest, and rows too short to draw', async () => {
    expect((await appOf({}).request(`${BASE}/api/because-you-watched?rows=50`)).status).toBe(400);
    expect((await appOf({}).request(`${BASE}/api/because-you-watched?limit=2`)).status).toBe(400);
  });

  it('tells somebody not signed in nothing', async () => {
    expect((await appOf({}, false).request(`${BASE}/api/because-you-watched`)).status).toBe(401);
  });
});
