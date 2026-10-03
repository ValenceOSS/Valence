import type { PasswordResetAsk } from '@ValenceContracts/schemas/PasswordResetRequest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';

const BASE = 'http://localhost:8420';

/**
 * The app, with a stand-in for asking for a reset.
 *
 * @param requestPasswordReset - What asking does.
 * @returns The app.
 */
const build = (
  requestPasswordReset: (ask: PasswordResetAsk, redirectTo: string) => Promise<void>,
) => {
  const { auth, settings } = createMemoryAuth();

  return createApp({
    auth,
    settings,
    requestPasswordReset,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({ libraries: [], media: [] }),
    subtitles: createMemorySubtitleService(),
    segments: createMemorySegmentService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    playback: createMemoryPlaybackService(),
  });
};

describe('asking for a password reset over HTTP', () => {
  it('takes it from somebody not signed in, and answers the same either way', async () => {
    const requestPasswordReset = vi.fn(() => Promise.resolve());
    const app = build(requestPasswordReset);
    const answer = await app.request(`${BASE}/api/password-reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier: 'ada', redirectTo: `${BASE}/reset-password` }),
    });

    expect(answer.status).toBe(202);
    expect(await answer.json()).toEqual({ requested: true });
    expect(requestPasswordReset).toHaveBeenCalledWith(
      { identifier: 'ada' },
      `${BASE}/reset-password`,
    );
  });

  it('takes the face somebody picked, for a phone that signs in by face', async () => {
    const requestPasswordReset = vi.fn(() => Promise.resolve());
    const app = build(requestPasswordReset);
    const profileId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
    const answer = await app.request(`${BASE}/api/password-reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ profileId, redirectTo: `${BASE}/reset-password` }),
    });

    expect(answer.status).toBe(202);
    expect(requestPasswordReset).toHaveBeenCalledWith({ profileId }, `${BASE}/reset-password`);
  });

  it('refuses a request with nothing to go on', async () => {
    const app = build(() => Promise.resolve());
    const answer = await app.request(`${BASE}/api/password-reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier: '  ', redirectTo: '/' }),
    });

    expect(answer.status).toBe(400);
  });
});
