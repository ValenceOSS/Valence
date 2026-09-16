import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { LibraryAccessSchema } from '@ValenceContracts/schemas/LibraryAccess';
import type { Library, MediaDetail } from '@ValenceContracts/schemas/Library';
import type { Permission } from '@ValenceContracts/schemas/Permission';

const BASE = 'http://localhost:8420';

const FILMS = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';
const SHOWS = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const ARRIVAL = '9c858901-8a57-4791-81fe-4c455b099bc9';
const NOWHERE = '00000000-0000-4000-8000-000000000000';

const shelf = (id: string, name: string, kind: Library['kind']): Library => ({
  id,
  name,
  kind,
  path: `/media/${name.toLowerCase()}`,
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
});

const film: MediaDetail = {
  id: ARRIVAL,
  libraryId: FILMS,
  title: 'Arrival',
  year: 2016,
  container: 'mkv',
  durationSeconds: 7200,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  videoBitDepth: 8,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 1920,
  height: 1080,
  bitrateKbps: 8000,
  audioStreams: [{ index: 1, codec: 'eac3', channels: 6, isDefault: true, isAtmos: false }],
  subtitleStreams: [],
  addedAt: '2026-08-10T00:00:00.000Z',
  metadata: { hasPoster: true, hasBackdrop: true, hasLogo: false },
};

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();

  const library = createMemoryLibraryService({
    libraries: [shelf(FILMS, 'Films', 'movies'), shelf(SHOWS, 'Shows', 'shows')],
    media: [film],
    hidden: [],
    blocked: [],
  });

  const app = createApp({
    auth,
    settings,
    permissions,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(),
    library,
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    profiles: createMemoryProfileService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });

  return { app, library, permissions, store };
};

/**
 * Signs somebody up, gives them exactly the permissions named at the rank asked for, and hands back
 * a way to ask as them.
 */
const signedInWith = async (
  context: ReturnType<typeof build>,
  held: readonly Permission[],
  position = 50,
) => {
  const response = await context.app.request(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE },
    body: JSON.stringify({ name: 'Dan', email: 'dan@valence.local', password: 'a-long-password' }),
  });

  const cookie = response.headers.get('set-cookie') ?? '';
  const accountId = context.store.user[0]?.id ?? '';

  const role = await context.permissions.createRole({
    name: `Purpose-made ${String(position)}`,
    position,
    permissions: [...held],
  });

  await context.permissions.assignRole(accountId, role.id);

  return {
    accountId,
    ask: (path: string, method = 'GET') =>
      context.app.request(`${BASE}${path}`, { method, headers: { cookie, origin: BASE } }),
  };
};

let context: ReturnType<typeof build>;

beforeEach(() => {
  context = build();
});

describe('reading which libraries an account may see', () => {
  it('lists every library, and says an untouched account sees them all', async () => {
    const me = await signedInWith(context, ['account.manage']);

    const read = LibraryAccessSchema.parse(
      await (await me.ask(`/api/admin/accounts/${me.accountId}/libraries`)).json(),
    );

    expect(read.libraries).toEqual([
      expect.objectContaining({ id: FILMS, name: 'Films', mayView: true }),
      expect.objectContaining({ id: SHOWS, name: 'Shows', mayView: true }),
    ]);
  });

  it('is for somebody who manages accounts, not for anybody signed in', async () => {
    const me = await signedInWith(context, []);

    expect((await me.ask(`/api/admin/accounts/${me.accountId}/libraries`)).status).toBe(403);
  });

  it('shows a library as unseen once it has been taken away', async () => {
    const me = await signedInWith(context, ['account.manage']);

    await me.ask(`/api/admin/accounts/${me.accountId}/libraries/${FILMS}`, 'DELETE');

    const read = LibraryAccessSchema.parse(
      await (await me.ask(`/api/admin/accounts/${me.accountId}/libraries`)).json(),
    );

    expect(read.libraries.find((one) => one.id === FILMS)?.mayView).toBe(false);
    expect(read.libraries.find((one) => one.id === SHOWS)?.mayView).toBe(true);
  });

  it('answers for every library rather than only the ones the actor can see', async () => {
    const me = await signedInWith(context, ['account.manage']);

    await me.ask(`/api/admin/accounts/${me.accountId}/libraries/${FILMS}`, 'DELETE');

    const read = LibraryAccessSchema.parse(
      await (await me.ask(`/api/admin/accounts/${me.accountId}/libraries`)).json(),
    );

    expect(read.libraries).toHaveLength(2);
  });
});

