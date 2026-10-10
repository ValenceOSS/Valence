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
import { createRequestsMonitor } from '@ValenceServer/requests/createRequestsMonitor';
import { createRequestsClient } from '@ValenceServer/requests/createRequestsClient';
import { jobDefinitionsFor } from '@ValenceServer/jobs/jobDefinitions';
import { SOLVER_NOT_USED } from '@ValenceContracts/schemas/Requests';
import { ReleaseCalendarSchema } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { CalendarEpisode } from '@ValenceServer/calendar/CalendarEpisode';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { Permission } from '@ValenceContracts/schemas/Permission';

const FILMS: Library = {
  id: '9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  name: 'Films',
  kind: 'movies',
  path: '/media/Films',
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
  keepsShowsTogether: true,
  higherProfileAsks: 'ask',
};

const ELSEWHERE = '1b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b';

const aFilmRequest = (change: Partial<MediaRequest>): MediaRequest => ({
  id: '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b',
  kind: 'film',
  tmdbId: 100,
  musicBrainzId: null,
  openLibraryId: null,
  title: 'A Film',
  artistName: null,
  year: 2026,
  overview: null,
  posterUrl: null,
  libraryId: FILMS.id,
  profileId: null,
  profileName: null,
  isPickedByHand: false,
  state: 'wanted',
  problem: null,
  problemCode: null,
  approval: 'approved',
  refusedBecause: null,
  requestedBy: { id: 'somebody-else', name: 'Sam' },
  alsoAskedBy: [],
  origin: 'asked',
  isFollowed: false,
  profileAsk: null,
  seasons: null,
  followsNewSeasons: false,
  releaseTypes: null,
  releaseDate: null,
  releaseDates: { theatrical: '2026-10-10', digital: null, physical: null },
  items: [],
  mediaId: null,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...change,
});

const EPISODE: CalendarEpisode = {
  show: {
    id: 'show-1',
    libraryId: FILMS.id,
    title: 'A Show',
    seasonCount: 1,
    episodeCount: 3,
    latestAddedAt: '2026-10-01T10:00:00.000Z',
    coverMediaId: '2b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
    seriesId: '3b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  },
  externalId: '300',
  seasonNumber: 1,
  episodeNumber: 4,
  title: 'Fourth',
  airDate: '2026-10-08',
  stillUrl: null,
  isHeld: false,
};

const build = async ({
  granted = [],
  requests = null,
  episodes = [],
}: {
  granted?: readonly Permission[];
  requests?: ((accountId: string) => MediaRequest[]) | null;
  episodes?: CalendarEpisode[];
}) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const releaseCalendar = vi.fn(() => Promise.resolve(episodes));
  const catalogueArtwork = vi.fn(() =>
    Promise.resolve(
      new Map([
        [
          'movie:100',
          {
            backdropUrl: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
            logoUrl: 'https://image.tmdb.org/t/p/w500/logo.png',
          },
        ],
      ]),
    ),
  );
  let accountId = '';
  const library = createMemoryLibraryService({ libraries: [FILMS], media: [] });

  const app = createApp({
    auth,
    settings,
    permissions,
    requests:
      requests === null
        ? null
        : createRequestsMonitor({
            address: 'http://requests:8421',
            client: {
              readStatus: () =>
                Promise.resolve({
                  kind: 'answered' as const,
                  status: {
                    version: '0.4.0',
                    vpn: {
                      isConfigured: false,
                      isUp: false,
                      publicAddress: null,
                      country: null,
                      checkedAt: null,
                      problem: null,
                      problemCode: null,
                    },
                    indexers: { total: 0, enabled: 0, failing: [] },
                    solver: SOLVER_NOT_USED,
                  },
                }),
            },
            onLost: vi.fn(),
            onRegained: vi.fn(),
            onVpnDown: vi.fn(),
            onVpnUp: vi.fn(),
          }),
    requestsClient:
      requests === null
        ? null
        : createRequestsClient({
            address: 'http://requests:8421',
            secret: 'a-secret-long-enough-to-be-worth-keeping',
            fetch: () => Promise.resolve(Response.json(requests(accountId))),
          }),
    jobDefinitions: jobDefinitionsFor(requests !== null),
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: { ...library, releaseCalendar, catalogueArtwork },
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });

  const cookie = await signUpForTest(app);

  accountId = store.user[0]?.id ?? '';

  if (granted.length > 0) {
    const role = await permissions.createRole({
      name: 'Purpose-made',
      position: 200,
      color: null,
      permissions: [...granted],
    });

    await permissions.assignRole(accountId, role.id);
  }

  const read = async (query: string) => {
    const response = await app.request(`${TEST_ORIGIN}/api/calendar?${query}`, {
      headers: { cookie, origin: TEST_ORIGIN },
    });

    const entries = response.ok ? ReleaseCalendarSchema.parse(await response.json()).entries : [];

    return { status: response.status, ids: entries.map((entry) => entry.id), entries };
  };

  return { app, read, releaseCalendar };
};

