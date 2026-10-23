import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemoryWatchProgressService } from './createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';

const BASE = 'http://localhost:8420';
const MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';
const LIBRARY_ID = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';
const TRAILER_ID = 'b1f4b0a2-3d2e-42a7-9a2c-5f0f6a1c7d31';

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

const TRAILER: MediaDetail = {
  ...FILM,
  id: TRAILER_ID,
  title: 'Arrival (Trailer)',
  durationSeconds: 90,
  parentId: MEDIA_ID,
  extraKind: 'trailer',
};

const LINKED_LIBRARY_ID = '6a1f3c2e-9d4b-4e7a-8c5f-2b1d0e9f8a7c';

const LINKED_COPY_ID = 'c3d2e1f0-a9b8-47c6-85d4-e3f2a1b0c9d8';

const LINKED_COPY: MediaDetail = {
  ...FILM,
  id: LINKED_COPY_ID,
  libraryId: LINKED_LIBRARY_ID,
  parentId: MEDIA_ID,
};

const CREDENTIALS = {
  name: 'Marques',
  email: 'marques@valence.local',
  password: 'a-long-enough-password',
};

const ProgressListSchema = z.object({
  progress: z.array(
    z.object({ mediaId: z.string(), positionSeconds: z.number(), isFinished: z.boolean() }),
  ),
});

const build = () => {
  const profiles = createMemoryProfileService();
  const { auth, settings, store } = createMemoryAuth();
  const progress = createMemoryWatchProgressService();
  const segments = createMemorySegmentService();

  const app = createApp({
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
        {
          id: LINKED_LIBRARY_ID,
          name: 'Films elsewhere',
          kind: 'movies',
          path: '',
          itemCount: 1,
          lastScannedAt: null,
          defaultAudioLanguage: null,
          filesAtOnce: null,
          takesRequests: false,
          requestProfileId: null,
          requestPath: null,
          keepsShowsTogether: true,
          higherProfileAsks: 'ask',
          linkedServerId: 'a-linked-server',
        },
      ],
      media: [FILM, TRAILER, LINKED_COPY],
    }),
    playback: createMemoryPlaybackService(),
    segments,
    subtitles: createMemorySubtitleService({}),
    profiles,
    progress,
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });

  return { app, progress, profiles, segments, store };
};

/**
 * Somebody signed in, and the cookie that says so.
 */
const signedIn = async (app: ReturnType<typeof build>['app']): Promise<string> => {
  const response = await app.request(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE },
    body: JSON.stringify(CREDENTIALS),
  });

  return response.headers.getSetCookie()[0]?.split(';')[0] ?? '';
};

const REPORT = { positionSeconds: 600, durationSeconds: 7200 };

