import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest, makeAdministrator, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createRequestsClient } from '@ValenceServer/requests/createRequestsClient';
import { jobDefinitionsFor } from '@ValenceServer/jobs/jobDefinitions';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import {
  ArrImportAppliedSchema,
  ArrImportOrderSchema,
  ArrWantedOutcomeSchema,
} from '@ValenceContracts/schemas/ArrImport';
import { MediaRequestDraftSchema } from '@ValenceContracts/schemas/MediaRequest';
import type {
  ArrImportApplied,
  ArrImportPlan,
  ArrWanted,
} from '@ValenceContracts/schemas/ArrImport';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
import type { Permission } from '@ValenceContracts/schemas/Permission';

const FILMS: Library = {
  id: '9b2d4f6e-1a3c-4e5f-8a7b-0c1d2e3f4a5b',
  name: 'Films',
  kind: 'movies',
  path: '/media/Films',
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: 'en',
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
  keepsShowsTogether: true,
  higherProfileAsks: 'ask',
};

const SERIES: Library = {
  ...FILMS,
  id: '2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f',
  name: 'Series',
  kind: 'shows',
  path: '/media/Series',
};

const PROFILE_ID = 'b3c8a7f2-1d4e-4f5a-9b6c-7d8e9f0a1b2c';

const APP_ID = '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01';

const A_PLAN: ArrImportPlan = {
  sources: [],
  clients: [],
  indexers: [],
  prowlarr: null,
  profiles: [],
  libraries: [],
  unplacedFolders: [],
  wanted: { films: 1, series: 0, artists: 0, requests: 0, unaskable: 0 },
  secrets: [],
};

const APPLIED: ArrImportApplied = {
  clients: { added: 1, kept: 0 },
  indexers: { added: 0, kept: 0 },
  profiles: { added: 1, kept: 0 },
  apps: { added: 1, kept: 0 },
  prowlarr: null,
  libraries: [
    {
      libraryId: FILMS.id,
      choice: 'handOff',
      fulfilment: {
        appId: APP_ID,
        rootFolderPath: '/movies',
        qualityProfileId: 4,
        metadataProfileId: null,
        searchesOnAdd: true,
      },
      profileId: null,
    },
    { libraryId: SERIES.id, choice: 'takeOver', fulfilment: null, profileId: PROFILE_ID },
  ],
  wanted: [],
  problems: [],
};

const A_CATALOGUE: RequestCatalogue = {
  title: 'Dune: Part Two',
  year: 2024,
  aliases: [],
  overview: null,
  posterUrl: null,
  runtimeMinutes: 166,
  releaseDates: { theatrical: null, digital: null, physical: null },
  episodes: [],
  isEnded: false,
  artist: null,
  albums: [],
};

const A_WANTED: ArrWanted = {
  key: 'film:693134',
  kind: 'film',
  tmdbId: 693_134,
  tvdbId: null,
  musicBrainzId: null,
  title: 'Dune: Part Two',
  seasons: null,
  libraryId: FILMS.id,
  profileId: null,
  isApproved: true,
  requester: null,
};

const ORDER = { sources: [{ kind: 'radarr', url: 'http://radarr:7878', apiKey: 'key' }] };

/**
 * A server with requesting on, an administrator signed in, and a requests service that answers
 * the import and records every request it is asked to add.
 */
