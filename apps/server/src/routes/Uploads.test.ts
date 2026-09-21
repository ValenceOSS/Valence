import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest, makeAdministrator } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createPresenceService } from '@ValenceServer/presence/PresenceService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { UploadDisk, UploadResult } from '@ValenceServer/uploads/UploadDisk';

const BASE = 'http://localhost:8420';

const CREDENTIALS = {
  name: 'Marques',
  email: 'marques@valence.local',
  password: 'a-long-enough-password',
};

const LIBRARY_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const LIBRARIES: Library[] = [
  {
    id: LIBRARY_ID,
    name: 'Films',
    kind: 'movies',
    path: '/media/films',
    itemCount: 0,
    lastScannedAt: null,
    defaultAudioLanguage: null,
    filesAtOnce: null,
    takesRequests: true,
    requestProfileId: null,
    requestPath: null,
  },
];

const build = (answer: UploadResult = { kind: 'written', bytes: 6 }) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const write = vi.fn<UploadDisk['write']>(() => Promise.resolve(answer));

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService({ libraries: LIBRARIES, media: [] }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    profiles: createMemoryProfileService(),
    presence: createPresenceService(),
    uploadDisk: { write },
  });

  return { app, store, permissions, write };
};

const signIn = async (
  { app, store, permissions }: ReturnType<typeof build>,
  isAdministrator: boolean,
): Promise<string> => {
  const cookie = await signUpForTest(app, CREDENTIALS);
  const user = store.user[0];

  if (isAdministrator && user !== undefined) {
    user.role = 'admin';

    await makeAdministrator(permissions, user.id);
  }

  return cookie;
};

const upload = (
  built: ReturnType<typeof build>,
  cookie: string,
  path: string,
  id: string = LIBRARY_ID,
): Promise<Response> =>
  Promise.resolve(
    built.app.request(
      `${BASE}/api/libraries/${id}/uploads?${new URLSearchParams({ path }).toString()}`,
      {
        method: 'POST',
        headers: { cookie, origin: BASE, 'content-type': 'application/octet-stream' },
        body: 'a film',
      },
    ),
  );

describe('uploading media over HTTP', () => {
  it('lets nobody upload who could not edit libraries', async () => {
    const built = build();
    const cookie = await signIn(built, false);

    expect((await upload(built, cookie, 'Arrival.mkv')).status).toBe(403);
    expect(built.write).not.toHaveBeenCalled();
  });

  it('writes the file where its path says inside the library, for an administrator', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    const response = await upload(built, cookie, 'Arrival (2016)/Arrival (2016).mkv');

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      path: 'Arrival (2016)/Arrival (2016).mkv',
      bytes: 6,
    });
    expect(built.write).toHaveBeenCalledWith(
      '/media/films/Arrival (2016)/Arrival (2016).mkv',
      expect.anything(),
    );
  });

  it('says there is no such library', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    expect(
      (await upload(built, cookie, 'Arrival.mkv', '11111111-1111-4111-8111-111111111111')).status,
    ).toBe(404);
  });

  it('refuses a path that climbs out of the library, or into what Valence keeps', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    expect((await upload(built, cookie, '../Arrival.mkv')).status).toBe(400);
    expect((await upload(built, cookie, '.valence/Arrival.mkv')).status).toBe(400);
    expect(built.write).not.toHaveBeenCalled();
  });

  it('refuses a file the library would not read', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    expect((await upload(built, cookie, 'notes.txt')).status).toBe(415);
    expect(built.write).not.toHaveBeenCalled();
  });

  it('says so when a file is already there', async () => {
    const built = build({ kind: 'exists' });
    const cookie = await signIn(built, true);

    expect((await upload(built, cookie, 'Arrival.mkv')).status).toBe(409);
  });

  it('says a read-only disk is read-only, and what to do about it', async () => {
    const built = build({ kind: 'readOnly' });
    const cookie = await signIn(built, true);

    const response = await upload(built, cookie, 'Arrival.mkv');

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: 'That disk is read-only to Valence. Give it read-write access to upload media there.',
    });
  });

  it('refuses a place Valence is not allowed to write', async () => {
    const built = build({ kind: 'denied' });
    const cookie = await signIn(built, true);

    expect((await upload(built, cookie, 'Arrival.mkv')).status).toBe(403);
  });

  it('says so when the file could not be written for any other reason', async () => {
    const built = build({ kind: 'failed' });
    const cookie = await signIn(built, true);

    expect((await upload(built, cookie, 'Arrival.mkv')).status).toBe(500);
  });

  it('refuses a request with no file in it', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    const response = await built.app.request(
      `${BASE}/api/libraries/${LIBRARY_ID}/uploads?path=Arrival.mkv`,
      { method: 'POST', headers: { cookie, origin: BASE } },
    );

    expect(response.status).toBe(400);
  });
});
