import { describe, expect, it } from 'vitest';
import { saying } from '@ValenceI18n/saying';
import { aFakeSourceFetch } from './aFakeSourceFetch';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aLibraryToImportInto } from './aLibraryToImportInto';
import { aSourceToImport } from './aSourceToImport';
import { createImportService } from './createImportService';
import { readFixture } from './readFixture';
import { someImportServices } from './someImportServices';
import { SourceFailure } from './SourceFailure';
import type { ImportServices } from './ImportServices';

const DETAILS = {
  serverId: 'den',
  version: '12.1.0',
  clientId: 'c',
  userTokens: {},
  pathMappings: [],
};

/**
 * A Jellyfin on the network that answers to the key `good` and refuses any other.
 *
 * @returns The fetch to reach it.
 */
const aJellyfinOnTheNetwork = () =>
  aFakeSourceFetch(({ url, headers }) => {
    if (
      !(headers.Authorization ?? '').includes('Token="good"') &&
      url.pathname !== '/System/Info/Public'
    ) {
      return { status: 401, body: '' };
    }

    const files: Record<string, string> = {
      '/Users': 'jellyfin-users.json',
      '/Library/VirtualFolders': 'jellyfin-folders.json',
      '/Localization/ParentalRatings': 'jellyfin-parental-ratings.json',
    };
    const file = files[url.pathname];

    if (file !== undefined) {
      return { body: readFixture(file) };
    }

    return { body: readFixture('jellyfin-public-info.json') };
  });

/**
 * An import service over a test's database.
 *
 * @param changes - Anything a test replaces.
 * @returns The service, its services, and what they were asked.
 */
const anImportService = async (changes: Partial<ImportServices> = {}) => {
  const { db } = await aLibraryToImportInto(await aHousehold());
  const { services, asked } = someImportServices(db, aSourceToImport(), changes);

  return { imports: createImportService(services), services, asked, db };
};