describe('taking a library away', () => {
  it('stops that account reaching anything in it', async () => {
    const me = await signedInWith(context, ['account.manage']);

    expect((await me.ask(`/api/media/${ARRIVAL}`)).status).toBe(200);

    await me.ask(`/api/admin/accounts/${me.accountId}/libraries/${FILMS}`, 'DELETE');

    expect((await me.ask(`/api/media/${ARRIVAL}`)).status).toBe(404);
  });

  it('takes it off their shelf as well', async () => {
    const me = await signedInWith(context, ['account.manage']);

    await me.ask(`/api/admin/accounts/${me.accountId}/libraries/${FILMS}`, 'DELETE');

    const shelves = z
      .array(z.object({ id: z.string() }))
      .parse(await (await me.ask('/api/libraries')).json());

    expect(shelves.map((one) => one.id)).not.toContain(FILMS);
  });

  it('can be asked twice without complaining', async () => {
    const me = await signedInWith(context, ['account.manage']);
    const path = `/api/admin/accounts/${me.accountId}/libraries/${FILMS}`;

    expect((await me.ask(path, 'DELETE')).status).toBe(204);
    expect((await me.ask(path, 'DELETE')).status).toBe(204);
    expect(context.library.state.blocked).toHaveLength(1);
  });

  it('refuses a library that is not there', async () => {
    const me = await signedInWith(context, ['account.manage']);

    expect(
      (await me.ask(`/api/admin/accounts/${me.accountId}/libraries/${NOWHERE}`, 'DELETE')).status,
    ).toBe(404);
  });
});

describe('giving one back', () => {
  it('lets them reach it again', async () => {
    const me = await signedInWith(context, ['account.manage']);
    const path = `/api/admin/accounts/${me.accountId}/libraries/${FILMS}`;

    await me.ask(path, 'DELETE');
    expect((await me.ask(`/api/media/${ARRIVAL}`)).status).toBe(404);

    expect((await me.ask(path, 'PUT')).status).toBe(204);
    expect((await me.ask(`/api/media/${ARRIVAL}`)).status).toBe(200);
  });

  it('says nothing is wrong where they could already reach it', async () => {
    const me = await signedInWith(context, ['account.manage']);

    expect(
      (await me.ask(`/api/admin/accounts/${me.accountId}/libraries/${FILMS}`, 'PUT')).status,
    ).toBe(204);
  });
});

describe('who may decide', () => {
  it('will not let somebody act on an account that outranks them', async () => {
    const me = await signedInWith(context, ['account.manage'], 10);

    const senior = await context.permissions.createRole({
      name: 'Senior',
      position: 90,
      permissions: [],
    });

    const theirs = 'somebody-else';

    await context.permissions.assignRole(theirs, senior.id);

    expect((await me.ask(`/api/admin/accounts/${theirs}/libraries`)).status).toBe(403);
    expect(
      (await me.ask(`/api/admin/accounts/${theirs}/libraries/${FILMS}`, 'DELETE')).status,
    ).toBe(403);
  });

  it('lets them act on an account below their own rank', async () => {
    const me = await signedInWith(context, ['account.manage'], 90);

    const junior = await context.permissions.createRole({
      name: 'Junior',
      position: 10,
      permissions: [],
    });

    const theirs = 'somebody-else';

    await context.permissions.assignRole(theirs, junior.id);

    expect((await me.ask(`/api/admin/accounts/${theirs}/libraries`)).status).toBe(200);
  });
});
