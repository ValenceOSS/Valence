import { describe, expect, it } from 'vitest';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest, makeAdministrator } from '@ValenceServer/auth/signUpForTest';
import { createMemoryPermissionService } from '@ValenceServer/auth/createMemoryPermissionService';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import type {
  LogFacetsQuery,
  LogHistogramQuery,
  LogQuery,
  LogRecord,
} from '@ValenceContracts/schemas/Log';
import type { LogStore } from '@ValenceServer/logging/Logger';

const BASE = 'http://localhost';

const CREDENTIALS = {
  name: 'Marques',
  email: 'marques@valence.local',
  password: 'a-long-enough-password',
};

const aRecord = (over?: Partial<LogRecord>): LogRecord => ({
  id: 'one',
  atMs: 1000,
  level: 'error',
  source: 'scanner',
  message: 'could not read the file',
  detail: null,
  count: 1,
  context: {
    jobId: null,
    jobKind: null,
    libraryId: null,
    mediaId: null,
    sessionId: null,
    requestId: null,
  },
  ...over,
});

const build = () => {
  const { auth, settings, store } = createMemoryAuth();
  const permissions = createMemoryPermissionService();
  const asked: LogQuery[] = [];
  const histogramAsked: LogHistogramQuery[] = [];
  const facetsAsked: LogFacetsQuery[] = [];

  const logs: LogStore = {
    save: () => Promise.resolve(),
    countAgain: () => Promise.resolve(),
    read: (query) => {
      asked.push(query);

      return Promise.resolve({ records: [aRecord()], total: 1 });
    },
    histogram: (query) => {
      histogramAsked.push(query);

      return Promise.resolve({
        fromMs: 0,
        untilMs: 2000,
        bucketMs: 1000,
        buckets: [
          { atMs: 0, debug: 0, info: 4, warn: 0, error: 1 },
          { atMs: 1000, debug: 0, info: 0, warn: 2, error: 0 },
        ],
      });
    },
    facets: (query) => {
      facetsAsked.push(query);

      return Promise.resolve({
        sources: [{ value: 'jobs', events: 7 }],
        jobKinds: [{ value: 'library.scan', events: 5 }],
      });
    },
    forgetExpired: () => Promise.resolve(0),
  };

  const app = createApp({
    auth,
    settings,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    playback: createMemoryPlaybackService(),
    subtitles: createMemorySubtitleService({}),
    segments: createMemorySegmentService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    permissions,
    logs,
  });

  return { app, store, permissions, asked, histogramAsked, facetsAsked };
};

const signedIn = (app: ReturnType<typeof build>['app']): Promise<string> =>
  signUpForTest(app, CREDENTIALS);

const signedInAsAdmin = async (
  app: ReturnType<typeof build>['app'],
  store: ReturnType<typeof build>['store'],
  permissions: ReturnType<typeof build>['permissions'],
): Promise<string> => {
  const cookie = await signedIn(app);
  const user = store.user[0];

  if (user !== undefined) {
    user.role = 'admin';

    await makeAdministrator(permissions, user.id);
  }

  return cookie;
};