describe('watch progress over HTTP', () => {
  it('tells somebody who is not signed in nothing about anybody', async () => {
    const { app } = build();

    const response = await app.request(`${BASE}/api/progress`);

    expect(response.status).toBe(401);
  });

  it('will not record a position for nobody', async () => {
    const { app } = build();

    const response = await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(REPORT),
    });

    expect(response.status).toBe(401);
  });

  it('has nothing to say about a viewer who has watched nothing', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    const response = await app.request(`${BASE}/api/progress`, {
      headers: { cookie, origin: BASE },
    });

    expect(ProgressListSchema.parse(await response.json()).progress).toEqual([]);
  });

  it('records where somebody got to', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    const recorded = await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify(REPORT),
    });

    expect(recorded.status).toBe(204);
  });

  it('does not count a trailer as something watched', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    const recorded = await app.request(`${BASE}/api/media/${TRAILER_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify({ positionSeconds: 45, durationSeconds: 90 }),
    });

    const listed = await app.request(`${BASE}/api/progress`, {
      headers: { cookie, origin: BASE },
    });

    expect(recorded.status).toBe(204);
    expect(ProgressListSchema.parse(await listed.json()).progress).toEqual([]);
  });

  it('reads back what it recorded', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify(REPORT),
    });

    const response = await app.request(`${BASE}/api/progress`, {
      headers: { cookie, origin: BASE },
    });
    const body = ProgressListSchema.parse(await response.json());

    expect(body.progress).toMatchObject([{ mediaId: MEDIA_ID, positionSeconds: 600 }]);
  });

  it('does not call something finished short of its end', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify(REPORT),
    });

    const body = ProgressListSchema.parse(
      await (
        await app.request(`${BASE}/api/progress`, { headers: { cookie, origin: BASE } })
      ).json(),
    );

    expect(body.progress[0]?.isFinished).toBe(false);
  });

  it('records that something was finished', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify({ ...REPORT, positionSeconds: 7190, isFinished: true }),
    });

    const body = ProgressListSchema.parse(
      await (
        await app.request(`${BASE}/api/progress`, { headers: { cookie, origin: BASE } })
      ).json(),
    );

    expect(body.progress[0]?.isFinished).toBe(true);
  });

  it('counts something watched once its marked credits begin, whatever the client says', async () => {
    const { app, segments } = build();
    const cookie = await signedIn(app);

    segments.state[MEDIA_ID] = [
      { kind: 'credits', startSeconds: 6600, endSeconds: 7200, source: 'imported' },
    ];

    await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify({ positionSeconds: 6600, durationSeconds: 7200, isFinished: false }),
    });

    const body = ProgressListSchema.parse(
      await (
        await app.request(`${BASE}/api/progress`, { headers: { cookie, origin: BASE } })
      ).json(),
    );

    expect(body.progress[0]?.isFinished).toBe(true);
  });

  it('will not call something finished a second in, whatever the client says', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify({ positionSeconds: 1, durationSeconds: 12, isFinished: true }),
    });

    const body = ProgressListSchema.parse(
      await (
        await app.request(`${BASE}/api/progress`, { headers: { cookie, origin: BASE } })
      ).json(),
    );

    expect(body.progress[0]?.isFinished).toBe(false);
  });

  it('keeps how long the library says it runs, not how much of a stream the client had', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify({ positionSeconds: 1, durationSeconds: 12, isFinished: false }),
    });

    const body = z
      .object({ progress: z.array(z.object({ durationSeconds: z.number() })) })
      .parse(
        await (
          await app.request(`${BASE}/api/progress`, { headers: { cookie, origin: BASE } })
        ).json(),
      );

    expect(body.progress[0]?.durationSeconds).toBe(7200);
  });

  it('keeps and forgets a copy from a linked server against the title here', async () => {
    const { app } = build();
    const cookie = await signedIn(app);
    const read = async () =>
      ProgressListSchema.parse(
        await (
          await app.request(`${BASE}/api/progress`, { headers: { cookie, origin: BASE } })
        ).json(),
      ).progress;

    await app.request(`${BASE}/api/media/${LINKED_COPY_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify(REPORT),
    });

    expect((await read()).map((one) => one.mediaId)).toEqual([MEDIA_ID]);

    await app.request(`${BASE}/api/media/${LINKED_COPY_ID}/progress`, {
      method: 'DELETE',
      headers: { cookie, origin: BASE },
    });

    expect(await read()).toEqual([]);
  });

  it('refuses a position that is not one', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    const response = await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify({ positionSeconds: -30, durationSeconds: 7200 }),
    });

    expect(response.status).toBe(400);
  });

  it('refuses an item with no length, which nothing can be a fraction of', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    const response = await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify({ positionSeconds: 600, durationSeconds: 0 }),
    });

    expect(response.status).toBe(400);
  });

  it('forgets an item, so it starts over', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie, origin: BASE },
      body: JSON.stringify(REPORT),
    });

    const forgotten = await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'DELETE',
      headers: { cookie, origin: BASE },
    });

    const body = ProgressListSchema.parse(
      await (
        await app.request(`${BASE}/api/progress`, { headers: { cookie, origin: BASE } })
      ).json(),
    );

    expect(forgotten.status).toBe(204);
    expect(body.progress).toEqual([]);
  });
});

describe('which viewer a request is about', () => {
  const PROFILE_HEADER = 'x-valence-profile';

  it('records against the profile the session chose, whatever profile a header names', async () => {
    const { app, profiles, store } = build();
    const cookie = await signedIn(app);
    const headers = { cookie, origin: BASE, 'content-type': 'application/json' };

    await app.request(`${BASE}/api/profiles`, { headers });

    const second = await profiles.create(store.user[0]?.id ?? '', {
      name: 'Dan',
      colour: '#e8a33a',
    });

    await app.request(`${BASE}/api/media/${MEDIA_ID}/progress`, {
      method: 'PUT',
      headers: { ...headers, [PROFILE_HEADER]: second.id },
      body: JSON.stringify({ positionSeconds: 42, durationSeconds: 7200 }),
    });

    const asChosen = await app.request(`${BASE}/api/progress`, { headers });

    expect(await asChosen.json()).toMatchObject({ progress: [{ positionSeconds: 42 }] });

    await app.request(`${BASE}/api/profiles/${second.id}/choose`, {
      method: 'POST',
      headers,
      body: '{}',
    });

    const asNamed = await app.request(`${BASE}/api/progress`, { headers });

    expect(await asNamed.json()).toMatchObject({ progress: [] });
  });

  it('answers as the chosen profile where a header names somebody else’s', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    const response = await app.request(`${BASE}/api/progress`, {
      headers: { cookie, origin: BASE, [PROFILE_HEADER]: '3f2504e0-4f89-41d3-9a0c-0305e82c3301' },
    });

    expect(response.status).toBe(200);
  });
});