const build = async ({
  isOn = true,
  granted,
}: { isOn?: boolean; granted?: readonly Permission[] } = {}) => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const sent: { url: string; body: string }[] = [];
  const library = createMemoryLibraryService({ libraries: [FILMS, SERIES], media: [] });
  const service = (url: string, init: { method?: string; body?: string }): Response => {
    sent.push({ url, body: init.body ?? '' });

    if (url.endsWith('/api/imports/arr/plan')) {
      return Response.json(A_PLAN);
    }

    if (url.endsWith('/api/imports/arr/apply')) {
      return Response.json(APPLIED);
    }

    if (url.endsWith('/api/requests')) {
      const draft = MediaRequestDraftSchema.parse(JSON.parse(init.body ?? '{}'));

      return Response.json(
        {
          request: {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            kind: draft.kind,
            tmdbId: draft.tmdbId,
            musicBrainzId: null,
            openLibraryId: null,
            title: draft.catalogue.title,
            artistName: null,
            year: null,
            overview: null,
            posterUrl: null,
            libraryId: draft.libraryId,
            profileId: draft.profileId,
            isPickedByHand: false,
            state: 'wanted',
            problem: null,
            problemCode: null,
            approval: draft.isApproved ? 'approved' : 'awaiting',
            refusedBecause: null,
            requestedBy: draft.requestedBy,
            seasons: draft.seasons,
            releaseTypes: null,
            releaseDate: null,
            items: [],
            mediaId: null,
            createdAt: '2026-10-02T00:00:00.000Z',
            updatedAt: '2026-10-02T00:00:00.000Z',
          },
          isNew: draft.tmdbId !== 438_631,
        },
        { status: 201 },
      );
    }

    return Response.json([]);
  };

  const app = createApp({
    auth,
    settings,
    permissions,
    requests: null,
    requestsClient: isOn
      ? createRequestsClient({
          address: 'http://requests:8421',
          secret: 'a-secret-long-enough-to-be-worth-keeping',
          fetch: (url, init) => Promise.resolve(service(url, init)),
        })
      : null,
    jobDefinitions: jobDefinitionsFor(isOn),
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library,
    describeForRequest: vi.fn((tmdbId: number) =>
      Promise.resolve(tmdbId === 1 ? null : A_CATALOGUE),
    ),
    seriesOfTvdbId: (tvdbId) => Promise.resolve(tvdbId === 371_980 ? 95_396 : null),
    listUsers: () =>
      Promise.resolve([
        {
          id: 'sam',
          name: 'Sam',
          email: 'sam@example.com',
          role: null,
          createdAt: '2026-10-01T00:00:00.000Z',
        },
      ]),
    importedAccounts: () =>
      Promise.resolve([{ sourceKind: 'plex', sourceKey: '1234567', accountId: 'sam' }]),
    playback: createMemoryPlaybackService(),
    segments: createMemorySegmentService(),
    subtitles: createMemorySubtitleService({}),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
  });

  const cookie = await signUpForTest(app);
  const accountId = store.user[0]?.id ?? '';

  if (granted === undefined) {
    await makeAdministrator(permissions, accountId);
  } else {
    const role = await permissions.createRole({
      name: 'Purpose-made',
      position: 200,
      color: null,
      permissions: [...granted],
    });

    await permissions.assignRole(accountId, role.id);
  }

  const ask = (path: string, body: object) =>
    app.request(`${TEST_ORIGIN}${path}`, {
      method: 'POST',
      headers: { cookie, origin: TEST_ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  return { ask, sent, library, accountId };
};

describe('POST /api/admin/imports/arr/plan', () => {
  it('asks the requests service for a plan, with the server’s libraries to match against', async () => {
    const { ask, sent } = await build();
    const response = await ask('/api/admin/imports/arr/plan', ORDER);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(A_PLAN);

    const order = ArrImportOrderSchema.parse(JSON.parse(sent[0]?.body ?? '{}'));

    expect(order.libraries.map((one) => one.name)).toEqual(['Films', 'Series']);
  });

  it('refuses somebody who does not manage requesting, and says requesting is off', async () => {
    const refused = await build({ granted: ['requests.ask'] });

    expect((await refused.ask('/api/admin/imports/arr/plan', ORDER)).status).toBe(403);

    const off = await build({ isOn: false });

    expect((await off.ask('/api/admin/imports/arr/plan', ORDER)).status).toBe(404);
  });
});

describe('POST /api/admin/imports/arr/apply', () => {
  it('brings the setup in and sets how each library is fulfilled', async () => {
    const { ask, library } = await build();
    const response = await ask('/api/admin/imports/arr/apply', {
      ...ORDER,
      choices: { [SERIES.id]: 'takeOver' },
    });

    expect(response.status).toBe(200);
    expect(ArrImportAppliedSchema.parse(await response.json()).problems).toEqual([]);

    const kept = await library.list(asTheServer);

    expect(kept.find((one) => one.id === FILMS.id)?.fulfilment).toMatchObject({ appId: APP_ID });
    expect(kept.find((one) => one.id === SERIES.id)).toMatchObject({
      fulfilment: null,
      requestProfileId: PROFILE_ID,
      defaultAudioLanguage: 'en',
    });
  });
});

describe('POST /api/admin/imports/arr/requests', () => {
  it('asks for each as whoever asked for it there, and as the admin otherwise', async () => {
    const { ask, sent, accountId } = await build();
    const response = await ask('/api/admin/imports/arr/requests', {
      items: [
        A_WANTED,
        {
          ...A_WANTED,
          key: 'series:tvdb:371980',
          kind: 'series',
          tmdbId: null,
          tvdbId: 371_980,
          seasons: [2],
          libraryId: null,
          isApproved: false,
          requester: { name: 'Sam', email: null, plexId: 1_234_567, jellyfinUserId: null },
        },
        { ...A_WANTED, key: 'film:438631', tmdbId: 438_631 },
      ],
    });

    expect(ArrWantedOutcomeSchema.parse(await response.json())).toEqual({
      made: 2,
      already: 1,
      failed: [],
    });

    const drafts = sent
      .filter((one) => one.url.endsWith('/api/requests'))
      .map((one) => MediaRequestDraftSchema.parse(JSON.parse(one.body)));

    expect(
      drafts.map(({ kind, tmdbId, seasons, isApproved, requestedBy, libraryId }) => ({
        kind,
        tmdbId,
        seasons,
        isApproved,
        requestedBy: requestedBy.id,
        libraryId,
      })),
    ).toEqual([
      {
        kind: 'film',
        tmdbId: 693_134,
        seasons: null,
        isApproved: true,
        requestedBy: accountId,
        libraryId: FILMS.id,
      },
      {
        kind: 'series',
        tmdbId: 95_396,
        seasons: [2],
        isApproved: false,
        requestedBy: 'sam',
        libraryId: SERIES.id,
      },
      {
        kind: 'film',
        tmdbId: 438_631,
        seasons: null,
        isApproved: true,
        requestedBy: accountId,
        libraryId: FILMS.id,
      },
    ]);
  });

  it('says what could not be asked for, and why', async () => {
    const { ask } = await build();
    const response = await ask('/api/admin/imports/arr/requests', {
      items: [
        { ...A_WANTED, key: 'film:1', tmdbId: 1 },
        {
          ...A_WANTED,
          key: 'series:tvdb:2',
          kind: 'series',
          tmdbId: null,
          tvdbId: 2,
          seasons: [1],
        },
      ],
    });
    const outcome = ArrWantedOutcomeSchema.parse(await response.json());

    expect(outcome.made).toBe(0);
    expect(outcome.failed.map((one) => one.key)).toEqual(['film:1', 'series:tvdb:2']);
    expect(
      z.array(z.string()).parse(outcome.failed.map((one) => one.problem.message)),
    ).toHaveLength(2);
  });

  it('refuses somebody who does not manage requesting', async () => {
    const { ask } = await build({ granted: ['requests.ask'] });

    expect((await ask('/api/admin/imports/arr/requests', { items: [A_WANTED] })).status).toBe(403);
  });
});
