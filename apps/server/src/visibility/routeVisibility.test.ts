import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { subjectOfRequest } from './subjectOfRequest';
import type { Library, MediaDetail } from '@ValenceContracts/schemas/Library';

const BASE = 'http://localhost:8420';

const FILMS = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';
const SHOWS = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const ARRIVAL = '9c858901-8a57-4791-81fe-4c455b099bc9';
const HEAT = '1b4e28ba-2fa1-11d2-883f-b9a761bde3fb';
const EPISODE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const CURB = 'c0a80101-0000-4000-8000-00000000cccc';

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

const film = (id: string, libraryId: string, title: string, extra = {}): MediaDetail => ({
  id,
  libraryId,
  title,
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
  metadata: {
    hasPoster: true,
    hasBackdrop: true,
    hasLogo: false,
    genres: [title],
    cast: [{ personId: 500, name: 'Somebody', role: 'Themselves', imageUrl: null }],
    ...extra,
  },
});

const build = () => {
  const profiles = createMemoryProfileService();
  const { auth, settings, store } = createMemoryAuth();

  const library = createMemoryLibraryService({
    libraries: [shelf(FILMS, 'Films', 'movies'), shelf(SHOWS, 'Shows', 'shows')],
    media: [
      film(ARRIVAL, FILMS, 'Arrival'),
      film(HEAT, FILMS, 'Heat'),
      film(EPISODE, SHOWS, 'Curb', { seriesTitle: 'Curb Your Enthusiasm', seasonNumber: 1 }),
    ],
    series: [{ id: CURB, title: 'Curb Your Enthusiasm' }],
    hidden: [],
    blocked: [],
  });

  const app = createApp({
    auth,
    settings,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(),
    library,
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    profiles,
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });

  return { app, library, profiles, store };
};

const CREDENTIALS = {
  name: 'Dan',
  email: 'dan@valence.local',
  password: 'a-long-enough-password',
};

/**
 * Signs somebody up and hands back the cookie, the account they are, and the face they watch as.
 */
const watching = async (context: ReturnType<typeof build>) => {
  const response = await context.app.request(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE },
    body: JSON.stringify(CREDENTIALS),
  });

  const cookie = response.headers.get('set-cookie') ?? '';
  const accountId = context.store.user[0]?.id ?? '';
  const profile = await context.profiles.ensureDefault(accountId, 'Dan');

  return {
    cookie,
    accountId,
    profileId: profile.id,
    ask: (path: string) =>
      context.app.request(`${BASE}${path}`, { headers: { cookie, origin: BASE } }),
  };
};

const idsIn = async (response: Response): Promise<string[]> =>
  z
    .object({ items: z.array(z.object({ id: z.string() })) })
    .parse(await response.json())
    .items.map((item) => item.id);

let context: ReturnType<typeof build>;

beforeEach(() => {
  context = build();
});

describe('what a viewer has hidden', () => {
  it('leaves the listing the hero is picked from, which is the point of doing it server-side', async () => {
    const me = await watching(context);

    expect(await idsIn(await me.ask(`/api/libraries/${FILMS}/items`))).toContain(ARRIVAL);

    context.library.state.hidden = [{ profileId: me.profileId, mediaItemId: ARRIVAL }];

    const listed = await idsIn(await me.ask(`/api/libraries/${FILMS}/items`));

    expect(listed).not.toContain(ARRIVAL);
    expect(listed).toContain(HEAT);
  });

  it('is still reachable by its own address, because hiding is a preference and not a lock', async () => {
    const me = await watching(context);

    context.library.state.hidden = [{ profileId: me.profileId, mediaItemId: ARRIVAL }];

    expect((await me.ask(`/api/media/${ARRIVAL}`)).status).toBe(200);

    const artwork = await (await me.ask(`/api/media/${ARRIVAL}/image/poster`)).json();

    expect(artwork).not.toEqual({ error: 'No such item.' });
  });

  it('takes its genres out of the facets, which would otherwise name it', async () => {
    const me = await watching(context);

    context.library.state.hidden = [{ profileId: me.profileId, mediaItemId: ARRIVAL }];

    const facets = z
      .object({ genres: z.array(z.string()) })
      .parse(await (await me.ask('/api/library-facets')).json());

    expect(facets.genres).not.toContain('Arrival');
    expect(facets.genres).toContain('Heat');
  });

  it('drops out of what a person was in', async () => {
    const me = await watching(context);

    context.library.state.hidden = [{ profileId: me.profileId, mediaItemId: ARRIVAL }];

    const credits = await (await me.ask('/api/people/500/credits')).json();

    expect(JSON.stringify(credits)).not.toContain(ARRIVAL);
    expect(JSON.stringify(credits)).toContain(HEAT);
  });

  it('hides every episode when the programme is the thing hidden', async () => {
    const me = await watching(context);

    context.library.state.hidden = [{ profileId: me.profileId, seriesId: CURB }];

    expect(await idsIn(await me.ask(`/api/libraries/${SHOWS}/items`))).not.toContain(EPISODE);
  });

  it('takes a whole library off the shelf when that is what was hidden', async () => {
    const me = await watching(context);

    context.library.state.hidden = [{ profileId: me.profileId, libraryId: SHOWS }];

    const shelves = z
      .array(z.object({ id: z.string() }))
      .parse(await (await me.ask('/api/libraries')).json());

    expect(shelves.map((one) => one.id)).toEqual([FILMS]);
  });

  it('is one person’s choice and not the household’s', async () => {
    const me = await watching(context);
    const somebodyElse = await context.profiles.create(me.accountId, {
      name: 'Kid',
      colour: '#3ac47d',
    });

    context.library.state.hidden = [{ profileId: me.profileId, mediaItemId: ARRIVAL }];

    const theirs = await context.app.request(`${BASE}/api/libraries/${FILMS}/items`, {
      headers: { cookie: me.cookie, origin: BASE, 'x-valence-profile': somebodyElse.id },
    });

    expect(await idsIn(theirs)).toContain(ARRIVAL);
  });
});

