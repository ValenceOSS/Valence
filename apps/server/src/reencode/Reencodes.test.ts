import { describe, expect, it } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { signedInApp } from '@ValenceServer/auth/signUpForTest';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { ReencodeEstimateSchema, ReencodeListSchema, ReencodeStartedSchema } from '@ValenceContracts/schemas/Reencode';
import { RenditionListSchema } from '@ValenceContracts/schemas/Rendition';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { createMemoryReencodeService } from './createMemoryReencodeService';
import type { HeldItem,CreateMemoryReencodeServiceOptions } from './createMemoryReencodeService';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { Rendition } from '@ValenceContracts/schemas/Rendition';

const BASE = 'http://localhost:8420';
const LIBRARY_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const MEDIA_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

const remux: MediaItem = {
  id: MEDIA_ID,
  title: 'Harry Potter and the Prisoner of Azkaban',
  container: 'mkv',
  durationSeconds: 8520,
  videoCodec: 'h264',
  videoRange: 'SDR',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 3840,
  height: 2160,
  bitrateKbps: 66000,
  sizeBytes: 70_000_000_000,
  audioStreams: [
    { index: 1, codec: 'truehd', channels: 8, language: 'eng', isDefault: true, isAtmos: true },
  ],
  subtitleStreams: [],
};

const held: HeldItem = {
  item: remux,
  title: remux.title,
  seriesTitle: null,
  libraryId: LIBRARY_ID,
};

const replacing = {
  mode: 'replace',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
} as const;

const build = (options: CreateMemoryReencodeServiceOptions = { items: [held] }) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const reencodes = createMemoryReencodeService(options);

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({ libraries: [], media: [] }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    reencodes,
  });

  return { app, store, permissions, reencodes, settings };
};

const asAdministrator = (options?: CreateMemoryReencodeServiceOptions) => {
  const context = build(options);

  return {
    ...context,
    signedIn: signedInApp(context.app, {
      store: context.store,
      permissions: context.permissions,
      settings: context.settings,
      isAdministrator: true,
    }),
  };
};

const readJson = async (response: Response) => JsonValueSchema.parse(await response.json());

