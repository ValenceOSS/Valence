import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aLibraryToImportInto } from './aLibraryToImportInto';
import { aSourceToImport } from './aSourceToImport';
import { createImportService } from './createImportService';
import { registerImportRoutes } from './registerImportRoutes';
import { someImportServices } from './someImportServices';
import { aFakeSourceFetch } from './aFakeSourceFetch';
import type { FakeAnswer, FakeAsked } from './aFakeSourceFetch';
import { readFixture } from './readFixture';
import { SourceFailure } from './SourceFailure';
import { saying } from '@ValenceI18n/saying';
import { MediaImportLibrariesSchema } from '@ValenceContracts/schemas/MediaImport';
import type { SourceReader } from './SourceReader';

const ADMIN = { 'x-admin': 'yes', 'content-type': 'application/json' };

/**
 * The import routes over a test's database, where a request carrying `x-admin` is an
 * administrator's.
 *
 * @param options - The source the routes read, how the network answers, and whether this server
 *   can import at all.
 * @returns The application and the services behind it.
 */
const anApp = async ({
  reader = aSourceToImport(),
  network = () => ({ status: 401, body: '' }),
  canImport = true,
}: {
  reader?: SourceReader;
  network?: (asked: FakeAsked) => FakeAnswer | null;
  canImport?: boolean;
} = {}) => {
  const { db } = await aLibraryToImportInto(await aHousehold());
  const { fetch } = aFakeSourceFetch(network);
  const { services } = someImportServices(db, reader, { fetch });
  const app = new OpenAPIHono();

  registerImportRoutes(app, {
    imports: canImport ? createImportService(services) : undefined,
    requires: (headers) => Promise.resolve(headers.get('x-admin') === 'yes'),
    accountOf: () => Promise.resolve('account'),
    originOf: () => Promise.resolve(undefined),
  });

  const source = await services.store.addSource({
    kind: 'jellyfin',
    name: 'Den',
    url: 'http://den',
    token: 'secret-key',
    details: {
      serverId: 'den',
      version: '12.1.0',
      clientId: 'c',
      userTokens: {},
      pathMappings: [],
    },
  });

  return { app, services, sourceId: source.id };
};

/**
 * Sends a request to the application.
 *
 * @param app - The application.
 * @param method - How.
 * @param path - Where.
 * @param body - What, where there is anything.
 * @param headers - Who is asking.
 * @returns The response.
 */