describe('what an account may not reach', () => {
  it('is not there when asked for by its own address', async () => {
    const me = await watching(context);

    context.library.state.blocked = [{ accountId: me.accountId, libraryId: FILMS }];

    expect((await me.ask(`/api/media/${ARRIVAL}`)).status).toBe(404);
  });

  it('refuses its artwork, which is as unsuitable as the film', async () => {
    const me = await watching(context);

    context.library.state.blocked = [{ accountId: me.accountId, libraryId: FILMS }];

    expect((await me.ask(`/api/media/${ARRIVAL}/image/backdrop`)).status).toBe(404);
  });

  it('refuses a preview clip, which would otherwise play unasked', async () => {
    const me = await watching(context);

    context.library.state.blocked = [{ accountId: me.accountId, libraryId: FILMS }];

    expect((await me.ask(`/api/media/${ARRIVAL}/preview`)).status).toBe(404);
  });

  it('refuses everything about playing it', async () => {
    const me = await watching(context);

    context.library.state.blocked = [{ accountId: me.accountId, libraryId: FILMS }];

    for (const path of [
      `/api/playback/${ARRIVAL}/file`,
      `/api/playback/${ARRIVAL}/trickplay`,
      `/api/playback/${ARRIVAL}/frame`,
      `/api/media/${ARRIVAL}/subtitles`,
      `/api/media/${ARRIVAL}/segments`,
    ]) {
      expect((await me.ask(path)).status, path).toBe(404);
    }
  });

  it('says nothing about why, answering as though it were never there', async () => {
    const me = await watching(context);

    context.library.state.blocked = [{ accountId: me.accountId, libraryId: FILMS }];

    const refused = await (await me.ask(`/api/media/${ARRIVAL}`)).json();
    const invented = await (await me.ask('/api/media/00000000-0000-4000-8000-000000000000')).json();

    expect(refused).toEqual(invented);
  });

  it('takes the library off the shelf entirely', async () => {
    const me = await watching(context);

    context.library.state.blocked = [{ accountId: me.accountId, libraryId: FILMS }];

    const shelves = z
      .array(z.object({ id: z.string() }))
      .parse(await (await me.ask('/api/libraries')).json());

    expect(shelves.map((one) => one.id)).toEqual([SHOWS]);
  });

  it('answers as though the library were never there, rather than as an empty shelf', async () => {
    const me = await watching(context);

    context.library.state.blocked = [{ accountId: me.accountId, libraryId: FILMS }];

    expect((await me.ask(`/api/libraries/${FILMS}/items`)).status).toBe(404);
  });

  it('cannot be lifted by switching to another face', async () => {
    const me = await watching(context);
    const somebodyElse = await context.profiles.create(me.accountId, {
      name: 'Kid',
      colour: '#3ac47d',
    });

    context.library.state.blocked = [{ accountId: me.accountId, libraryId: FILMS }];

    const theirs = await context.app.request(`${BASE}/api/media/${ARRIVAL}`, {
      headers: { cookie: me.cookie, origin: BASE, 'x-valence-profile': somebodyElse.id },
    });

    expect(theirs.status).toBe(404);
  });
});

describe('the two halves are not the same half', () => {
  it('lets a link through to something hidden, and refuses one to something forbidden', async () => {
    const me = await watching(context);

    context.library.state.hidden = [{ profileId: me.profileId, mediaItemId: ARRIVAL }];
    context.library.state.blocked = [{ accountId: me.accountId, libraryId: SHOWS }];

    expect((await me.ask(`/api/media/${ARRIVAL}`)).status).toBe(200);
    expect((await me.ask(`/api/media/${EPISODE}`)).status).toBe(404);
  });

  it('keeps both out of the listings all the same', async () => {
    const me = await watching(context);

    context.library.state.hidden = [{ profileId: me.profileId, mediaItemId: ARRIVAL }];
    context.library.state.blocked = [{ accountId: me.accountId, libraryId: SHOWS }];

    expect(await idsIn(await me.ask(`/api/libraries/${FILMS}/items`))).not.toContain(ARRIVAL);
    expect((await me.ask(`/api/libraries/${SHOWS}/items`)).status).toBe(404);
  });
});

describe('every address naming an item is covered by the gate', () => {
  it('finds the subject of every route the server actually registers', () => {
    const missed = context.app.routes
      .map((route) => route.path)
      .filter((path) => /:mediaId|:seriesId/.test(path))
      .filter((path) => {
        const asked = path
          .replace(':mediaId', ARRIVAL)
          .replace(':seriesId', CURB)
          .replace(/:[A-Za-z]+/g, 'anything');

        return subjectOfRequest(asked).kind === 'none';
      });

    expect(missed).toEqual([]);
  });

  it('is looking at a real list of routes rather than an empty one', () => {
    const named = context.app.routes
      .map((route) => route.path)
      .filter((path) => /:mediaId|:seriesId/.test(path));

    expect(named.length).toBeGreaterThan(10);
  });
});
