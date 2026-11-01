import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createAskingDevices } from '@ValenceServer/devices/createAskingDevices';
import { identifyDevice } from '@ValenceCore/functions/identifyDevice';
import { signUpForTest } from '@ValenceServer/auth/signUpForTest';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';

const BASE = 'http://localhost:8420';
const MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';
const LIBRARY_ID = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';

const FILM: MediaDetail = {
  id: MEDIA_ID,
  libraryId: LIBRARY_ID,
  title: 'Arrival',
  year: 2016,
  container: 'mkv',
  durationSeconds: 7200,
  videoCodec: 'hevc',
  videoRange: 'HDR10',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 3840,
  height: 2160,
  bitrateKbps: 24000,
  audioStreams: [{ index: 1, codec: 'truehd', channels: 8, isDefault: true, isAtmos: true }],
  subtitleStreams: [],
  addedAt: '2026-08-10T00:00:00.000Z',
  metadata: { hasPoster: false, hasBackdrop: false, hasLogo: false },
};

const CREDENTIALS = {
  name: 'Marques',
  email: 'marques@valence.local',
  password: 'a-long-enough-password',
};

const DeviceListSchema = z.object({
  devices: z.array(
    z.object({
      id: z.string(),
      name: SaidSchema,
      device: SaidSchema.nullable(),
      client: SaidSchema.nullable(),
      renamed: z.string().nullable(),
      address: z.string().nullable(),
      isCurrent: z.boolean(),
      isActiveNow: z.boolean(),
    }),
  ),
});

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const askingDevices = createAskingDevices();
  const app = createApp({
    auth,
    settings,
    askingDevices,
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
    profiles: createMemoryProfileService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });

  return { app, auth, store, askingDevices };
};

const listed = async (app: ReturnType<typeof build>['app'], cookie: string) =>
  DeviceListSchema.parse(
    await (
      await app.request(`${BASE}/api/account/devices`, { headers: { cookie, origin: BASE } })
    ).json(),
  ).devices;

const FIREFOX_ON_A_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0';

