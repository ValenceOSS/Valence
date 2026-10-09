import { describe, expect, it } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createRequestsClient } from '@ValenceServer/requests/createRequestsClient';
import { MediaRequestDraftSchema } from '@ValenceContracts/schemas/MediaRequest';
import { aSeerrRequest } from './testing/aSeerrRequest';
import { FILMS_LIBRARY, SEERR_KEY } from './testing/anArrEmulation';
import type { MediaRequestDraft, RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import { arrIdOf } from './arrIdOf';

const FILMS: Library = {
  id: FILMS_LIBRARY.id,
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
};

const ARRIVAL: RequestCatalogue = {
  title: 'Arrival',
  year: 2016,
  aliases: [],
  overview: null,
  posterUrl: null,
  runtimeMinutes: 116,
  releaseDates: { theatrical: null, digital: null, physical: null },
  episodes: [],
  isEnded: false,
  artist: null,
  albums: [],
};

const SEERR = { id: 'seerr-account', name: 'Requests from Seerr' };

const REMUX: QualityProfile = {
  id: '7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  name: 'Remux',
  kind: 'video',
  qualities: [],
  musicQualities: [],
  smallestMb: null,
  largestMb: null,
  sizes: [],
  preferredWords: [],
  requiredWords: [],
  bannedWords: [],
  formats: [],
  minFormatScore: 0,
  upgradeUntilFormatScore: null,
  isUpgrading: false,
  releaseWait: 'digital',
  cutoff: null,
  upgradeUntilMusicQuality: null,
  libraryIds: [],
  preferredLanguage: null,
  isDefault: false,
  roleIds: [],
  accountIds: [],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

/**
 * The whole server, with a requests service that keeps every request it is sent and has the quality
 * profiles given, standing in for Radarr for an account chosen to ask as — or for nobody, where none
 * is.
 */
const build = async (accountId = SEERR.id, profiles: QualityProfile[] = []) => {
  const { auth, settings } = createMemoryAuth();
  const sent: MediaRequestDraft[] = [];

  await settings.write({ seerr: { isEnabled: true, apiKey: SEERR_KEY, accountId } });

  const app = createApp({
    auth,
    settings,
    permissions: createMemoryPermissionService(),
    requestsClient: createRequestsClient({
      address: 'http://requests:8421',
      secret: 'a-secret-long-enough-to-be-worth-keeping',
      fetch: (url, init) => {
        if (url.endsWith('/api/requests') && init.method === 'POST') {
          const draft = MediaRequestDraftSchema.parse(JSON.parse(init.body ?? '{}'));

          sent.push(draft);

          return Promise.resolve(
            new Response(
              JSON.stringify({
                request: aSeerrRequest({ requestedBy: draft.requestedBy }),
                isNew: true,
              }),
              { status: 201 },
            ),
          );
        }

        return Promise.resolve(
          new Response(JSON.stringify(url.endsWith('/api/profiles') ? profiles : []), {
            status: 200,
          }),
        );
      },
    }),
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    listUsers: () =>
      Promise.resolve([
        {
          ...SEERR,
          email: 'seerr@example.test',
          role: null,
          createdAt: '2026-10-01T00:00:00.000Z',
        },
      ]),
    library: createMemoryLibraryService({ libraries: [FILMS], media: [] }),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    describeForRequest: (tmdbId) => Promise.resolve(tmdbId === 329865 ? ARRIVAL : null),
  });

  const addArrival = (qualityProfileId = 1) =>
    app.request(`http://valence/arr/radarr/api/v3/movie?apikey=${SEERR_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Arrival',
        qualityProfileId,
        profileId: qualityProfileId,
        titleSlug: '329865',
        minimumAvailability: 'released',
        tmdbId: 329865,
        year: 2016,
        rootFolderPath: '/media/Films',
        monitored: true,
        tags: [],
        addOptions: { searchForMovie: true },
      }),
    });

  return { app, sent, addArrival };
};

describe('arrEmulationOf', () => {
  it('asks Valence for a film Overseerr sends, approved, in the name of the account chosen', async () => {
    const { sent, addArrival } = await build();
    const response = await addArrival();

    expect(response.status).toBe(201);
    expect(sent).toEqual([
      expect.objectContaining({
        kind: 'film',
        tmdbId: 329865,
        libraryId: FILMS.id,
        isApproved: true,
        requestedBy: SEERR,
      }),
    ]);
    expect(await response.json()).toMatchObject({ id: 329865, monitored: true });
  });

  it('holds what Overseerr sends to the quality profiles its account may choose', async () => {
    const { sent, addArrival } = await build(SEERR.id, [
      { ...REMUX, accountIds: ['somebody-else'] },
    ]);
    const response = await addArrival(arrIdOf(REMUX.id));

    expect(response.status).toBe(403);
    expect(sent).toEqual([]);
  });

  it('asks with a quality profile its account may choose', async () => {
    const { sent, addArrival } = await build(SEERR.id, [REMUX]);
    const response = await addArrival(arrIdOf(REMUX.id));

    expect(response.status).toBe(201);
    expect(sent).toEqual([expect.objectContaining({ profileId: REMUX.id })]);
  });

  it('turns a film away until an account to ask as has been chosen', async () => {
    const { sent, addArrival } = await build('');
    const response = await addArrival();

    expect(response.status).toBe(403);
    expect(sent).toEqual([]);
  });

  it('offers the film library as a root folder, as the server sees it', async () => {
    const { app } = await build();
    const response = await app.request(
      `http://valence/arr/radarr/api/v3/rootfolder?apikey=${SEERR_KEY}`,
    );

    expect(await response.json()).toEqual([
      expect.objectContaining({ path: '/media/Films', accessible: true }),
    ]);
  });
});
