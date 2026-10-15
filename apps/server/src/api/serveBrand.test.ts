import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
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

const AppearanceSchema = z.object({
  brand: z.object({
    name: z.string().nullable(),
    accent: z.string().nullable(),
    description: z.string().nullable(),
    logo: z.string().nullable(),
  }),
});

const aLogo = (): Promise<Uint8Array> =>
  sharp({ create: { width: 64, height: 64, channels: 3, background: '#ff6600' } })
    .png()
    .toBuffer()
    .then((made) => new Uint8Array(made));

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    realtime: { publish: vi.fn(), recheck: vi.fn(), recheckAll: vi.fn() },
  });

  return {
    app,
    administrator: signedInApp(app, { store, permissions, isAdministrator: true }),
    viewer: signedInApp(app, { store, permissions }),
  };
};

const brandOf = async (app: { request: (input: string) => Promise<Response> | Response }) =>
  AppearanceSchema.parse(await (await app.request(`${TEST_ORIGIN}/api/appearance`)).json()).brand;

describe('the server’s own brand', () => {
  it('is Valence’s until an administrator says otherwise', async () => {
    const { app } = build();

    expect(await brandOf(app)).toEqual({ name: null, accent: null, description: null, logo: null });
  });

  it('is told to everybody, signed in or not, once an administrator sets it', async () => {
    const { app, administrator } = build();

    const set = await administrator.request(`${TEST_ORIGIN}/api/admin/brand`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: TEST_ORIGIN },
      body: JSON.stringify({
        name: 'Home Cinema',
        accent: '#ff6600',
        description: 'Films at home',
      }),
    });

    expect(set.status).toBe(200);
    expect(await brandOf(app)).toMatchObject({
      name: 'Home Cinema',
      accent: '#ff6600',
      description: 'Films at home',
    });
  });

  it('serves a logo once one is uploaded, to anybody', async () => {
    const { app, administrator } = build();

    await administrator.request(`${TEST_ORIGIN}/api/admin/brand/logo`, {
      method: 'PUT',
      headers: { 'content-type': 'image/png', origin: TEST_ORIGIN },
      body: await aLogo(),
    });

    const { logo } = await brandOf(app);

    expect(logo).toMatch(/^\/api\/brand\/logo\?v=/u);

    const served = await app.request(`${TEST_ORIGIN}${logo ?? ''}`);

    expect(served.status).toBe(200);
    expect(served.headers.get('content-type')).toBe('image/png');
  });

  it('refuses a colour that is not one', async () => {
    const { administrator } = build();

    const refused = await administrator.request(`${TEST_ORIGIN}/api/admin/brand`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: TEST_ORIGIN },
      body: JSON.stringify({ accent: 'orange' }),
    });

    expect(refused.status).toBe(400);
  });

  it('is changed by administrators only', async () => {
    const { viewer } = build();

    const refused = await viewer.request(`${TEST_ORIGIN}/api/admin/brand`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: TEST_ORIGIN },
      body: JSON.stringify({ name: 'Mine' }),
    });

    expect(refused.status).toBe(403);
  });
});