const signInAgain = async (app: ReturnType<typeof build>['app'], userAgent: string) =>
  (
    await app.request(`${BASE}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: BASE, 'user-agent': userAgent },
      body: JSON.stringify({ email: CREDENTIALS.email, password: CREDENTIALS.password }),
    })
  ).headers
    .getSetCookie()[0]
    ?.split(';')[0] ?? '';

describe('devices over HTTP', () => {
  it('tells somebody who is not signed in nothing about anybody', async () => {
    const { app } = build();

    expect((await app.request(`${BASE}/api/account/devices`)).status).toBe(401);
  });

  it('will not sign anything out for nobody', async () => {
    const { app } = build();

    const response = await app.request(`${BASE}/api/account/devices/whatever`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(401);
  });

  it('lists where this account is signed in', async () => {
    const { app, auth } = build();
    const cookie = await signUpForTest(app, auth, CREDENTIALS);

    await expect(listed(app, cookie)).resolves.toHaveLength(1);
  });

  it('marks the one asking, so a viewer knows which they are holding', async () => {
    const { app, auth } = build();
    const cookie = await signUpForTest(app, auth, CREDENTIALS);

    await expect(listed(app, cookie)).resolves.toMatchObject([{ isCurrent: true }]);
  });

  it('never hands out the means to be one of them', async () => {
    const { app, auth } = build();
    const cookie = await signUpForTest(app, auth, CREDENTIALS);

    const body = await (
      await app.request(`${BASE}/api/account/devices`, { headers: { cookie, origin: BASE } })
    ).text();

    expect(body).not.toContain(cookie.split('=')[1] ?? 'nothing');
    expect(body).not.toContain('token');
  });

  it('answers the same way for a session it has never heard of', async () => {
    const { app, auth } = build();
    const cookie = await signUpForTest(app, auth, CREDENTIALS);

    const response = await app.request(`${BASE}/api/account/devices/not-a-session`, {
      method: 'DELETE',
      headers: { cookie, origin: BASE },
    });

    expect(response.status).toBe(204);
  });

  it('spares the session doing the asking when signing out everywhere else', async () => {
    const { app, auth } = build();
    const cookie = await signUpForTest(app, auth, CREDENTIALS);

    const response = await app.request(`${BASE}/api/account/devices/end-others`, {
      method: 'POST',
      headers: { cookie, origin: BASE },
    });

    expect(response.status).toBe(204);
    await expect(listed(app, cookie)).resolves.toMatchObject([{ isCurrent: true }]);
  });

  it('signs every other device out and keeps the one asking', async () => {
    const { app, auth } = build();
    const cookie = await signUpForTest(app, auth, CREDENTIALS);
    const elsewhere = await signInAgain(app, FIREFOX_ON_A_MAC);

    await expect(listed(app, cookie)).resolves.toHaveLength(2);

    const response = await app.request(`${BASE}/api/account/devices/end-others`, {
      method: 'POST',
      headers: { cookie, origin: BASE },
    });

    expect(response.status).toBe(204);
    await expect(listed(app, cookie)).resolves.toMatchObject([{ isCurrent: true }]);
    expect(
      (
        await app.request(`${BASE}/api/account/devices`, {
          headers: { cookie: elsewhere, origin: BASE },
        })
      ).status,
    ).toBe(401);
  });

  it('names each device by what it is and what it reaches Valence through', async () => {
    const { app, auth } = build();

    await signUpForTest(app, auth, CREDENTIALS);

    const cookie = await signInAgain(app, FIREFOX_ON_A_MAC);
    const devices = await listed(app, cookie);
    const mine = devices.find((device) => device.isCurrent);

    expect(mine?.device?.message).toBe('Mac');
    expect(mine?.client?.message).toBe('Firefox on macOS');
    expect(mine?.name.message).toBe('Mac · Firefox on macOS');
    expect(mine?.renamed).toBeNull();
  });

  it('will not rename anything for nobody', async () => {
    const { app } = build();

    const response = await app.request(`${BASE}/api/account/devices/whatever/name`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin: BASE },
      body: JSON.stringify({ name: 'Kitchen phone' }),
    });

    expect(response.status).toBe(401);
  });

  it('has no device to rename where the server keeps no notes on its devices', async () => {
    const { app, auth } = build();
    const cookie = await signUpForTest(app, auth, CREDENTIALS);
    const [mine] = await listed(app, cookie);

    const response = await app.request(`${BASE}/api/account/devices/${mine?.id ?? ''}/name`, {
      method: 'PUT',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Kitchen phone' }),
    });

    expect(response.status).toBe(404);
  });

  it('reports the address a session was opened from when one was recorded', async () => {
    const { app, auth, store } = build();
    const cookie = await signUpForTest(app, auth, CREDENTIALS);
    const held = store.session[0];

    if (held !== undefined) {
      held.ipAddress = '192.168.1.50';
    }

    await expect(listed(app, cookie)).resolves.toMatchObject([{ address: '192.168.1.50' }]);
  });

  it('reports no address for a session opened from somewhere it did not record', async () => {
    const { app, auth, store } = build();
    const cookie = await signUpForTest(app, auth, CREDENTIALS);
    const held = store.session[0];

    if (held !== undefined) {
      held.ipAddress = null;
    }

    await expect(listed(app, cookie)).resolves.toMatchObject([{ address: null }]);
  });

  it('says which television asked for a code, and from where', async () => {
    const { app, auth, askingDevices } = build();
    const cookie = await signUpForTest(app, auth, CREDENTIALS);

    askingDevices.note('ABCD-EFGH', {
      deviceId: 'living-room-tv',
      identity: identifyDevice({
        userAgent: 'Valence (Living Room)',
        kind: 'tv',
        hints: { app: 'tv', system: 'androidTv', name: 'Living Room' },
      }),
      address: '192.168.1.30',
    });

    const answer = await app.request(`${BASE}/api/account/devices/asking/abcdefgh`, {
      headers: { cookie, origin: BASE },
    });
    const asking = z
      .object({ device: SaidSchema, client: SaidSchema, address: z.string().nullable() })
      .parse(await answer.json());

    expect(answer.status).toBe(200);
    expect(asking.device.message).toBe('Living Room');
    expect(asking.client.message).toBe('Valence for Android TV');
    expect(asking.address).toBe('192.168.1.30');
  });

  it('says nothing of a code no television asked for', async () => {
    const { app, auth } = build();
    const cookie = await signUpForTest(app, auth, CREDENTIALS);

    const answer = await app.request(`${BASE}/api/account/devices/asking/NOTACODE`, {
      headers: { cookie, origin: BASE },
    });

    expect(answer.status).toBe(404);
  });

  it('tells somebody who is not signed in nothing about a waiting television', async () => {
    const { app } = build();

    expect((await app.request(`${BASE}/api/account/devices/asking/ABCDEFGH`)).status).toBe(401);
  });
});
