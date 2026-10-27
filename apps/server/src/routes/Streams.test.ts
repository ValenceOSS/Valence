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
import { aDeviceProfile } from '@ValenceServer/testing/aDeviceProfile';
import { TranscoderError } from '@ValenceServer/transcoder/TranscoderClient';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

const STREAMED = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const HELD = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

const build = async (
  play: StreamService['play'],
  isStreaming = true,
  held: GrantedPermission[] = ['sources.play'],
) => {
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
      ? {
          service: { offersFor, play },
          libraryId: () => Promise.resolve('streamed-library'),
          isStreamed: (mediaId) => Promise.resolve(mediaId === STREAMED),
        }
      : null,
  });
  const cookie = await signUpForTest(app, auth);
  const role = await permissions.createRole({
    name: 'Streams',
    position: 200,
    color: null,
    permissions: held,
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
      .mockRejectedValueOnce(refusalOf('limitReached', 'Example files'))
      .mockRejectedValueOnce(new TranscoderError('the relay answered 503', 503));
    const { request } = await build(play);

    expect(await (await request('/api/streams/play', 'POST', { streamId: 'a' })).json()).toEqual({
      kind: 'ready',
      mediaId: 'm1',
    });
    expect((await request('/api/streams/play', 'POST', { streamId: 'a' })).status).toBe(410);

    const refused = await request('/api/streams/play', 'POST', { streamId: 'a' });

    expect(refused.status).toBe(409);
    expect(await refused.json()).toMatchObject({ problem: 'sourceLimit' });

    const unread = await request('/api/streams/play', 'POST', { streamId: 'a' });

    expect(unread.status).toBe(409);
    expect(await unread.json()).toMatchObject({ problem: 'sourceUnreachable' });
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

  it('plays a kept film from a source only for somebody who may still play from sources', async () => {
    const may = await build(() => Promise.resolve(null));
    const mayNot = await build(() => Promise.resolve(null), true, []);
    const session = { deviceProfile: aDeviceProfile() };

    const refused = await mayNot.request(`/api/playback/${STREAMED}/session`, 'POST', session);

    expect(refused.status).toBe(403);
    expect(await refused.json()).toMatchObject({ problem: 'unreadable' });
    expect((await mayNot.request(`/api/playback/${STREAMED}/file`)).status).toBe(403);
    expect((await mayNot.request(`/api/playback/${HELD}/file`)).status).toBe(404);
    expect((await may.request(`/api/playback/${STREAMED}/session`, 'POST', session)).status).toBe(
      404,
    );
  });
});
