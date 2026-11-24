import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { signUpForTest } from '@ValenceServer/auth/signUpForTest';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemoryDownloadService } from '@ValenceServer/downloads/createMemoryDownloadService';
import { DownloadListSchema, DownloadSchema } from '@ValenceContracts/schemas/Download';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';
import type { PlaybackService } from '@ValenceServer/playback/PlaybackService';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';
import { z } from 'zod';

const BASE = 'http://localhost:8420';
const MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';
const LIBRARY_ID = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';
const SERIES_ID = 'a-programme';
const OTHER_MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bd0';
const A_SHARED_DEVICE = 'a-device-two-people-name';

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

const build = (isOriginalWithinLimits = true) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const downloads = createMemoryDownloadService();
  const playback = {
    ...createMemoryPlaybackService(),
    fitsLimit: vi.fn<PlaybackService['fitsLimit']>(() => Promise.resolve(isOriginalWithinLimits)),
  };
  const library = createMemoryLibraryService({
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
  });

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library,
    playback,
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    profiles: createMemoryProfileService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    downloads,
  });

  /**
   * Signs somebody up holding the role a new account is given, as the server gives it.
   *
   * @param credentials - Who to sign up.
   * @returns Their session cookie.
   */
  const signUp = async (credentials: typeof CREDENTIALS = CREDENTIALS) => {
    const cookie = await signUpForTest(app, auth, credentials);
    const member = (await permissions.listRoles()).find((role) => role.name === 'Member');
    const made = store.user.at(-1);

    if (member !== undefined && made !== undefined) {
      await permissions.assignRole(made.id, member.id);
    }

    return cookie;
  };

  /**
   * Holds the account signed up last to a stream limit of its own.
   *
   * @param limit - The parts of the limit that are set.
   */
  const limitTheLast = async (limit: Partial<StreamLimit>) => {
    await settings.write({
      streamLimits: {
        accounts: {
          [store.user.at(-1)?.id ?? '']: {
            maxBitrateKbps: null,
            maxStreams: null,
            maxQuality: null,
            limitsDownloads: false,
            ...limit,
          },
        },
        roles: {},
      },
    });
  };

  return { app, auth, downloads, library, permissions, playback, store, signUp, limitTheLast };
};

/**
 * Asks for something to be prepared.
 *
 * @param app - The application.
 * @param cookie - Who is asking.
 * @param quality - Which rung.
 * @returns The response.
 */
const ask = async (app: ReturnType<typeof build>['app'], cookie: string, quality = '1080p') =>
  app.request(`${BASE}/api/media/${MEDIA_ID}/downloads`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie, origin: BASE },
    body: JSON.stringify({ quality }),
  });

