import { describe, expect, it } from 'vitest';
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
import type { DirectoryMade, DirectoryRead, FolderDisk } from '@ValenceServer/folders/FolderDisk';

const BASE = 'http://localhost:8420';

const CREDENTIALS = {
  name: 'Marques',
  email: 'marques@valence.local',
  password: 'a-long-enough-password',
};

const TREE: Record<string, DirectoryRead> = {
  '/media': {
    kind: 'read',
    entries: [
      { name: 'films', isDirectory: true, isSymbolicLink: false },
      { name: '.trash', isDirectory: true, isSymbolicLink: false },
    ],
  },
  '/root': { kind: 'unreadable' },
};

const made = new Map<string, DirectoryMade>([
  ['/media/anime', 'made'],
  ['/media/films', 'exists'],
  ['/gone/anime', 'missing'],
  ['/mnt/ro/anime', 'readOnly'],
  ['/root/anime', 'denied'],
]);

const disk: FolderDisk = {
  readDirectory: (path) => Promise.resolve(TREE[path] ?? { kind: 'missing' }),
  isDirectory: () => Promise.resolve(false),
  roots: () => Promise.resolve(['/', '/Volumes']),
  makeDirectory: (path) => Promise.resolve(made.get(path) ?? 'denied'),
};

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();

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
    presence: createPresenceService(),
    folderDisk: disk,
  });

  return { app, store, permissions };
};

/**
 * Signs somebody up, and makes them an administrator where asked.
 *
 * @param built - The app, the account store and the permissions.
 * @param isAdministrator - Whether to give them the Administrator role.
 * @returns Their session cookie.
 */
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

/**
 * Asks the server for the folders inside one, as a signed-in account.
 *
 * @param built - The app.
 * @param cookie - Whose session to ask with.
 * @param path - The folder to ask about, or nothing for the places to start from.
 * @returns The answer.
 */
const ask = (built: ReturnType<typeof build>, cookie: string, path?: string): Promise<Response> =>
  Promise.resolve(
    built.app.request(
      `${BASE}/api/admin/folders${path === undefined ? '' : `?${new URLSearchParams({ path }).toString()}`}`,
      { headers: { cookie, origin: BASE } },
    ),
  );

describe('choosing a folder over HTTP', () => {
  it('shows nobody the disk who could not add a library', async () => {
    const built = build();
    const cookie = await signIn(built, false);

    expect((await ask(built, cookie)).status).toBe(403);
  });

  it('offers an administrator the places to start from', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    const response = await ask(built, cookie);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      path: null,
      parent: null,
      folders: [
        { name: '/', path: '/' },
        { name: '/Volumes', path: '/Volumes' },
      ],
      isTruncated: false,
    });
  });

  it('lists the folders inside one, leaving out the hidden ones', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    const response = await ask(built, cookie, '/media');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      path: '/media',
      parent: '/',
      folders: [{ name: 'films', path: '/media/films' }],
      isTruncated: false,
    });
  });

  it('says a folder that is not there is not found', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    expect((await ask(built, cookie, '/nowhere')).status).toBe(404);
  });

  it('refuses a folder it may not read, rather than calling it empty', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    const response = await ask(built, cookie, '/root');

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Valence is not allowed to read that folder.' });
  });

  it('refuses a path that does not start from the root', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    expect((await ask(built, cookie, 'media/films')).status).toBe(400);
  });
});

/**
 * Asks the server to make a folder, as a signed-in account.
 *
 * @param built - The app.
 * @param cookie - Whose session to ask with.
 * @param path - The folder to make it in.
 * @param name - What to call it.
 * @returns The answer.
 */
const make = (
  built: ReturnType<typeof build>,
  cookie: string,
  path: string,
  name: string,
): Promise<Response> =>
  Promise.resolve(
    built.app.request(`${BASE}/api/admin/folders`, {
      method: 'POST',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      body: JSON.stringify({ path, name }),
    }),
  );

describe('finding a folder over HTTP', () => {
  /**
   * Asks the server to find folders by name, as a signed-in account.
   *
   * @param built - The app.
   * @param cookie - Whose session to ask with.
   * @param query - The words, and where to look below.
   * @returns The answer.
   */
  const find = (
    built: ReturnType<typeof build>,
    cookie: string,
    query: Record<string, string>,
  ): Promise<Response> =>
    Promise.resolve(
      built.app.request(
        `${BASE}/api/admin/folders/search?${new URLSearchParams(query).toString()}`,
        { headers: { cookie, origin: BASE } },
      ),
    );

  it('finds nothing for somebody who could not add a library', async () => {
    const built = build();
    const cookie = await signIn(built, false);

    expect((await find(built, cookie, { words: 'films', within: '/media' })).status).toBe(403);
  });

  it('finds the folders whose names hold the words, leaving out the hidden ones', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    const response = await find(built, cookie, { words: 'fil', within: '/media' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      folders: [{ name: 'films', path: '/media/films' }],
      isTruncated: false,
    });
  });

  it('refuses a folder to look below that does not start from the root, or no words', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    expect((await find(built, cookie, { words: 'films', within: 'media' })).status).toBe(400);
    expect((await find(built, cookie, { words: '' })).status).toBe(400);
  });
});

describe('making a folder over HTTP', () => {
  it('lets nobody make one who could not add a library', async () => {
    const built = build();
    const cookie = await signIn(built, false);

    expect((await make(built, cookie, '/media', 'anime')).status).toBe(403);
  });

  it('makes one for an administrator, and says where it is', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    const response = await make(built, cookie, '/media', 'anime');

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ name: 'anime', path: '/media/anime' });
  });

  it('says so when something is already there, rather than pretending', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    expect((await make(built, cookie, '/media', 'films')).status).toBe(409);
  });

  it('says there is no such folder to make it in', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    expect((await make(built, cookie, '/gone', 'anime')).status).toBe(404);
  });

  it('says a read-only disk is read-only, and what to do about it', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    const response = await make(built, cookie, '/mnt/ro', 'anime');

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: 'That disk is read-only to Valence. Give it read-write access to make folders there.',
    });
  });

  it('refuses a place Valence is not allowed to write', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    expect((await make(built, cookie, '/root', 'anime')).status).toBe(403);
  });

  it('refuses a name that is a path, and a parent that is not from the root', async () => {
    const built = build();
    const cookie = await signIn(built, true);

    expect((await make(built, cookie, '/media', '../etc')).status).toBe(400);
    expect((await make(built, cookie, 'media', 'anime')).status).toBe(400);
  });
});
