import { describe, expect, it } from 'vitest';
import { z } from 'zod';
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
import { LibrarySchema, MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { uuidOfJellyfinId } from './uuidOfJellyfinId';

const BASE = 'http://localhost:8420';

const LIBRARY_ID = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';

const FILM_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

const CREDENTIALS = {
  name: 'Marnie',
  email: 'marnie@valence.local',
  password: 'a-long-enough-password',
  username: 'marnie',
};

const AUTHORIZATION =
  'MediaBrowser Client="Findroid", Device="Pixel 8", DeviceId="pixel8abcdef", Version="0.15.0"';

const SignedInSchema = z.object({
  AccessToken: z.string(),
  User: z.object({ Id: z.string(), Name: z.string() }),
});

/**
 * A server with one film, one account with two profiles, and the Jellyfin endpoints on it.
 *
 * @returns How to ask it as a Jellyfin app, and its watch progress.
 */
const aServer = async () => {
  const { auth, settings } = createMemoryAuth();
  const profiles = createMemoryProfileService();
  const progress = createMemoryWatchProgressService();
  const app = createApp({
    auth,
    settings,
    permissions: createMemoryPermissionService(),
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({
      libraries: [
        LibrarySchema.parse({
          id: LIBRARY_ID,
          name: 'Films',
          kind: 'movies',
          path: '/media/films',
          itemCount: 1,
          lastScannedAt: null,
          defaultAudioLanguage: null,
          filesAtOnce: null,
        }),
      ],
      media: [
        MediaDetailSchema.parse({
          id: FILM_ID,
          libraryId: LIBRARY_ID,
          title: 'Arrival',
          year: 2016,
          container: 'mkv',
          durationSeconds: 7200,
          videoCodec: 'h264',
          videoRange: 'SDR',
          width: 1920,
          height: 1080,
          bitrateKbps: 8000,
          audioStreams: [{ index: 1, codec: 'aac', channels: 2, isDefault: true, isAtmos: false }],
          subtitleStreams: [],
          addedAt: '2026-08-10T00:00:00.000Z',
          metadata: { hasPoster: false, hasBackdrop: false, hasLogo: false },
        }),
      ],
    }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress,
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    profiles,
  });

  await signUpForTest(app, auth, CREDENTIALS);

  const ask = (path: string, init: RequestInit & { token?: string } = {}) => {
    const { token, ...rest } = init;
    const headers = new Headers(rest.headers);

    headers.set(
      'x-emby-authorization',
      token === undefined ? AUTHORIZATION : `${AUTHORIZATION}, Token="${token}"`,
    );

    return app.request(`${BASE}/jellyfin${path}`, { ...rest, headers });
  };

  const signIn = (username: string, password = CREDENTIALS.password) =>
    ask('/Users/AuthenticateByName', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ Username: username, Pw: password }),
    });

  return { ask, signIn, profiles, progress };
};

describe('Valence answering as a Jellyfin server', () => {
  it('signs in with an email or a username as the account’s own profile', async () => {
    const { signIn } = await aServer();

    for (const username of ['marnie@valence.local', 'MARNIE']) {
      const answer = await signIn(username);

      expect(answer.status).toBe(200);
      expect(SignedInSchema.parse(await answer.json()).User.Name).toBe('Marnie');
    }
  });

  it('refuses a wrong password', async () => {
    const { signIn } = await aServer();
    const answer = await signIn('marnie', 'not-the-password');

    expect(answer.status).toBe(401);
    expect(await answer.json()).toMatchObject({
      code: 'server.jellyfin.thatNameOrPasswordIsWrong',
    });
  });

  it('signs in as another profile named after a #, and refuses one locked with a PIN', async () => {
    const { signIn, profiles } = await aServer();
    const first = SignedInSchema.parse(await (await signIn('marnie')).json());
    const owner = (await profiles.accountOf(uuidOfJellyfinId(first.User.Id) ?? '')) ?? '';

    expect(owner).not.toBe('');

    await profiles.create(owner, { name: 'Kid', colour: '#3ac47d' });

    const locked = await profiles.create(owner, { name: 'Locked', colour: '#e8503a' });

    await profiles.setPin(locked.id, 'a-hash');

    const kid = await signIn('marnie#kid');

    expect(SignedInSchema.parse(await kid.json()).User.Name).toBe('Kid');
    expect((await signIn('marnie#Locked')).status).toBe(403);
    expect((await signIn('marnie#Nobody')).status).toBe(404);
  });

  it('answers as the signed-in session, and refuses once it signs out', async () => {
    const { signIn, ask } = await aServer();
    const { AccessToken } = SignedInSchema.parse(await (await signIn('marnie')).json());

    expect((await ask('/Users/Me', { token: AccessToken })).status).toBe(200);
    expect((await ask('/Sessions/Logout', { method: 'POST', token: AccessToken })).status).toBe(
      204,
    );
    expect((await ask('/Users/Me', { token: AccessToken })).status).toBe(401);
  });

  it('lists the libraries and films the profile may see', async () => {
    const { signIn, ask } = await aServer();
    const { AccessToken } = SignedInSchema.parse(await (await signIn('marnie')).json());
    const views = await (await ask('/UserViews', { token: AccessToken })).json();
    const films = await (
      await ask('/Items?IncludeItemTypes=Movie&Recursive=true', { token: AccessToken })
    ).json();

    expect(views).toMatchObject({ Items: [{ Name: 'Films', CollectionType: 'movies' }] });
    expect(films).toMatchObject({ TotalRecordCount: 1, Items: [{ Name: 'Arrival' }] });
  });

  it('writes where playback got to into the profile’s own watch progress', async () => {
    const { signIn, ask, progress } = await aServer();
    const signedIn = SignedInSchema.parse(await (await signIn('marnie')).json());

    await ask('/Sessions/Playing/Progress', {
      method: 'POST',
      token: signedIn.AccessToken,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ItemId: FILM_ID.replaceAll('-', ''), PositionTicks: 6_000_000_000 }),
    });

    const [kept] = await progress.list(uuidOfJellyfinId(signedIn.User.Id) ?? '');

    expect(kept).toMatchObject({ mediaId: FILM_ID, positionSeconds: 600, isFinished: false });
  });

  it('matches its addresses whatever their case', async () => {
    const { ask } = await aServer();

    expect((await ask('/system/info/public')).status).toBe(200);
    expect((await ask('/SYSTEM/INFO/PUBLIC')).status).toBe(200);
  });
});