describe('downloads over HTTP', () => {
  it('tells somebody who is not signed in nothing about anybody', async () => {
    const { app } = build();

    expect((await app.request(`${BASE}/api/downloads`)).status).toBe(401);
  });

  it('will not prepare anything for nobody', async () => {
    const { app } = build();

    const response = await app.request(`${BASE}/api/media/${MEDIA_ID}/downloads`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: BASE },
      body: JSON.stringify({ quality: '1080p' }),
    });

    expect(response.status).toBe(401);
  });

  it('hands no file to somebody who is not signed in', async () => {
    const { app } = build();

    const response = await app.request(
      `${BASE}/api/downloads/3fa85f64-5717-4562-b3fc-2c963f66afa6/file`,
    );

    expect(response.status).toBe(401);
  });

  it('says there is nothing to fetch where nothing is ready under that name', async () => {
    const { app, signUp } = build();
    const cookie = await signUp();

    const response = await app.request(
      `${BASE}/api/downloads/3fa85f64-5717-4562-b3fc-2c963f66afa6/file`,
      { headers: { cookie, origin: BASE } },
    );

    expect(response.status).toBe(404);
  });

  it('hands over a file that is ready to its owner', async () => {
    const { app, signUp, downloads } = build();
    const cookie = await signUp();
    const asked = DownloadSchema.parse(await (await ask(app, cookie)).json());

    for (const [profileId, held] of Object.entries(downloads.state.downloads)) {
      downloads.state.downloads[profileId] = held.map((one) => ({ ...one, state: 'ready' }));
    }

    const response = await app.request(`${BASE}/api/downloads/${asked.id}/file`, {
      headers: { cookie, origin: BASE },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('video/mp4');
    expect(await response.text()).toBe(`the film ${MEDIA_ID}`);
  });

  it('hands over no file, and starts none again, once the library is refused the account', async () => {
    const { app, signUp, downloads, library, store } = build();
    const cookie = await signUp();
    const asked = DownloadSchema.parse(await (await ask(app, cookie)).json());

    for (const [profileId, held] of Object.entries(downloads.state.downloads)) {
      downloads.state.downloads[profileId] = held.map((one) => ({ ...one, state: 'ready' }));
    }

    await library.refuseLibrary(store.user[0]?.id ?? '', LIBRARY_ID);

    const read = await app.request(`${BASE}/api/downloads/${asked.id}/file`, {
      headers: { cookie, origin: BASE },
    });
    const resumed = await app.request(`${BASE}/api/downloads/${asked.id}/resume`, {
      method: 'POST',
      headers: { cookie, origin: BASE },
    });

    expect(read.status).toBe(404);
    expect(resumed.status).toBe(404);
  });

  it('has nothing to say about a viewer who has asked for nothing', async () => {
    const { app, signUp } = build();
    const cookie = await signUp();

    const listed = DownloadListSchema.parse(
      await (
        await app.request(`${BASE}/api/downloads`, { headers: { cookie, origin: BASE } })
      ).json(),
    );

    expect(listed.downloads).toEqual([]);
  });

  it('starts one on request and says it is being prepared', async () => {
    const { app, signUp } = build();
    const cookie = await signUp();

    const started = DownloadSchema.parse(await (await ask(app, cookie)).json());

    expect(started.state).toBe('preparing');
    expect(started.quality).toBe('1080p');
  });

  it('does not start a second one for the same thing, since one is already under way', async () => {
    const { app, signUp, downloads } = build();
    const cookie = await signUp();

    await ask(app, cookie);
    await ask(app, cookie);

    expect(Object.values(downloads.state.downloads).flat()).toHaveLength(1);
  });

  it('treats a different rung as a different thing to prepare', async () => {
    const { app, signUp, downloads } = build();
    const cookie = await signUp();

    await ask(app, cookie, '1080p');
    await ask(app, cookie, '720p');

    expect(Object.values(downloads.state.downloads).flat()).toHaveLength(2);
  });

  it('lists what has been asked for', async () => {
    const { app, signUp } = build();
    const cookie = await signUp();

    await ask(app, cookie);

    const listed = DownloadListSchema.parse(
      await (
        await app.request(`${BASE}/api/downloads`, { headers: { cookie, origin: BASE } })
      ).json(),
    );

    expect(listed.downloads).toHaveLength(1);
  });

  it('stops keeping one on the server when told to', async () => {
    const { app, signUp, downloads } = build();
    const cookie = await signUp();

    const started = DownloadSchema.parse(await (await ask(app, cookie)).json());

    const response = await app.request(`${BASE}/api/downloads/${started.id}`, {
      method: 'DELETE',
      headers: { cookie, origin: BASE },
    });

    expect(response.status).toBe(204);
    expect(Object.values(downloads.state.downloads).flat()).toEqual([]);
  });

  it('queues every episode of a programme on one ask', async () => {
    const { app, signUp, downloads } = build();
    const cookie = await signUp();

    downloads.state.episodes[SERIES_ID] = [MEDIA_ID, OTHER_MEDIA_ID];

    const queued = DownloadListSchema.parse(
      await (
        await app.request(`${BASE}/api/series/${SERIES_ID}/downloads`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie, origin: BASE },
          body: JSON.stringify({ quality: '1080p' }),
        })
      ).json(),
    );

    expect(queued.downloads).toHaveLength(2);
  });

  it('queues only the episodes chosen, where some were', async () => {
    const { app, signUp, downloads } = build();
    const cookie = await signUp();

    downloads.state.episodes[SERIES_ID] = [MEDIA_ID, OTHER_MEDIA_ID];

    const queued = DownloadListSchema.parse(
      await (
        await app.request(`${BASE}/api/series/${SERIES_ID}/downloads`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie, origin: BASE },
          body: JSON.stringify({ quality: '1080p', mediaIds: [OTHER_MEDIA_ID] }),
        })
      ).json(),
    );

    expect(queued.downloads.map((one) => one.mediaId)).toEqual([OTHER_MEDIA_ID]);
  });

  it('pauses one on request, so it stops without losing what it has done', async () => {
    const { app, signUp, downloads } = build();
    const cookie = await signUp();

    const started = DownloadSchema.parse(await (await ask(app, cookie)).json());

    const response = await app.request(`${BASE}/api/downloads/${started.id}/pause`, {
      method: 'POST',
      headers: { cookie, origin: BASE },
    });

    expect(response.status).toBe(204);
    expect(Object.values(downloads.state.downloads).flat()[0]?.state).toBe('paused');
  });

  it('carries on from where it stopped when resumed', async () => {
    const { app, signUp, downloads } = build();
    const cookie = await signUp();

    const started = DownloadSchema.parse(await (await ask(app, cookie)).json());

    await app.request(`${BASE}/api/downloads/${started.id}/pause`, {
      method: 'POST',
      headers: { cookie, origin: BASE },
    });

    await app.request(`${BASE}/api/downloads/${started.id}/resume`, {
      method: 'POST',
      headers: { cookie, origin: BASE },
    });

    expect(Object.values(downloads.state.downloads).flat()[0]?.state).toBe('queued');
  });

  it('will not pause or resume for nobody', async () => {
    const { app } = build();

    const paused = await app.request(
      `${BASE}/api/downloads/00000000-0000-4000-8000-00000000000a/pause`,
      { method: 'POST', headers: { origin: BASE } },
    );

    expect(paused.status).toBe(401);
  });

  it('records what a device says it is holding, and what it has let go', async () => {
    const { app, signUp, downloads } = build();
    const cookie = await signUp();

    await app.request(`${BASE}/api/media/${MEDIA_ID}/holdings`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify({ quality: '1080p' }),
    });

    expect(Object.values(downloads.state.holdings).flat()).toHaveLength(1);

    await app.request(`${BASE}/api/media/${MEDIA_ID}/holdings/1080p`, {
      method: 'DELETE',
      headers: { cookie, origin: BASE },
    });

    expect(Object.values(downloads.state.holdings).flat()).toEqual([]);
  });

  it('saves no copy for an account whose role does not include downloads, but lets it tidy up', async () => {
    const { app, downloads, permissions, store, signUp } = build();
    const cookie = await signUp();
    const asked = DownloadSchema.parse(await (await ask(app, cookie)).json());

    for (const [profileId, held] of Object.entries(downloads.state.downloads)) {
      downloads.state.downloads[profileId] = held.map((one) => ({ ...one, state: 'ready' }));
    }

    await permissions.setOverride(store.user[0]?.id ?? '', {
      permission: 'download.media',
      effect: 'deny',
    });

    const sent = (path: string, method = 'GET', body?: object) =>
      app.request(`${BASE}${path}`, {
        method,
        headers: {
          cookie,
          origin: BASE,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    const PROFILE = {
      deviceProfile: {
        schemaVersion: 1,
        name: 'Browser',
        maxWidth: 1920,
        maxHeight: 1080,
        maxBitrateKbps: 8000,
        maxAudioChannels: 2,
        supportedVideoRanges: ['SDR'],
        tenBitVideoCodecs: [],
        maxVideoLevels: {},
        canPlayInterlaced: true,
        canPlayAnamorphic: true,
        canRotate: true,
        unsupportedAudioProfiles: [],
        supportedSubtitleFormats: ['webvtt'],
        directPlayProfiles: [{ container: 'mp4', videoCodecs: ['h264'], audioCodecs: ['aac'] }],
        transcodingProfiles: [
          { container: 'ts', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
        ],
      },
    };

    expect((await ask(app, cookie)).status).toBe(403);
    expect((await sent(`/api/media/${MEDIA_ID}/downloads/offer`, 'POST', PROFILE)).status).toBe(
      403,
    );
    expect((await sent(`/api/downloads/${asked.id}/file`)).status).toBe(403);
    expect((await sent(`/api/downloads/${asked.id}/resume`, 'POST')).status).toBe(403);
    expect(
      (await sent(`/api/media/${MEDIA_ID}/holdings`, 'PUT', { quality: '1080p' })).status,
    ).toBe(403);
    expect((await sent('/api/downloads')).status).toBe(200);
    expect((await sent(`/api/downloads/${asked.id}`, 'DELETE')).status).toBe(204);
  });

  it('lets go of a holding only for whoever is asking, whatever device they name', async () => {
    const { app, signUp, downloads } = build();
    const mine = await signUp();
    const theirs = await signUp({
      name: 'Someone else',
      email: 'else@valence.local',
      password: 'a-long-enough-password',
    });

    await app.request(`${BASE}/api/media/${MEDIA_ID}/holdings`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'x-valence-client': A_SHARED_DEVICE,
        cookie: mine,
        origin: BASE,
      },
      body: JSON.stringify({ quality: '1080p' }),
    });

    const letGo = await app.request(`${BASE}/api/media/${MEDIA_ID}/holdings/1080p`, {
      method: 'DELETE',
      headers: { 'x-valence-client': A_SHARED_DEVICE, cookie: theirs, origin: BASE },
    });

    expect(theirs).not.toBe('');
    expect(theirs).not.toBe(mine);
    expect(letGo.status).toBe(204);
    expect(Object.values(downloads.state.holdings).flat()).toHaveLength(1);
  });
});

