import { describe, expect, it } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createAppContext } from '@ValenceServer/api/createAppContext';
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
import { jellyfinBackendOf } from './jellyfinBackendOf';
import { aJellyfinOrigin } from './testing/aJellyfinOrigin';

const CREDENTIALS = {
  name: 'Marnie',
  email: 'marnie@valence.local',
  password: 'a-long-enough-password',
};

/**
 * What the Jellyfin endpoints are answered with, on a server with one account, and a request that
 * asks that server's own endpoints.
 *
 * @returns The backend and how a request reaches the server.
 */
const aBackend = async () => {
  const { auth, settings } = createMemoryAuth();
  const options = {
    auth,
    settings,
    permissions: createMemoryPermissionService(),
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    profiles: createMemoryProfileService(),
  };
  const app = createApp(options);

  await signUpForTest(app, auth, CREDENTIALS);

  const origin = aJellyfinOrigin({
    url: 'http://localhost:8420/jellyfin/Users/AuthenticateByName',
    send: async (request) => app.request(request),
  });

  return { backend: jellyfinBackendOf(createAppContext(options)), origin };
};

describe('jellyfinBackendOf', () => {
  it('signs in through Valence’s own sign-in, as a session token', async () => {
    const { backend, origin } = await aBackend();
    const answer = await backend.signIn(
      { identifier: CREDENTIALS.email, profileName: null, password: CREDENTIALS.password },
      origin,
    );

    expect(answer.kind).toBe('signedIn');
    expect(answer.kind === 'signedIn' ? answer.caller.token.startsWith('s.') : false).toBe(true);
  });

  it('refuses a password Valence refuses', async () => {
    const { backend, origin } = await aBackend();

    expect(
      await backend.signIn(
        { identifier: CREDENTIALS.email, profileName: null, password: 'wrong-wrong-wrong' },
        origin,
      ),
    ).toMatchObject({ kind: 'refused', status: 401 });
  });

  it('knows nobody by a token Valence does not', async () => {
    const { backend, origin } = await aBackend();

    expect(await backend.callerOf('s.nothing', origin)).toBeNull();
    expect(await backend.callerOf('k.nothing', origin)).toBeNull();
  });

  it('names the server after its brand, or Valence', async () => {
    const { backend } = await aBackend();

    expect(await backend.serverName()).toBe('Valence');
    expect(await backend.serverId()).toMatch(/^[0-9a-f]{32}$/u);
  });
});