describe('createImportService', { timeout: 60_000 }, () => {
  it('connects a source by reading it, keeps it without ever showing its key, and reconnects the same server', async () => {
    const { fetch } = aJellyfinOnTheNetwork();
    const { imports, services } = await anImportService({ fetch, readerFor: undefined });
    const connected = await imports.connect({
      kind: 'jellyfin',
      url: 'http://den:8096/',
      token: 'good',
    });

    if (connected.kind !== 'connected') {
      throw new Error('it did not connect');
    }

    expect(connected.source).toMatchObject({
      kind: 'jellyfin',
      name: 'Den',
      url: 'http://den:8096',
      version: '12.1.0',
    });
    expect(JSON.stringify(connected.source)).not.toContain('good');

    const again = await imports.connect({
      kind: 'jellyfin',
      url: 'http://den:8096',
      token: 'good',
    });

    expect(again.kind === 'connected' ? again.source.id : null).toBe(connected.source.id);
    expect(await services.store.listSources()).toHaveLength(1);

    const status = await imports.status();

    expect(status).toMatchObject({ requests: 'off', runs: [] });
    expect(JSON.stringify(status)).not.toContain('good');
  });

  it('says why a source could not be connected', async () => {
    const { fetch } = aJellyfinOnTheNetwork();
    const { imports } = await anImportService({ fetch, readerFor: undefined });

    expect(
      await imports.connect({ kind: 'jellyfin', url: 'http://den', token: 'bad' }),
    ).toMatchObject({
      kind: 'refused',
      reason: { code: 'server.imports.sourceCaller.nameRefusedTheKey' },
    });
  });

  it('lists the people on a source, says why it could not, and has nothing for a source not there', async () => {
    const { imports, services } = await anImportService();
    const source = await services.store.addSource({
      kind: 'jellyfin',
      name: 'Den',
      url: 'http://den',
      token: 'k',
      details: DETAILS,
    });
    const broken = createImportService({
      ...services,
      readerFor: () =>
        aSourceToImport({
          users: () =>
            Promise.reject(
              new SourceFailure(saying('server.imports.mediaBrowserReader.thereIsNobodyOnIt')),
            ),
        }),
    });

    expect(await imports.people(source.id)).toEqual([
      { id: 'u-pat', name: 'Pat', isAdministrator: true, isDisabled: false, access: 'readable' },
      { id: 'u-sam', name: 'Sam', isAdministrator: false, isDisabled: false, access: 'readable' },
      {
        id: 'u-old',
        name: 'Old Lodger',
        isAdministrator: false,
        isDisabled: true,
        access: 'readable',
      },
      { id: 'u-ash', name: 'Ash', isAdministrator: false, isDisabled: false, access: 'needsPin' },
    ]);
    expect(await broken.people(source.id)).toMatchObject({
      kind: 'refused',
      reason: { code: 'server.imports.mediaBrowserReader.thereIsNobodyOnIt' },
    });
    expect(await imports.people('missing')).toBeNull();
    expect(await imports.forget(source.id)).toBe(true);
    expect(await imports.forget(source.id)).toBe(false);
  });

  it('turns a Plex Home member’s PIN into a token for the server, without keeping the PIN', async () => {
    const { fetch } = aFakeSourceFetch(({ url }) => ({
      body: readFixture(
        url.pathname === '/api/v2/resources' ? 'plextv-resources.xml' : 'plextv-switch.xml',
      ),
    }));
    const { imports, services } = await anImportService({ fetch });
    const plex = await services.store.addSource({
      kind: 'plex',
      name: 'Shed',
      url: 'http://shed',
      token: 'owner',
      details: { ...DETAILS, serverId: 'abc123machine' },
    });
    const jellyfin = await services.store.addSource({
      kind: 'jellyfin',
      name: 'Den',
      url: 'http://den',
      token: 'k',
      details: DETAILS,
    });

    expect(await imports.givePin(plex.id, { userId: '2222', pin: '1234' })).toBe('given');
    expect((await services.store.findSource(plex.id))?.details.userTokens).toEqual({
      '2222': 'ash-server-token',
    });
    expect(JSON.stringify(await services.store.findSource(plex.id))).not.toContain('1234');
    expect(await imports.givePin(jellyfin.id, { userId: '1', pin: '1234' })).toBeNull();
  });

  it('says a PIN was wrong', async () => {
    const { fetch } = aFakeSourceFetch(() => ({ status: 401, body: '' }));
    const { imports, services } = await anImportService({ fetch });
    const plex = await services.store.addSource({
      kind: 'plex',
      name: 'Shed',
      url: 'http://shed',
      token: 'o',
      details: DETAILS,
    });

    expect(await imports.givePin(plex.id, { userId: '2222', pin: '0000' })).toMatchObject({
      kind: 'refused',
      reason: { code: 'server.imports.resolvePlexHomeToken.thatPinWasNotRight' },
    });
  });

  it('brings a source’s folder into a library Valence already has, and says why it could not', async () => {
    const { imports, services } = await anImportService();
    const source = await services.store.addSource({
      kind: 'jellyfin',
      name: 'Den',
      url: 'http://den',
      token: 'k',
      details: DETAILS,
    });
    const link = { sourceLibraryId: 'lib-films', sourcePath: '/data/movies', libraryId: 'shows' };
    const broken = createImportService({
      ...services,
      readerFor: () =>
        aSourceToImport({
          libraries: () =>
            Promise.reject(
              new SourceFailure(saying('server.imports.mediaBrowserReader.thereIsNobodyOnIt')),
            ),
        }),
    });

    const linked = await imports.linkLibrary(source.id, link);

    expect(
      linked !== null && 'libraries' in linked
        ? linked.libraries
            .find((library) => library.sourceLibraryId === 'lib-films')
            ?.locations.find((location) => location.sourcePath === '/data/movies')?.libraryId
        : null,
    ).toBe('shows');
    expect((await services.store.links(source.id, 'library')).get('lib-films|/data/movies')).toBe(
      'shows',
    );
    expect(
      await imports.linkLibrary(source.id, {
        ...link,
        sourcePath: '/data/other',
        libraryId: 'gone',
      }),
    ).toEqual({
      kind: 'refused',
      reason: saying('server.imports.importService.thatLibraryIsNotInValence'),
    });
    expect((await services.store.links(source.id, 'library')).has('lib-films|/data/other')).toBe(
      false,
    );
    expect(await broken.linkLibrary(source.id, link)).toMatchObject({
      kind: 'refused',
      reason: { code: 'server.imports.mediaBrowserReader.thereIsNobodyOnIt' },
    });
    expect(await imports.linkLibrary('missing', link)).toBeNull();
  });

  it('places the libraries by the mappings, makes and scans the ones asked for, and remembers them', async () => {
    const { imports, services, asked } = await anImportService();
    const source = await services.store.addSource({
      kind: 'jellyfin',
      name: 'Den',
      url: 'http://den',
      token: 'k',
      details: DETAILS,
    });
    const mapped = await imports.saveMappings(source.id, [{ from: '/data/', to: '/media\\' }]);

    expect(mapped !== null && 'libraries' in mapped ? mapped.mappings : null).toEqual([
      { from: '/data', to: '/media' },
    ]);
    expect(
      mapped !== null && 'libraries' in mapped ? mapped.libraries[1]?.locations[0] : null,
    ).toEqual({
      sourcePath: '/data/tv',
      valencePath: '/media/tv',
      libraryId: 'shows',
    });

    const made = await imports.createLibraries(source.id, {
      libraries: [
        { sourceLibraryId: 'lib-films', sourcePath: '/data/movies', name: 'Films', kind: 'movies' },
        { sourceLibraryId: 'lib-shows', sourcePath: '/data/tv', name: 'Shows', kind: 'shows' },
        { sourceLibraryId: 'lib-music', sourcePath: '/elsewhere', name: 'Music', kind: 'music' },
      ],
    });

    expect(
      made?.map((one) => [one.sourcePath, one.libraryId === null, one.problem?.code ?? null]),
    ).toEqual([
      ['/data/movies', false, null],
      ['/data/tv', false, null],
      ['/elsewhere', true, 'server.imports.importService.valenceCannotSeeAFolderAtPath'],
    ]);
    expect(made?.[1]?.libraryId).toBe('shows');
    expect(asked.created.map((one) => one.path)).toEqual(['/media/movies', '/elsewhere']);
    expect(asked.scanned).toHaveLength(2);
    expect((await services.store.links(source.id, 'library')).get('lib-films|/data/movies')).toBe(
      made?.[0]?.libraryId,
    );
    expect(await imports.createLibraries('missing', { libraries: [] })).toBeNull();
    expect(await imports.libraries('missing')).toBeNull();
    expect(await imports.saveMappings('missing', [])).toBeNull();
  });

  it('plans as a job, follows it, starts the import once planned, and can stop it', async () => {
    const { imports, services, asked } = await anImportService();
    const source = await services.store.addSource({
      kind: 'jellyfin',
      name: 'Den',
      url: 'http://den',
      token: 'k',
      details: DETAILS,
    });
    const run = await imports.plan(
      source.id,
      { skipUserIds: ['u-old'], meUserId: 'u-pat' },
      'account',
    );

    if (run === null) {
      throw new Error('it did not plan');
    }

    expect(run).toMatchObject({ state: 'planning', progress: null });
    expect(asked.enqueued).toEqual([{ kind: 'import.plan', runId: run.id }]);
    expect(await imports.start(run.id)).toBe('notPlanned');

    services.jobs.reportProgress(
      'job-1',
      saying('server.imports.progress.readingWhatEachPersonWatched'),
      1,
      4,
    );

    expect((await imports.readRun(run.id))?.progress).toMatchObject({ processed: 1, total: 4 });

    await imports.runPlanJob('job-1', run.id);

    expect((await imports.readRun(run.id))?.state).toBe('planned');

    const started = await imports.start(run.id);

    expect(started !== null && started !== 'notPlanned' ? started.state : null).toBe('importing');
    expect(asked.enqueued[1]).toEqual({ kind: 'import.run', runId: run.id });

    const stopped = await imports.cancel(run.id);

    expect(stopped?.state).toBe('cancelled');
    expect(asked.cancelled.has('job-2')).toBe(true);
    expect(await imports.cancel('missing')).toBeNull();
    expect(await imports.start('missing')).toBeNull();
    expect(await imports.readRun('missing')).toBeNull();
    expect(await imports.plan('missing', { skipUserIds: [], meUserId: null }, null)).toBeNull();
  });

  it('carries out the import as a job, then makes setup links for the people it added', async () => {
    const { imports, services } = await anImportService();
    const source = await services.store.addSource({
      kind: 'jellyfin',
      name: 'Den',
      url: 'http://den',
      token: 'k',
      details: DETAILS,
    });
    const run = await imports.plan(source.id, { skipUserIds: [], meUserId: 'u-pat' }, 'account');

    if (run === null) {
      throw new Error('it did not plan');
    }

    await imports.runPlanJob('job-1', run.id);
    await imports.start(run.id);
    await imports.runImportJob('job-2', run.id);

    expect((await imports.readRun(run.id))?.state).toBe('completed');

    const links = await imports.setupLinks(run.id, 7, 'account', 'http://valence');

    expect(links?.canEmail).toBe(true);
    expect(links?.links.map((link) => [link.name, link.hasEmail, link.expiresAt])).toEqual([
      ['Sam', false, '2026-10-09T00:00:00.000Z'],
      ['Old Lodger', true, '2026-10-09T00:00:00.000Z'],
    ]);

    const again = await imports.start(run.id);

    expect(again !== null && again !== 'notPlanned' ? again.state : null).toBe('importing');
    expect((await services.store.findRun(run.id))?.cursor).toBeNull();
    expect(await imports.setupLinks('missing', 7, null, undefined)).toBeNull();
  });

  it('marks a plan failed with the source’s own words, or general ones, and stopped when cancelled', async () => {
    const failing = await anImportService({
      readerFor: () =>
        aSourceToImport({
          identify: () =>
            Promise.reject(
              new SourceFailure(
                saying('server.imports.sourceCaller.nameRefusedTheKey', { name: 'Jellyfin' }),
              ),
            ),
        }),
    });
    const crashing = await anImportService({
      readerFor: () => aSourceToImport({ identify: () => Promise.reject(new Error('boom')) }),
    });

    for (const { imports, services } of [failing, crashing]) {
      const source = await services.store.addSource({
        kind: 'jellyfin',
        name: 'Den',
        url: 'http://den',
        token: 'k',
        details: DETAILS,
      });
      const run = await imports.plan(source.id, { skipUserIds: [], meUserId: null }, null);

      await imports.runPlanJob('job-1', run?.id ?? '');
    }

    expect((await failing.services.store.latestRuns())[0]).toMatchObject({
      state: 'failed',
      failure: { code: 'server.imports.sourceCaller.nameRefusedTheKey' },
    });
    expect((await crashing.services.store.latestRuns())[0]?.failure?.code).toBe(
      'server.imports.importService.somethingWentWrongReadingTheSource',
    );
    expect(crashing.asked.logged[0]).toContain('boom');

    const cancelled = await anImportService();
    const source = await cancelled.services.store.addSource({
      kind: 'jellyfin',
      name: 'Den',
      url: 'http://den',
      token: 'k',
      details: DETAILS,
    });
    const run = await cancelled.imports.plan(source.id, { skipUserIds: [], meUserId: null }, null);

    cancelled.asked.cancelled.add('job-1');
    await cancelled.imports.runPlanJob('job-1', run?.id ?? '');

    expect((await cancelled.imports.readRun(run?.id ?? ''))?.state).toBe('cancelled');
  });

  it('says why the libraries could not be read', async () => {
    const { imports, services } = await anImportService({
      readerFor: () => aSourceToImport({ libraries: () => Promise.reject(new Error('down')) }),
    });
    const source = await services.store.addSource({
      kind: 'jellyfin',
      name: 'Den',
      url: 'http://den',
      token: 'k',
      details: DETAILS,
    });

    expect(await imports.libraries(source.id)).toMatchObject({ kind: 'refused' });
    expect(await imports.saveMappings(source.id, [])).toMatchObject({ kind: 'refused' });
  });
});