describe('re-encoding over the API', () => {
  it('will not weigh anything for somebody who is not signed in', async () => {
    const { app } = build();

    const response = await app.request(`${BASE}/api/reencodes/estimate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing }),
    });

    expect(response.status).toBe(401);
  });

  it('refuses a signed-in account that does not hold the permission for it', async () => {
    const context = build();
    const signedIn = signedInApp(context.app, {
      store: context.store,
      permissions: context.permissions,
    });

    const response = await signedIn.request(`${BASE}/api/reencodes/estimate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing }),
    });

    expect(response.status).toBe(403);
  });

  it('refuses one that holds only the ordinary media permissions', async () => {
    const context = build();
    const signedIn = signedInApp(context.app, {
      store: context.store,
      permissions: context.permissions,
    });

    const response = await signedIn.request(`${BASE}/api/reencodes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing }),
    });

    expect(response.status).toBe(403);
  });

  it('says what is held now and what would be held after', async () => {
    const { signedIn } = asAdministrator();

    const response = await signedIn.request(`${BASE}/api/reencodes/estimate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing }),
    });

    const estimate = ReencodeEstimateSchema.parse(await readJson(response));

    expect(response.status).toBe(200);
    expect(estimate.nowBytes).toBe(70_000_000_000);
    expect(estimate.afterBytes).toBeLessThan(estimate.nowBytes);
  });

  it('says the total goes up rather than down when the encode is kept alongside', async () => {
    const { signedIn } = asAdministrator();

    const response = await signedIn.request(`${BASE}/api/reencodes/estimate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing, mode: 'keep' }),
    });

    const estimate = ReencodeEstimateSchema.parse(await readJson(response));

    expect(estimate.afterBytes).toBeGreaterThan(estimate.nowBytes);
  });

  it('turns away a file somebody is watching, and says so', async () => {
    const { signedIn } = asAdministrator({
      items: [held],
      isBeingWatched: () => true,
    });

    const response = await signedIn.request(`${BASE}/api/reencodes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing }),
    });

    const started = ReencodeStartedSchema.parse(await readJson(response));

    expect(started.started).toHaveLength(0);
    expect(started.refused[0]?.refusal.code).toBe('BeingWatched');
  });

  it('turns away a folder it cannot write to', async () => {
    const { signedIn } = asAdministrator({
      items: [held],
      isFolderWritable: false,
    });

    const response = await signedIn.request(`${BASE}/api/reencodes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing }),
    });

    const started = ReencodeStartedSchema.parse(await readJson(response));

    expect(started.refused[0]?.refusal.code).toBe('FolderIsReadOnly');
  });

  it('queues what it accepts, and lists it afterwards', async () => {
    const { signedIn } = asAdministrator();

    await signedIn.request(`${BASE}/api/reencodes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing }),
    });

    const listed = ReencodeListSchema.parse(
      await readJson(await signedIn.request(`${BASE}/api/reencodes`)),
    );

    expect(listed.reencodes).toHaveLength(1);
    expect(listed.reencodes[0]?.state).toBe('queued');
  });

  it('will not queue the same file twice', async () => {
    const { signedIn } = asAdministrator();

    const queue = () =>
      signedIn.request(`${BASE}/api/reencodes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing }),
      });

    await queue();

    const again = ReencodeStartedSchema.parse(await readJson(await queue()));

    expect(again.started).toHaveLength(0);
    expect(again.refused[0]?.refusal.code).toBe('AlreadyUnderWay');
  });

  it('leaves a replacement awaiting judgement rather than finishing it', async () => {
    const { signedIn, reencodes } = asAdministrator();

    await signedIn.request(`${BASE}/api/reencodes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing }),
    });

    await reencodes.work(
      () => undefined,
      () => false,
    );

    const listed = ReencodeListSchema.parse(
      await readJson(await signedIn.request(`${BASE}/api/reencodes`)),
    );

    expect(listed.reencodes[0]?.state).toBe('awaitingReview');
  });

  it('finishes a kept rendition outright, since adding a file risks nothing', async () => {
    const { signedIn, reencodes } = asAdministrator();

    await signedIn.request(`${BASE}/api/reencodes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing, mode: 'keep' }),
    });

    await reencodes.work(
      () => undefined,
      () => false,
    );

    const listed = ReencodeListSchema.parse(
      await readJson(await signedIn.request(`${BASE}/api/reencodes`)),
    );

    expect(listed.reencodes[0]?.state).toBe('finished');
  });

  it('accepts a replacement only once somebody has judged it', async () => {
    const { signedIn, reencodes } = asAdministrator();

    await signedIn.request(`${BASE}/api/reencodes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing }),
    });

    const queued = (await reencodes.list())[0];

    expect(await reencodes.confirm(queued?.id ?? '')).toBe(false);

    await reencodes.work(
      () => undefined,
      () => false,
    );

    const confirmed = await signedIn.request(`${BASE}/api/reencodes/${queued?.id ?? ''}/confirm`, {
      method: 'POST',
    });

    expect(confirmed.status).toBe(200);
    expect((await reencodes.list())[0]?.state).toBe('finished');
  });

  it('puts the original back when somebody rejects the encode', async () => {
    const { signedIn, reencodes } = asAdministrator();

    await signedIn.request(`${BASE}/api/reencodes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mediaIds: [MEDIA_ID], ...replacing }),
    });

    await reencodes.work(
      () => undefined,
      () => false,
    );

    const waiting = (await reencodes.list())[0];

    const rejected = await signedIn.request(`${BASE}/api/reencodes/${waiting?.id ?? ''}/reject`, {
      method: 'POST',
    });

    expect(rejected.status).toBe(200);
    expect((await reencodes.list())[0]?.state).toBe('rejected');
  });

  it('answers with nothing for a re-encode that is not there', async () => {
    const { signedIn } = asAdministrator();

    const response = await signedIn.request(
      `${BASE}/api/reencodes/3f2504e0-4f89-41d3-9a0c-0305e82c3399/confirm`,
      { method: 'POST' },
    );

    expect(response.status).toBe(404);
  });

  it('lists what is kept beside an item', async () => {
    const rendition: Rendition = {
      id: '3f2504e0-4f89-41d3-9a0c-0305e82c3311',
      mediaItemId: MEDIA_ID,
      kind: 'pinned',
      label: '1080p HEVC',
      quality: '1080p',
      sizeBytes: 6_000_000_000,
      container: 'mkv',
      durationSeconds: 8520,
      bitrateKbps: 5500,
      videoCodec: 'hevc',
      videoRange: 'SDR',
      videoBitDepth: 8,
      canCopySegments: true,
      videoIsInterlaced: false,
      width: 1920,
      height: 1080,
      audioStreams: [
        { index: 1, codec: 'eac3', channels: 6, language: 'eng', isDefault: true, isAtmos: false },
      ],
      subtitleStreams: [],
      createdAt: '2026-09-18T22:00:00.000Z',
    };

    const { signedIn } = asAdministrator({ items: [held], renditions: [rendition] });

    const listed = RenditionListSchema.parse(
      await readJson(await signedIn.request(`${BASE}/api/media/${MEDIA_ID}/renditions`)),
    );

    expect(listed.renditions).toHaveLength(1);
    expect(listed.renditions[0]?.label).toBe('1080p HEVC');
  });
});
