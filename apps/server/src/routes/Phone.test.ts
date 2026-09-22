import { describe, expect, it } from 'vitest';
import { z } from 'zod';
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
import { theChallengeFor } from '@ValenceServer/phone/theChallengeFor';

const HandBackSchema = z.object({ url: z.string() });

const SECRET = 'a-secret-only-this-phone-holds-and-nobody-else';

/**
 * A server with one account signed in on a browser, and a way to ask it things.
 */
const aServer = async () => {
  const { auth, settings } = createMemoryAuth();
  const app = createApp({
    auth,
    settings,
    permissions: createMemoryPermissionService(),
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });
  const cookie = await signUpForTest(app);

  const post = (path: string, body: object, withCookie: string | null = cookie) =>
    app.request(`${TEST_ORIGIN}${path}`, {
      method: 'POST',
      headers: {
        origin: TEST_ORIGIN,
        'content-type': 'application/json',
        ...(withCookie === null ? {} : { cookie: withCookie }),
      },
      body: JSON.stringify(body),
    });

  /**
   * Hands a sign-in back from the browser, answering with the code the phone would catch.
   */
  const handBack = async (): Promise<string> => {
    const response = await post('/api/phone/hand-back', { challenge: theChallengeFor(SECRET) });
    const { url } = HandBackSchema.parse(await response.json());

    return new URL(url).searchParams.get('code') ?? '';
  };

  return { app, post, handBack };
};

describe('handing a sign-in back to a phone', () => {
  it('answers with a link back into the app carrying a code', async () => {
    const { post } = await aServer();
    const response = await post('/api/phone/hand-back', { challenge: theChallengeFor(SECRET) });
    const { url } = HandBackSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(url).toMatch(/^valence:\/\/signed-in\?code=.+/);
  });

  it('refuses somebody who is not signed in', async () => {
    const { post } = await aServer();
    const response = await post(
      '/api/phone/hand-back',
      { challenge: theChallengeFor(SECRET) },
      null,
    );

    expect(response.status).toBe(401);
  });

  it('refuses a challenge that is not a sha-256', async () => {
    const { post } = await aServer();
    const response = await post('/api/phone/hand-back', { challenge: 'plain' });

    expect(response.status).toBe(400);
  });

  it('gives the phone holding the secret a session of its own', async () => {
    const { app, post, handBack } = await aServer();
    const code = await handBack();
    const response = await post('/api/phone/exchange', { code, secret: SECRET }, null);
    const phoneCookie = response.headers.getSetCookie()[0]?.split(';')[0] ?? '';
    const session = await app.request(`${TEST_ORIGIN}/api/auth/get-session`, {
      headers: { cookie: phoneCookie, origin: TEST_ORIGIN },
    });

    expect(response.status).toBe(200);
    expect(phoneCookie).not.toBe('');
    expect(await session.json()).toMatchObject({ user: { email: 'marques@valence.local' } });
  });

  it('gives nothing to somebody who caught the code but not the secret', async () => {
    const { post, handBack } = await aServer();
    const code = await handBack();
    const response = await post(
      '/api/phone/exchange',
      { code, secret: 'somebody-else-guessing-at-it-badly' },
      null,
    );

    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it('spends a code on a wrong guess, so the right secret cannot follow it', async () => {
    const { post, handBack } = await aServer();
    const code = await handBack();

    await post('/api/phone/exchange', { code, secret: 'somebody-else-guessing-at-it-badly' }, null);

    const response = await post('/api/phone/exchange', { code, secret: SECRET }, null);

    expect(response.status).toBe(401);
  });

  it('will not swap the same code twice', async () => {
    const { post, handBack } = await aServer();
    const code = await handBack();

    await post('/api/phone/exchange', { code, secret: SECRET }, null);

    const response = await post('/api/phone/exchange', { code, secret: SECRET }, null);

    expect(response.status).toBe(401);
  });

  it('does not let a browser mint codes through the plugin directly', async () => {
    const { app } = await aServer();
    const response = await app.request(`${TEST_ORIGIN}/api/auth/one-time-token/generate`, {
      headers: { origin: TEST_ORIGIN },
    });

    expect(response.status).toBe(404);
  });
});