const send = (
  app: OpenAPIHono,
  method: string,
  path: string,
  body?: object,
  headers: Record<string, string> = ADMIN,
) =>
  app.request(path, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

const MISSING = '00000000-0000-4000-8000-000000000000';

const LINK = { sourceLibraryId: 'lib-films', sourcePath: '/data/movies', libraryId: 'shows' };

/**
 * Every import route, with a body each will accept.
 *
 * @param sourceId - The source the routes are about.
 * @returns Each route's method, path and body.
 */
const everyRoute = (sourceId: string): [string, string, object | undefined][] => [
  ['GET', '/api/admin/imports', undefined],
  ['POST', '/api/admin/imports', { kind: 'jellyfin', url: 'http://x', token: 'k' }],
  ['DELETE', `/api/admin/imports/${sourceId}`, undefined],
  ['GET', `/api/admin/imports/${sourceId}/people`, undefined],
  ['POST', `/api/admin/imports/${sourceId}/pins`, { userId: '1', pin: '1234' }],
  ['GET', `/api/admin/imports/${sourceId}/libraries`, undefined],
  ['PUT', `/api/admin/imports/${sourceId}/mappings`, { mappings: [] }],
  ['PUT', `/api/admin/imports/${sourceId}/library-links`, LINK],
  [
    'POST',
    `/api/admin/imports/${sourceId}/libraries`,
    { libraries: [{ sourceLibraryId: 'l', sourcePath: '/p', name: 'N', kind: 'movies' }] },
  ],
  ['POST', `/api/admin/imports/${sourceId}/plan`, {}],
  ['GET', `/api/admin/imports/runs/${MISSING}`, undefined],
  ['POST', `/api/admin/imports/runs/${MISSING}/start`, undefined],
  ['POST', `/api/admin/imports/runs/${MISSING}/cancel`, undefined],
  ['POST', `/api/admin/imports/runs/${MISSING}/setup-links`, {}],
];

/**
 * A source that answers nothing it is asked, saying there is nobody on it.
 *
 * @returns The reader.
 */
const aSourceThatFails = (): SourceReader => {
  const failing = () =>
    Promise.reject(
      new SourceFailure(saying('server.imports.mediaBrowserReader.thereIsNobodyOnIt')),
    );

  return aSourceToImport({ users: failing, libraries: failing });
};

describe('registerImportRoutes', { timeout: 60_000 }, () => {
  it('turns away anybody who is not an administrator, from every route', async () => {
    const { app, sourceId } = await anApp();

    for (const [method, path, body] of everyRoute(sourceId)) {
      const response = await send(app, method, path, body, {
        'content-type': 'application/json',
      });

      expect([method, path, response.status]).toEqual([method, path, 403]);
    }
  });

  it('says so to an administrator on a server that cannot import, from every route', async () => {
    const { app, sourceId } = await anApp({ canImport: false });

    for (const [method, path, body] of everyRoute(sourceId)) {
      const response = await send(app, method, path, body);

      expect([method, path, response.status]).toEqual([method, path, 503]);
      expect(await response.json()).toMatchObject({ code: 'error.imports.thisServerCannotImport' });
    }
  });

  it('connects a source that answers, and says why it could not read one that does not', async () => {
    const files: Record<string, string> = {
      '/Users': 'jellyfin-users.json',
      '/Library/VirtualFolders': 'jellyfin-folders.json',
      '/Localization/ParentalRatings': 'jellyfin-parental-ratings.json',
    };
    const jellyfin = ({ url }: FakeAsked): FakeAnswer => ({
      body: readFixture(files[url.pathname] ?? 'jellyfin-public-info.json'),
    });
    const { app, sourceId } = await anApp({ reader: aSourceThatFails(), network: jellyfin });
    const connected = await send(app, 'POST', '/api/admin/imports', {
      kind: 'jellyfin',
      url: 'http://den',
      token: 'good',
    });

    expect(connected.status).toBe(201);
    expect(await connected.text()).not.toContain('good');

    for (const [method, path, body] of [
      ['GET', `/api/admin/imports/${sourceId}/people`, undefined],
      ['GET', `/api/admin/imports/${sourceId}/libraries`, undefined],
      ['PUT', `/api/admin/imports/${sourceId}/mappings`, { mappings: [] }],
      ['PUT', `/api/admin/imports/${sourceId}/library-links`, LINK],
    ] as const) {
      const response = await send(app, method, path, body);

      expect([method, path, response.status]).toEqual([method, path, 400]);
      expect(await response.json()).toMatchObject({
        code: 'server.imports.mediaBrowserReader.thereIsNobodyOnIt',
      });
    }
  });

  it('answers an administrator, never showing a source’s key', async () => {
    const { app, sourceId } = await anApp();
    const status = await send(app, 'GET', '/api/admin/imports');
    const text = await status.text();

    expect(status.status).toBe(200);
    expect(text).toContain('Den');
    expect(text).not.toContain('secret-key');
    expect((await send(app, 'GET', `/api/admin/imports/${sourceId}/people`)).status).toBe(200);
    expect((await send(app, 'GET', `/api/admin/imports/${sourceId}/libraries`)).status).toBe(200);
    expect(
      (
        await send(app, 'PUT', `/api/admin/imports/${sourceId}/mappings`, {
          mappings: [{ from: '/data', to: '/media' }],
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await send(app, 'POST', `/api/admin/imports/${sourceId}/libraries`, {
          libraries: [
            {
              sourceLibraryId: 'lib-films',
              sourcePath: '/data/movies',
              name: 'Films',
              kind: 'movies',
            },
          ],
        })
      ).status,
    ).toBe(200);
    expect(
      (await send(app, 'POST', `/api/admin/imports/${sourceId}/pins`, { userId: '1', pin: '1234' }))
        .status,
    ).toBe(404);
  });

  it('links a source’s folder to a library Valence has, and refuses one it does not', async () => {
    const { app, sourceId } = await anApp();
    const linked = await send(app, 'PUT', `/api/admin/imports/${sourceId}/library-links`, LINK);

    expect(linked.status).toBe(200);
    const films = MediaImportLibrariesSchema.parse(await linked.json()).libraries.find(
      (library) => library.sourceLibraryId === 'lib-films',
    );

    expect(
      films?.locations.map(({ sourcePath, libraryId }) => ({ sourcePath, libraryId })),
    ).toEqual([{ sourcePath: '/data/movies', libraryId: 'shows' }]);

    const refused = await send(app, 'PUT', `/api/admin/imports/${sourceId}/library-links`, {
      ...LINK,
      libraryId: 'gone',
    });

    expect(refused.status).toBe(400);
    expect(await refused.json()).toMatchObject({
      code: 'server.imports.importService.thatLibraryIsNotInValence',
    });
    expect(
      (
        await send(app, 'PUT', `/api/admin/imports/${sourceId}/library-links`, {
          ...LINK,
          libraryId: '',
        })
      ).status,
    ).toBe(400);
  });

  it('says why a source could not be connected', async () => {
    const { app } = await anApp();
    const response = await send(app, 'POST', '/api/admin/imports', {
      kind: 'jellyfin',
      url: 'http://den',
      token: 'wrong',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: 'server.imports.sourceCaller.nameRefusedTheKey',
    });
  });

  it('plans, starts, follows, stops and hands out links for an import', async () => {
    const { app, services, sourceId } = await anApp();
    const planned = await send(app, 'POST', `/api/admin/imports/${sourceId}/plan`, {
      meUserId: 'u-pat',
    });
    const { id } = z.object({ id: z.string() }).parse(await planned.json());

    expect(planned.status).toBe(202);
    expect((await send(app, 'POST', `/api/admin/imports/runs/${id}/start`)).status).toBe(409);

    await services.store.changeRun(id, {
      state: 'planned',
      report: {
        source: { kind: 'jellyfin', name: 'Den', version: '1' },
        counts: {
          people: 0,
          libraries: 0,
          items: 0,
          matched: 0,
          unmatched: 0,
          watched: 0,
          resumes: 0,
          plays: 0,
          favourites: 0,
          ratings: 0,
          playlists: 0,
          collections: 0,
          markers: 0,
        },
        people: [],
        unmatched: [],
        unmatchedTotal: 0,
        notBroughtAcross: [],
        written: null,
      },
    });

    expect((await send(app, 'POST', `/api/admin/imports/runs/${id}/start`)).status).toBe(202);
    expect((await send(app, 'GET', `/api/admin/imports/runs/${id}`)).status).toBe(200);
    expect((await send(app, 'POST', `/api/admin/imports/runs/${id}/cancel`)).status).toBe(200);
    expect(
      (await send(app, 'POST', `/api/admin/imports/runs/${id}/setup-links`, { lifetimeDays: 30 }))
        .status,
    ).toBe(200);
  });

  it('says when a source or an import is not there', async () => {
    const { app, sourceId } = await anApp();

    expect((await send(app, 'DELETE', `/api/admin/imports/${sourceId}`)).status).toBe(200);

    for (const [method, path, body] of [
      ['DELETE', `/api/admin/imports/${sourceId}`, undefined],
      ['GET', `/api/admin/imports/${sourceId}/people`, undefined],
      ['GET', `/api/admin/imports/${sourceId}/libraries`, undefined],
      ['PUT', `/api/admin/imports/${sourceId}/mappings`, { mappings: [] }],
      ['PUT', `/api/admin/imports/${sourceId}/library-links`, LINK],
      [
        'POST',
        `/api/admin/imports/${sourceId}/libraries`,
        { libraries: [{ sourceLibraryId: 'l', sourcePath: '/p', name: 'N', kind: 'movies' }] },
      ],
      ['POST', `/api/admin/imports/${sourceId}/plan`, {}],
      ['GET', `/api/admin/imports/runs/${MISSING}`, undefined],
      ['POST', `/api/admin/imports/runs/${MISSING}/start`, undefined],
      ['POST', `/api/admin/imports/runs/${MISSING}/cancel`, undefined],
      ['POST', `/api/admin/imports/runs/${MISSING}/setup-links`, {}],
    ] as const) {
      expect([method, path, (await send(app, method, path, body)).status]).toEqual([
        method,
        path,
        404,
      ]);
    }
  });
});