describe('GET /api/calendar', () => {
  it('turns away somebody not signed in', async () => {
    const { app } = await build({});
    const response = await app.request(`${TEST_ORIGIN}/api/calendar?from=2026-10-01&to=2026-10-31`);

    expect(response.status).toBe(401);
  });

  it('shows the library’s episodes for the days asked about, with requesting off', async () => {
    const { read, releaseCalendar } = await build({ episodes: [EPISODE] });

    expect(await read('from=2026-10-01&to=2026-10-31')).toMatchObject({
      status: 200,
      ids: ['tv:300:s1e4'],
    });
    expect(releaseCalendar).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'account' }),
      '2026-10-01',
      '2026-10-31',
    );
  });

  it('decides whether an episode has aired by the viewer’s own day', async () => {
    const { read } = await build({ episodes: [EPISODE] });

    expect((await read('from=2026-10-01&to=2026-10-31&today=2026-10-07')).entries[0]?.state).toBe(
      'notOutYet',
    );
    expect((await read('from=2026-10-01&to=2026-10-31&today=2026-10-09')).entries[0]?.state).toBe(
      'notHeld',
    );
  });

  it('shows somebody only their own requests, even when they ask for everybody’s', async () => {
    const { read } = await build({
      granted: ['requests.ask'],
      requests: (accountId) => [
        aFilmRequest({ requestedBy: { id: accountId, name: 'Me' } }),
        aFilmRequest({ id: '7f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b', tmdbId: 101 }),
      ],
    });

    expect((await read('from=2026-10-01&to=2026-10-31&who=everyone')).ids).toEqual([
      'film:100:cinema',
    ]);
  });

  it('draws something asked for with the catalogue’s pictures, served from this server', async () => {
    const { read } = await build({
      granted: ['requests.ask'],
      requests: (accountId) => [
        aFilmRequest({
          requestedBy: { id: accountId, name: 'Me' },
          posterUrl: 'https://image.tmdb.org/t/p/w342/poster.jpg',
        }),
      ],
    });

    expect((await read('from=2026-10-01&to=2026-10-31')).entries[0]).toMatchObject({
      posterUrl: '/api/catalogue/pictures/w342/poster.jpg',
      backdropUrl: '/api/catalogue/pictures/w1280/backdrop.jpg',
      logoUrl: '/api/catalogue/pictures/w500/logo.png',
    });
  });

  it('shows everybody’s requests to somebody who may see them all, when they ask', async () => {
    const { read } = await build({
      granted: ['requests.viewAll'],
      requests: () => [aFilmRequest({}), aFilmRequest({ tmdbId: 101 })],
    });

    expect((await read('from=2026-10-01&to=2026-10-31&who=everyone')).ids).toEqual([
      'film:100:cinema',
      'film:101:cinema',
    ]);
    expect((await read('from=2026-10-01&to=2026-10-31')).ids).toEqual([]);
  });

  it('leaves out a request filing into a library the viewer cannot see', async () => {
    const { read } = await build({
      granted: ['requests.viewAll'],
      requests: () => [aFilmRequest({ libraryId: ELSEWHERE })],
    });

    expect((await read('from=2026-10-01&to=2026-10-31&who=everyone')).ids).toEqual([]);
  });

  it('refuses days that run backwards, or more of them than the calendar shows', async () => {
    const { read } = await build({});

    expect((await read('from=2026-10-31&to=2026-10-01')).status).toBe(400);
    expect((await read('from=2026-01-01&to=2026-12-31')).status).toBe(400);
  });
});