describe('reading the log from the admin area', () => {
  it('turns away somebody who may not read the logs', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    const response = await app.request(`${BASE}/api/admin/logs`, {
      method: 'POST',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(403);
  });

  it('turns away somebody who is not signed in at all', async () => {
    const { app } = build();

    const response = await app.request(`${BASE}/api/admin/logs`, {
      method: 'POST',
      headers: { origin: BASE, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(401);
  });

  it('gives the records to somebody who may read them', async () => {
    const context = build();
    const cookie = await signedInAsAdmin(context.app, context.store, context.permissions);

    const response = await context.app.request(`${BASE}/api/admin/logs`, {
      method: 'POST',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ total: 1 });
  });

  it('shows warnings and errors when nothing was asked for', async () => {
    const context = build();
    const cookie = await signedInAsAdmin(context.app, context.store, context.permissions);

    await context.app.request(`${BASE}/api/admin/logs`, {
      method: 'POST',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(context.asked[0]?.levels).toStrictEqual(['warn', 'error']);
  });

  it('passes on what was asked for', async () => {
    const context = build();
    const cookie = await signedInAsAdmin(context.app, context.store, context.permissions);

    await context.app.request(`${BASE}/api/admin/logs`, {
      method: 'POST',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      body: JSON.stringify({ levels: ['info'], sources: ['jobs'], search: 'failed' }),
    });

    expect(context.asked[0]).toMatchObject({
      levels: ['info'],
      sources: ['jobs'],
      search: 'failed',
    });
  });

  it('refuses a query it cannot read rather than guessing', async () => {
    const context = build();
    const cookie = await signedInAsAdmin(context.app, context.store, context.permissions);

    const response = await context.app.request(`${BASE}/api/admin/logs`, {
      method: 'POST',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      body: JSON.stringify({ levels: ['catastrophe'] }),
    });

    expect(response.status).toBe(400);
  });

  it('refuses a limit big enough to be its own outage', async () => {
    const context = build();
    const cookie = await signedInAsAdmin(context.app, context.store, context.permissions);

    const response = await context.app.request(`${BASE}/api/admin/logs`, {
      method: 'POST',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      body: JSON.stringify({ limit: 100000 }),
    });

    expect(response.status).toBe(400);
  });
});

const post = (
  context: ReturnType<typeof build>,
  cookie: string,
  path: string,
  body: object,
): Promise<Response> =>
  Promise.resolve(
    context.app.request(`${BASE}${path}`, {
      method: 'POST',
      headers: { cookie, origin: BASE, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

describe('narrowing and ordering the log', () => {
  it('passes on the identifiers, the kinds of job, the order and the page', async () => {
    const context = build();
    const cookie = await signedInAsAdmin(context.app, context.store, context.permissions);

    await post(context, cookie, '/api/admin/logs', {
      jobId: 'job-1',
      jobKinds: ['library.scan'],
      libraryId: 'lib-1',
      mediaId: 'media-1',
      sessionId: 'session-1',
      requestId: 'request-1',
      sort: 'oldest',
      offset: 200,
    });

    expect(context.asked[0]).toMatchObject({
      jobId: 'job-1',
      jobKinds: ['library.scan'],
      libraryId: 'lib-1',
      mediaId: 'media-1',
      sessionId: 'session-1',
      requestId: 'request-1',
      sort: 'oldest',
      offset: 200,
    });
  });

  it('starts at the newest and the first page when nothing is said', async () => {
    const context = build();
    const cookie = await signedInAsAdmin(context.app, context.store, context.permissions);

    await post(context, cookie, '/api/admin/logs', {});

    expect(context.asked[0]).toMatchObject({ sort: 'newest', offset: 0, jobKinds: [] });
  });

  it('refuses an order it does not know', async () => {
    const context = build();
    const cookie = await signedInAsAdmin(context.app, context.store, context.permissions);

    expect((await post(context, cookie, '/api/admin/logs', { sort: 'loudest' })).status).toBe(400);
  });
});

describe.each(['/api/admin/logs/histogram', '/api/admin/logs/facets'])('%s', (path) => {
  it('turns away somebody who may not read the logs', async () => {
    const { app } = build();
    const cookie = await signedIn(app);

    expect(
      (
        await app.request(`${BASE}${path}`, {
          method: 'POST',
          headers: { cookie, origin: BASE, 'content-type': 'application/json' },
          body: JSON.stringify({}),
        })
      ).status,
    ).toBe(403);
  });
});

describe('the log over time', () => {
  it('counts the log into bars by level', async () => {
    const context = build();
    const cookie = await signedInAsAdmin(context.app, context.store, context.permissions);

    const response = await post(context, cookie, '/api/admin/logs/histogram', {});

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      bucketMs: 1000,
      buckets: [{ info: 4, error: 1 }, { warn: 2 }],
    });
  });

  it('counts the same records the table lists, so it is asked the same question', async () => {
    const context = build();
    const cookie = await signedInAsAdmin(context.app, context.store, context.permissions);

    await post(context, cookie, '/api/admin/logs/histogram', {
      levels: ['error'],
      jobId: 'job-1',
      sinceMs: 1000,
      buckets: 20,
    });

    expect(context.histogramAsked[0]).toMatchObject({
      levels: ['error'],
      jobId: 'job-1',
      sinceMs: 1000,
      buckets: 20,
    });
  });

  it('refuses more bars than there is room to draw', async () => {
    const context = build();
    const cookie = await signedInAsAdmin(context.app, context.store, context.permissions);

    expect(
      (await post(context, cookie, '/api/admin/logs/histogram', { buckets: 5000 })).status,
    ).toBe(400);
  });
});

describe('what the log mentions most', () => {
  it('gives the most common sources and kinds of job', async () => {
    const context = build();
    const cookie = await signedInAsAdmin(context.app, context.store, context.permissions);

    const response = await post(context, cookie, '/api/admin/logs/facets', { levels: ['error'] });

    expect(await response.json()).toStrictEqual({
      sources: [{ value: 'jobs', events: 7 }],
      jobKinds: [{ value: 'library.scan', events: 5 }],
    });
    expect(context.facetsAsked[0]).toMatchObject({ levels: ['error'] });
  });
});
