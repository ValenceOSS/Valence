import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemoryHouseholdService } from './createMemoryHouseholdService';

const BASE = 'http://localhost:8420';

const CREDENTIALS = {
  name: 'Dan',
  email: 'dan@valence.local',
  password: 'a-long-enough-password',
};

const aPicture = async (width = 8, height = 8): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({ create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .png()
      .toBuffer(),
  );

const build = () => {
  const { auth, settings } = createMemoryAuth();
  const households = createMemoryHouseholdService();

  const app = createApp({
    auth,
    settings,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    households,
  });

  return { app, households };
};

const signedIn = async (app: ReturnType<typeof build>['app']): Promise<string> => {
  const response = await app.request(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE },
    body: JSON.stringify(CREDENTIALS),
  });

  return response.headers.getSetCookie()[0]?.split(';')[0] ?? '';
};

describe('setting a household up over HTTP', () => {
  it('tells nobody who is not signed in anything about it', async () => {
    const { app } = build();

    const response = await app.request(`${BASE}/api/account/onboarding`);

    expect(response.status).toBe(401);
  });

  it('says a new household has not been set up, and what it is called meanwhile', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    const response = await app.request(`${BASE}/api/account/onboarding`, {
      headers: { cookie, origin: BASE },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      isOnboarded: false,
      household: { name: 'Dan', avatar: { kind: 'initial' } },
    });
  });

  it('takes a new name and gives back the household that now stands', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    await app.request(`${BASE}/api/account/onboarding`, { headers: { cookie, origin: BASE } });

    const response = await app.request(`${BASE}/api/account`, {
      method: 'PATCH',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'The Morgans' }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ name: 'The Morgans' });
  });

  it('is finished only when somebody says it is', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    await app.request(`${BASE}/api/account/onboarding`, { headers: { cookie, origin: BASE } });

    const finished = await app.request(`${BASE}/api/account/onboarding`, {
      method: 'POST',
      headers: { cookie, origin: BASE },
    });

    const asked = await app.request(`${BASE}/api/account/onboarding`, {
      headers: { cookie, origin: BASE },
    });

    expect(finished.status).toBe(204);
    expect(await asked.json()).toMatchObject({ isOnboarded: true });
  });

  it('keeps a picture and serves it back', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    await app.request(`${BASE}/api/account/onboarding`, { headers: { cookie, origin: BASE } });

    const kept = await app.request(`${BASE}/api/account/photo`, {
      method: 'PUT',
      headers: { cookie, origin: BASE, 'content-type': 'image/png' },
      body: await aPicture(),
    });

    const served = await app.request(`${BASE}/api/account/avatar?v=1`, {
      headers: { cookie, origin: BASE },
    });

    expect(kept.status).toBe(204);
    expect(served.status).toBe(200);
    expect(served.headers.get('cache-control')).toContain('immutable');
  });

  it('says which thing was wrong with a picture it will not take', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    await app.request(`${BASE}/api/account/onboarding`, { headers: { cookie, origin: BASE } });

    const response = await app.request(`${BASE}/api/account/photo`, {
      method: 'PUT',
      headers: { cookie, origin: BASE, 'content-type': 'image/png' },
      body: new TextEncoder().encode('not a picture'),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'That file could not be read as a picture.' });
  });
});
