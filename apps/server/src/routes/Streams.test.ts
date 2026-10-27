import { describe, expect, it, vi } from 'vitest';
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
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { refusalOf } from '@ValenceServer/streamSources/refusalOf';
import type { StreamService } from '@ValenceServer/streamSources/createStreamService';

const build = async (play: StreamService['play'], isStreaming = true) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const offersFor = vi.fn(() => Promise.resolve({ offers: [], problems: [] }));
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
    profiles: createMemoryProfileService(),
    describeForRequest: (tmdbId) =>
      Promise.resolve(
        tmdbId === 603 ? { title: 'A film', year: 1999, imdbId: 'tt0133093' } : null,
      ).then((found) =>
        found === null
          ? null
          : {
              aliases: [],
              overview: null,
              posterUrl: null,
              runtimeMinutes: null,
              releaseDates: { theatrical: null, digital: null, physical: null },
              episodes: [],
              isEnded: false,
              artist: null,
              albums: [],
              ...found,
            },
      ),
    streaming: isStreaming
      ? { service: { offersFor, play }, libraryId: () => Promise.resolve('streamed-library') }
      : null,
  });
  const cookie = await signUpForTest(app, auth);
  const role = await permissions.createRole({
    name: 'Streams',
    position: 200,
    color: null,
    permissions: ['sources.play'],
  });

  await permissions.assignRole(store.user[0]?.id ?? '', role.id);

  const request = (path: string, method = 'GET', body?: object) =>
    app.request(`${TEST_ORIGIN}${path}`, {
      method,
      headers: {
        cookie,
        origin: TEST_ORIGIN,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  return { app, request, offersFor };
};

describe('playing films from sources', () => {
  it('lists what can play a film, named as the catalogue names it', async () => {
    const { request, offersFor } = await build(() => Promise.resolve(null));

    expect((await request('/api/streams/films/603?fresh=true')).status).toBe(200);
    expect(offersFor).toHaveBeenCalledWith(
      {
        kind: 'film',
        catalogueId: '603',
        tmdbId: '603',
        imdbId: 'tt0133093',
        title: 'A film',
        year: 1999,
      },
      true,
    );
    expect((await request('/api/streams/films/604')).status).toBe(404);
  });

  it('plays an offer, says one it no longer holds has gone, and passes on a source’s refusal', async () => {
    const play = vi
      .fn<StreamService['play']>()
      .mockResolvedValueOnce({ kind: 'ready', mediaId: 'm1' })
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(refusalOf('limitReached', 'Example files'));
    const { request } = await build(play);

    expect(await (await request('/api/streams/play', 'POST', { streamId: 'a' })).json()).toEqual({
      kind: 'ready',
      mediaId: 'm1',
    });
    expect((await request('/api/streams/play', 'POST', { streamId: 'a' })).status).toBe(410);

    const refused = await request('/api/streams/play', 'POST', { streamId: 'a' });

    expect(refused.status).toBe(409);
    expect(await refused.json()).toMatchObject({ problem: 'sourceLimit' });
  });

  it('names the hidden library, and refuses everything where films are not played from sources', async () => {
    const streaming = await build(() => Promise.resolve(null));
    const not = await build(() => Promise.resolve(null), false);

    expect(await (await streaming.request('/api/streams/library')).json()).toEqual({
      libraryId: 'streamed-library',
    });
    expect((await not.request('/api/streams/films/603')).status).toBe(403);
    expect((await not.request('/api/streams/library')).status).toBe(403);
  });

  it('answers nobody who is not signed in', async () => {
    const { app } = await build(() => Promise.resolve(null));

    expect(
      (
        await app.request(`${TEST_ORIGIN}/api/streams/films/603`, {
          headers: { origin: TEST_ORIGIN },
        })
      ).status,
    ).toBe(401);
  });
});