describe('downloads held to a quality', () => {
  const DEVICE_PROFILE = {
    schemaVersion: 1,
    name: 'Browser',
    maxWidth: 3840,
    maxHeight: 2160,
    maxBitrateKbps: 40000,
    maxAudioChannels: 2,
    supportedVideoRanges: ['SDR'],
    tenBitVideoCodecs: [],
    maxVideoLevels: {},
    canPlayInterlaced: true,
    canPlayAnamorphic: true,
    canRotate: true,
    unsupportedAudioProfiles: [],
    supportedSubtitleFormats: ['webvtt'],
    directPlayProfiles: [{ container: 'mp4', videoCodecs: ['h264'], audioCodecs: ['aac'] }],
    transcodingProfiles: [
      { container: 'ts', videoCodec: 'h264', audioCodec: 'aac', protocol: 'hls' },
    ],
  };

  const OfferSchema = z.object({
    options: z.array(z.object({ quality: z.string(), isAboveLimit: z.boolean() })),
  });

  const anOption = (quality: 'original' | '2160p' | '1080p' | '720p') => ({
    quality,
    label: quality,
    meaning: quality,
    bytes: null,
    comparison: null,
    wouldTranscode: quality !== 'original',
    savesSpace: quality !== 'original',
  });

  /**
   * Asks what could be downloaded of the film.
   *
   * @param app - The application.
   * @param cookie - Who is asking.
   * @returns Each size on offer and whether it is above their limit.
   */
  const offered = async (app: ReturnType<typeof build>['app'], cookie: string) =>
    OfferSchema.parse(
      await (
        await app.request(`${BASE}/api/media/${MEDIA_ID}/downloads/offer`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie, origin: BASE },
          body: JSON.stringify({ deviceProfile: DEVICE_PROFILE }),
        })
      ).json(),
    ).options.map((option) => [option.quality, option.isAboveLimit]);

  it('saves a copy no higher than the quality the account’s downloads are held to', async () => {
    const { app, signUp, limitTheLast } = build(false);
    const cookie = await signUp();

    await limitTheLast({ maxQuality: '720p', limitsDownloads: true });

    expect(DownloadSchema.parse(await (await ask(app, cookie, '1080p')).json()).quality).toBe(
      '720p',
    );
    expect(DownloadSchema.parse(await (await ask(app, cookie, 'original')).json()).quality).toBe(
      '720p',
    );
    expect(DownloadSchema.parse(await (await ask(app, cookie, '480p')).json()).quality).toBe(
      '480p',
    );
  });

  it('keeps the file as it is where it is already within the limit', async () => {
    const { app, signUp, limitTheLast } = build(true);
    const cookie = await signUp();

    await limitTheLast({ maxQuality: '1080p', limitsDownloads: true });

    expect(DownloadSchema.parse(await (await ask(app, cookie, 'original')).json()).quality).toBe(
      'original',
    );
  });

  it('saves the quality asked for where the limit does not reach downloads', async () => {
    const { app, signUp, limitTheLast } = build();
    const cookie = await signUp();

    await limitTheLast({ maxQuality: '720p', limitsDownloads: false });

    expect(DownloadSchema.parse(await (await ask(app, cookie, '1080p')).json()).quality).toBe(
      '1080p',
    );
  });

  it('saves a copy that holds downloads back without a quality as asked', async () => {
    const { app, signUp, limitTheLast } = build();
    const cookie = await signUp();

    await limitTheLast({ maxBitrateKbps: 4000, limitsDownloads: true });

    expect(DownloadSchema.parse(await (await ask(app, cookie, '1080p')).json()).quality).toBe(
      '1080p',
    );
  });

  it('saves every episode of a programme no higher than the limit', async () => {
    const { app, signUp, downloads, limitTheLast } = build();
    const cookie = await signUp();

    downloads.state.episodes[SERIES_ID] = [MEDIA_ID, OTHER_MEDIA_ID];
    await limitTheLast({ maxQuality: '720p', limitsDownloads: true });

    const queued = DownloadListSchema.parse(
      await (
        await app.request(`${BASE}/api/series/${SERIES_ID}/downloads`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie, origin: BASE },
          body: JSON.stringify({ quality: '2160p' }),
        })
      ).json(),
    );

    expect(queued.downloads.map((one) => one.quality)).toEqual(['720p', '720p']);
  });

  it('marks each size above the limit, asking playback whether the original fits it', async () => {
    const { app, signUp, downloads, playback, limitTheLast } = build(false);
    const cookie = await signUp();

    downloads.state.offers[MEDIA_ID] = {
      mediaId: MEDIA_ID,
      title: 'Arrival',
      episodes: 1,
      options: [anOption('original'), anOption('2160p'), anOption('1080p'), anOption('720p')],
    };
    await limitTheLast({ maxQuality: '1080p', limitsDownloads: true });

    expect(await offered(app, cookie)).toEqual([
      ['original', true],
      ['2160p', true],
      ['1080p', false],
      ['720p', false],
    ]);
    expect(playback.fitsLimit).toHaveBeenCalledWith(MEDIA_ID, null, {
      maxQuality: '1080p',
      maxBitrateKbps: null,
    });
  });

  it('marks nothing where the limit does not reach downloads', async () => {
    const { app, signUp, downloads, playback, limitTheLast } = build(false);
    const cookie = await signUp();

    downloads.state.offers[MEDIA_ID] = {
      mediaId: MEDIA_ID,
      title: 'Arrival',
      episodes: 1,
      options: [anOption('original'), anOption('1080p')],
    };
    await limitTheLast({ maxQuality: '720p', limitsDownloads: false });

    expect(await offered(app, cookie)).toEqual([
      ['original', false],
      ['1080p', false],
    ]);
    expect(playback.fitsLimit).not.toHaveBeenCalled();
  });
});
