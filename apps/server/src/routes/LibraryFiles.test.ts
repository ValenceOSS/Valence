import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
import { createFolderDisk } from '@ValenceServer/folders/createFolderDisk';
import { aLibraryAt } from '@ValenceServer/files/aLibraryAt';
import {
  ChangedEntrySchema,
  LibraryFileSearchSchema,
  LibraryFolderSchema,
} from '@ValenceContracts/schemas/LibraryFiles';

const BASE = 'http://localhost:8420';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'valence-file-routes-'));
  await mkdir(join(root, 'Arrival (2016)'));
  await writeFile(join(root, 'Arrival (2016)', 'Arrival (2016).mkv'), 'a film');
  await writeFile(join(root, 'Dune.mkv'), 'a film');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/**
 * Builds the app over a library in a folder of the test's own, signed in as somebody.
 *
 * @param isAdministrator - Whether they may change libraries.
 * @returns How to ask it things, and the library service behind it.
 */
const build = async (isAdministrator = true) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const library = createMemoryLibraryService({ libraries: [aLibraryAt(root)], media: [] });
  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library,
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    profiles: createMemoryProfileService(),
    presence: createPresenceService(),
    folderDisk: createFolderDisk(),
  });
  const cookie = await signUpForTest(app, {
    name: 'Marques',
    email: 'marques@valence.local',
    password: 'a-long-enough-password',
  });
  const user = store.user[0];

  if (isAdministrator && user !== undefined) {
    user.role = 'admin';

    await makeAdministrator(permissions, user.id);
  }

  /**
   * Asks the app something as the one signed in.
   *
   * @param path - Where, after the files API.
   * @param method - How.
   * @param body - What to send as JSON, if anything.
   * @returns The response.
   */
  const send = async (
    path: string,
    method = 'GET',
    body: Record<string, string> | null = null,
  ): Promise<Response> =>
    app.request(`${BASE}/api/admin/files${path}`, {
      method,
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      body: body === null ? null : JSON.stringify(body),
    });

  return { send, library };
};

const at = (path: string) => `?${new URLSearchParams({ path }).toString()}`;

describe('the file manager over HTTP', () => {
  it('shows nothing to somebody who may not change libraries', async () => {
    const { send } = await build(false);

    expect((await send('')).status).toBe(403);
    expect((await send(at(join(root, 'Dune.mkv')), 'DELETE')).status).toBe(403);
    expect(await readdir(root)).toContain('Dune.mkv');
  });

  it('lists the libraries, then what is in one', async () => {
    const { send } = await build();

    const places = LibraryFolderSchema.parse(await (await send('')).json());

    expect(places.entries.map((entry) => entry.path)).toEqual([root]);

    const inside = LibraryFolderSchema.parse(await (await send(at(root))).json());

    expect(inside.entries.map((entry) => entry.name)).toEqual(['Arrival (2016)', 'Dune.mkv']);
  });

  it('refuses a folder outside every library', async () => {
    const { send } = await build();

    expect((await send(at(tmpdir()))).status).toBe(403);
  });

  it('finds files by name below a folder', async () => {
    const { send } = await build();

    const found = LibraryFileSearchSchema.parse(
      await (
        await send(`/search?${new URLSearchParams({ words: 'arrival', within: root }).toString()}`)
      ).json(),
    );

    expect(found.entries.map((entry) => entry.name)).toEqual([
      'Arrival (2016)',
      'Arrival (2016).mkv',
    ]);
  });

  it('renames, moves and deletes, and has the library scan after each', async () => {
    const { send, library } = await build();
    const scan = vi.spyOn(library, 'scan');

    const renamed = await send('/rename', 'POST', {
      path: join(root, 'Dune.mkv'),
      name: 'Dune (2021).mkv',
    });

    expect(renamed.status).toBe(200);
    expect(ChangedEntrySchema.parse(await renamed.json()).path).toBe(join(root, 'Dune (2021).mkv'));

    const moved = await send('/move', 'POST', {
      path: join(root, 'Dune (2021).mkv'),
      into: join(root, 'Arrival (2016)'),
    });

    expect(moved.status).toBe(200);
    expect(await readdir(join(root, 'Arrival (2016)'))).toContain('Dune (2021).mkv');

    expect((await send(at(join(root, 'Arrival (2016)')), 'DELETE')).status).toBe(200);
    expect(await readdir(root)).toEqual([]);
    expect(scan).toHaveBeenCalledTimes(3);
  });

  it('says why it would not, in words and a status', async () => {
    const { send } = await build();

    const clash = await send('/rename', 'POST', {
      path: join(root, 'Dune.mkv'),
      name: 'Arrival (2016)',
    });

    expect(clash.status).toBe(409);
    expect((await send(at(root), 'DELETE')).status).toBe(400);
    expect((await send(at(join(root, 'Gone.mkv')), 'DELETE')).status).toBe(404);
    expect(
      (await send('/rename', 'POST', { path: join(root, 'Dune.mkv'), name: '../Dune.mkv' })).status,
    ).toBe(400);
  });
});
