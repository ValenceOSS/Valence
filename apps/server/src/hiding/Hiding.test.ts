import { beforeEach, describe, expect, it } from 'vitest';
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
import { HiddenListSchema } from '@ValenceContracts/schemas/Hidden';
import { createMemoryHiddenService } from './createMemoryHiddenService';
import type { Library, MediaDetail } from '@ValenceContracts/schemas/Library';

const BASE = 'http://localhost:8420';

const FILMS = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';
const SHOWS = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const ARRIVAL = '9c858901-8a57-4791-81fe-4c455b099bc9';
const EPISODE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const CURB = 'c0a80101-0000-4000-8000-00000000cccc';
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

const film = (id: string, libraryId: string, title: string, seriesTitle?: string): MediaDetail => ({
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
    ...(seriesTitle === undefined ? {} : { seriesTitle, seasonNumber: 1 }),
  },
});

const build = () => {
  const profiles = createMemoryProfileService();
  const { auth, settings, store } = createMemoryAuth();

  const library = createMemoryLibraryService({
    libraries: [shelf(FILMS, 'Films', 'movies'), shelf(SHOWS, 'Shows', 'shows')],
    media: [film(ARRIVAL, FILMS, 'Arrival'), film(EPISODE, SHOWS, 'Curb', 'Curb Your Enthusiasm')],
    series: [{ id: CURB, title: 'Curb Your Enthusiasm' }],
    hidden: [],
    blocked: [],
  });

  const hiding = createMemoryHiddenService({
    rows: [],
    titles: { [ARRIVAL]: 'Arrival', [CURB]: 'Curb Your Enthusiasm', [SHOWS]: 'Shows' },
  });

  const app = createApp({
    auth,
    settings,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library,
    hiding,
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    profiles,
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });

  return { app, library, hiding, profiles, store };
};

const watching = async (context: ReturnType<typeof build>) => {
  const response = await context.app.request(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE },
    body: JSON.stringify({ name: 'Dan', email: 'dan@valence.local', password: 'a-long-password' }),
  });

  const cookie = response.headers.get('set-cookie') ?? '';
  const accountId = context.store.user[0]?.id ?? '';
  const profile = await context.profiles.ensureDefault(accountId, 'Dan');

  return {
    cookie,
    accountId,
    profileId: profile.id,
    ask: (path: string, method = 'GET') =>
      context.app.request(`${BASE}${path}`, { method, headers: { cookie, origin: BASE } }),
  };
};

let context: ReturnType<typeof build>;

beforeEach(() => {
  context = build();
});

describe('hiding something', () => {
  it('records a film against the face watching, not the account', async () => {
    const me = await watching(context);

    expect((await me.ask(`/api/media/${ARRIVAL}/hidden`, 'PUT')).status).toBe(204);
    expect(context.hiding.state.rows[0]?.profileId).toBe(me.profileId);
  });

  it('records a programme', async () => {
    const me = await watching(context);

    expect((await me.ask(`/api/series/${CURB}/hidden`, 'PUT')).status).toBe(204);
    expect(context.hiding.state.rows[0]?.kind).toBe('series');
  });

  it('records a whole library, which is the cheapest of the three', async () => {
    const me = await watching(context);

    expect((await me.ask(`/api/libraries/${SHOWS}/hidden`, 'PUT')).status).toBe(204);
    expect(context.hiding.state.rows[0]?.kind).toBe('library');
  });

  it('can be asked twice without complaining or recording it twice', async () => {
    const me = await watching(context);

    expect((await me.ask(`/api/media/${ARRIVAL}/hidden`, 'PUT')).status).toBe(204);
    expect((await me.ask(`/api/media/${ARRIVAL}/hidden`, 'PUT')).status).toBe(204);
    expect(context.hiding.state.rows).toHaveLength(1);
  });

  it('refuses to hide something that is not there', async () => {
    const me = await watching(context);

    expect((await me.ask(`/api/media/${NOWHERE}/hidden`, 'PUT')).status).toBe(404);
  });

  it('is refused for an item the account may not reach, by the gate above it', async () => {
    const me = await watching(context);

    context.library.state.blocked = [{ accountId: me.accountId, libraryId: FILMS }];

    expect((await me.ask(`/api/media/${ARRIVAL}/hidden`, 'PUT')).status).toBe(404);
  });

  it('is refused for a library the account may not reach, which has no gate above it', async () => {
    const me = await watching(context);

    context.library.state.blocked = [{ accountId: me.accountId, libraryId: SHOWS }];

    expect((await me.ask(`/api/libraries/${SHOWS}/hidden`, 'PUT')).status).toBe(404);
  });

  it('turns nobody away', async () => {
    const { app } = build();

    const response = await app.request(`${BASE}/api/media/${ARRIVAL}/hidden`, {
      method: 'PUT',
      headers: { origin: BASE },
    });

    expect(response.status).toBe(401);
  });
});

describe('the list somebody brings things back from', () => {
  it('names what they hid, so a row can be drawn for it', async () => {
    const me = await watching(context);

    await me.ask(`/api/series/${CURB}/hidden`, 'PUT');

    const listed = HiddenListSchema.parse(await (await me.ask('/api/hidden')).json());

    expect(listed.hidden).toEqual([
      expect.objectContaining({
        kind: 'series',
        subjectId: CURB,
        title: 'Curb Your Enthusiasm',
      }),
    ]);
  });

  it('is one person’s list and not the household’s', async () => {
    const me = await watching(context);
    const somebodyElse = await context.profiles.create(me.accountId, {
      name: 'Kid',
      colour: '#3ac47d',
    });

    await me.ask(`/api/media/${ARRIVAL}/hidden`, 'PUT');

    const theirs = await context.app.request(`${BASE}/api/hidden`, {
      headers: { cookie: me.cookie, origin: BASE, 'x-valence-profile': somebodyElse.id },
    });

    expect(HiddenListSchema.parse(await theirs.json()).hidden).toEqual([]);
  });
});

describe('bringing something back', () => {
  it('takes the row away again', async () => {
    const me = await watching(context);

    await me.ask(`/api/media/${ARRIVAL}/hidden`, 'PUT');
    expect((await me.ask(`/api/media/${ARRIVAL}/hidden`, 'DELETE')).status).toBe(204);

    expect(context.hiding.state.rows).toHaveLength(0);
  });

  it('says nothing is wrong when there was nothing hidden to begin with', async () => {
    const me = await watching(context);

    expect((await me.ask(`/api/media/${ARRIVAL}/hidden`, 'DELETE')).status).toBe(204);
  });

  it('brings a library back', async () => {
    const me = await watching(context);

    await me.ask(`/api/libraries/${SHOWS}/hidden`, 'PUT');

    expect((await me.ask(`/api/libraries/${SHOWS}/hidden`, 'DELETE')).status).toBe(204);
    expect(context.hiding.state.rows).toHaveLength(0);
  });
});
