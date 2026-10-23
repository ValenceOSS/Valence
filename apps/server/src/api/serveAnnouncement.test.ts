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
import type { RealtimePublisher } from '@ValenceServer/realtime/RealtimePublisher';

const AnswerSchema = z.object({
  announcement: z.object({ id: z.string(), text: z.string(), severity: z.string() }).nullable(),
});

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const publish = vi.fn<RealtimePublisher['publish']>();

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
    realtime: { publish, recheck: vi.fn(), recheckAll: vi.fn() },
  });

  return {
    publish,
    administrator: signedInApp(app, { auth, store, permissions, isAdministrator: true }),
    viewer: signedInApp(app, { auth, store, permissions }),
  };
};

const post = (body: object) => ({
  method: 'PUT',
  headers: { 'content-type': 'application/json', origin: TEST_ORIGIN },
  body: JSON.stringify(body),
});

describe('the announcement', () => {
  it('is nothing until an administrator posts one', async () => {
    const { viewer } = build();
    const answer = await viewer.request(`${TEST_ORIGIN}/api/announcement`);

    expect(AnswerSchema.parse(await answer.json()).announcement).toBeNull();
  });

  it('is posted by an administrator, shown to everybody, and announced over the socket', async () => {
    const { administrator, publish } = build();

    const posted = await administrator.request(
      `${TEST_ORIGIN}/api/admin/announcement`,
      post({ text: 'Back at six', severity: 'warning' }),
    );

    expect(posted.status).toBe(200);
    expect(publish).toHaveBeenCalledWith('announcement', { changed: true }, { kind: 'everyone' });

    const read = await administrator.request(`${TEST_ORIGIN}/api/announcement`);

    expect(AnswerSchema.parse(await read.json()).announcement).toMatchObject({
      text: 'Back at six',
      severity: 'warning',
    });
  });

  it('is gone once its end has passed', async () => {
    const { administrator } = build();

    await administrator.request(
      `${TEST_ORIGIN}/api/admin/announcement`,
      post({ text: 'Earlier', endsAt: '2020-01-01T00:00:00.000Z' }),
    );

    const read = await administrator.request(`${TEST_ORIGIN}/api/announcement`);

    expect(AnswerSchema.parse(await read.json()).announcement).toBeNull();
  });

  it('is taken down by an administrator', async () => {
    const { administrator } = build();

    await administrator.request(`${TEST_ORIGIN}/api/admin/announcement`, post({ text: 'Hi' }));
    await administrator.request(`${TEST_ORIGIN}/api/admin/announcement`, {
      method: 'DELETE',
      headers: { origin: TEST_ORIGIN },
    });

    const read = await administrator.request(`${TEST_ORIGIN}/api/announcement`);

    expect(AnswerSchema.parse(await read.json()).announcement).toBeNull();
  });

  it('cannot be posted by somebody who is not an administrator', async () => {
    const { viewer } = build();

    const refused = await viewer.request(
      `${TEST_ORIGIN}/api/admin/announcement`,
      post({ text: 'Free pizza' }),
    );

    expect(refused.status).toBe(403);
  });

  it('refuses an announcement it cannot read', async () => {
    const { administrator } = build();

    const refused = await administrator.request(
      `${TEST_ORIGIN}/api/admin/announcement`,
      post({ text: '' }),
    );

    expect(refused.status).toBe(400);
  });
});
