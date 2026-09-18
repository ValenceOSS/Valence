import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { signedInApp, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemorySplashscreenStore } from './createMemorySplashscreenStore';

const WayInSchema = z.object({ splashscreen: z.string().nullable() });

const SavedSchema = z.object({ splashscreen: z.string() });

const aPicture = async (width = 32, height = 18): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({ create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .jpeg()
      .toBuffer(),
  );

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const splashscreen = createMemorySplashscreenStore();

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    profiles: createMemoryProfileService(),
    splashscreen,
  });

  return {
    app,
    settings,
    splashscreen,
    administrator: signedInApp(app, { store, permissions, isAdministrator: true }),
    viewer: signedInApp(app, { store, permissions }),
  };
};

/**
 * Chooses a picture as an administrator, the way the settings page does.
 */
const choose = async (context: ReturnType<typeof build>, body?: Uint8Array) =>
  context.administrator.request(`${TEST_ORIGIN}/api/admin/splashscreen`, {
    method: 'PUT',
    headers: { 'content-type': 'image/jpeg', origin: TEST_ORIGIN },
    body: body ?? (await aPicture()),
  });

describe('the picture behind the way in', () => {
  it('names no picture on a server that has none', async () => {
    const context = build();

    await context.settings.write({ showsProfilesBeforeSignIn: true });

    const body = WayInSchema.parse(
      await (await context.app.request(`${TEST_ORIGIN}/api/profiles/everyone`)).json(),
    );

    expect(body.splashscreen).toBeNull();
  });

  it('takes a picture from an administrator and says where it is read from', async () => {
    const context = build();

    const response = await choose(context);

    expect(response.status).toBe(200);
    expect(SavedSchema.parse(await response.json()).splashscreen).toMatch(
      /^\/api\/splashscreen\?v=/,
    );
  });

  it('names the picture on the way in, and serves it to somebody not signed in', async () => {
    const context = build();

    await context.settings.write({ showsProfilesBeforeSignIn: true });
    await choose(context);

    const { splashscreen } = WayInSchema.parse(
      await (await context.app.request(`${TEST_ORIGIN}/api/profiles/everyone`)).json(),
    );
    const picture = await context.app.request(`${TEST_ORIGIN}${splashscreen ?? ''}`);

    expect(picture.status).toBe(200);
    expect(picture.headers.get('content-type')).toBe('image/jpeg');
    expect(picture.headers.get('cache-control')).toContain('immutable');
  });

  it('keeps the picture from somebody not signed in while the faces are hidden', async () => {
    const context = build();

    await context.settings.write({ showsProfilesBeforeSignIn: false });
    await choose(context);

    const response = await context.app.request(`${TEST_ORIGIN}/api/splashscreen`);

    expect(response.status).toBe(401);
  });

  it('shows the picture to somebody signed in whether or not the faces are hidden', async () => {
    const context = build();

    await context.settings.write({ showsProfilesBeforeSignIn: false });
    await choose(context);

    const response = await context.administrator.request(`${TEST_ORIGIN}/api/splashscreen`);

    expect(response.status).toBe(200);
  });

  it('has nothing to serve where no picture was chosen', async () => {
    const context = build();

    await context.settings.write({ showsProfilesBeforeSignIn: true });

    const response = await context.app.request(`${TEST_ORIGIN}/api/splashscreen`);

    expect(response.status).toBe(404);
  });

  it('says which thing was wrong with a picture it refuses', async () => {
    const context = build();

    const response = await choose(context, new TextEncoder().encode('not a picture'));

    expect(response.status).toBe(400);
    await expect(context.splashscreen.address()).resolves.toBeNull();
  });

  it('is for somebody allowed to change the server, not for every viewer', async () => {
    const context = build();

    const response = await context.viewer.request(`${TEST_ORIGIN}/api/admin/splashscreen`, {
      method: 'PUT',
      headers: { 'content-type': 'image/jpeg', origin: TEST_ORIGIN },
      body: await aPicture(),
    });

    expect(response.status).toBe(403);
    await expect(context.splashscreen.address()).resolves.toBeNull();
  });

  it('goes back to the generated background, and says whether there was a picture', async () => {
    const context = build();

    await choose(context);

    const removed = await context.administrator.request(`${TEST_ORIGIN}/api/admin/splashscreen`, {
      method: 'DELETE',
      headers: { origin: TEST_ORIGIN },
    });

    expect(await removed.json()).toEqual({ removed: true });
    await expect(context.splashscreen.address()).resolves.toBeNull();
  });

  it('shows the chosen picture in the server’s settings', async () => {
    const context = build();

    await choose(context);

    const overview = z
      .object({ settings: z.object({ splashscreen: z.string().nullable() }) })
      .parse(
        await (await context.administrator.request(`${TEST_ORIGIN}/api/admin/overview`)).json(),
      );

    expect(overview.settings.splashscreen).toMatch(/^\/api\/splashscreen\?v=/);
  });
});
