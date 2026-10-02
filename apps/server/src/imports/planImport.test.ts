import { describe, expect, it } from 'vitest';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aLibraryToImportInto } from './aLibraryToImportInto';
import { aSourceToImport } from './aSourceToImport';
import { planImport } from './planImport';
import { someImportServices } from './someImportServices';
import type { ImportServices } from './ImportServices';

const MAPPINGS = [
  { from: '/data/tv', to: '/media/tv' },
  { from: '/data/movies', to: '/films' },
];

/**
 * A source connected and a run waiting to be planned.
 *
 * @param services - What the import works with.
 * @param kind - What kind of server the source is.
 * @returns The run.
 */
const aRunToPlan = async (services: ImportServices, kind: 'jellyfin' | 'plex' = 'jellyfin') => {
  const source = await services.store.addSource({
    kind,
    name: 'Den',
    url: 'http://den',
    token: 'key',
    details: {
      serverId: 'den',
      version: '12.1.0',
      clientId: 'c',
      userTokens: {},
      pathMappings: MAPPINGS,
    },
  });

  return services.store.addRun(source.id, { skipUserIds: [], meUserId: 'u-pat', by: 'account' });
};

describe('planImport', { timeout: 60_000 }, () => {
  it('reads everything, writes nothing but the report, and says what each person will get', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const { services, asked } = someImportServices(db);
    const run = await aRunToPlan(services);

    expect(await planImport(services, run.id, 'job')).toBe(true);

    const planned = await services.store.findRun(run.id);
    const people = Object.fromEntries(
      (planned?.report?.people ?? []).map((person) => [person.sourceUserId, person]),
    );

    expect(planned?.state).toBe('planned');
    expect(planned?.report?.source).toEqual({ kind: 'jellyfin', name: 'Den', version: '12.1.0' });
    expect(planned?.report?.counts).toEqual({
      people: 3,
      libraries: 3,
      items: 6,
      matched: 5,
      unmatched: 1,
      watched: 2,
      resumes: 2,
      plays: 4,
      favourites: 3,
      ratings: 2,
      playlists: 1,
      collections: 1,
      markers: 3,
    });
    expect(people['u-pat']).toMatchObject({
      isYou: true,
      watched: 2,
      resumes: 1,
      plays: 4,
      favourites: 3,
      ratings: 2,
      playlists: 1,
      libraries: null,
    });
    expect(people['u-sam']).toMatchObject({
      isYou: false,
      resumes: 1,
      libraries: 1,
      maximumAge: 13,
    });
    expect(people['u-old']).toMatchObject({ isDisabled: true, email: 'old@example.test' });
    expect(people['u-ash']?.skipped?.code).toBe('server.imports.skipReasonOf.theirPinWasNotGiven');
    expect(planned?.report?.unmatched).toEqual([
      expect.objectContaining({ title: 'A Home Movie', year: 2019, kind: 'movie' }),
    ]);
    expect(planned?.report?.notBroughtAcross.map((said) => said.code)).toEqual([
      'server.imports.planImport.passwordsStayBehind',
      'server.imports.planImport.languagePreferencesStayBehind',
      'server.imports.planImport.playCountsAreSpreadOnSource',
      'server.imports.planImport.likesStayBehind',
      'server.imports.planImport.favouriteProgrammesStayBehind',
    ]);
    expect(asked.progress.get('job')?.phase.code).toBe(
      'server.imports.progress.readingCollectionsAndPlaylists',
    );
    expect(asked.created).toEqual([]);
  });

  it('says Plex watchlists stay behind, and that collections do where they cannot be built', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const { services } = someImportServices(db, aSourceToImport(), { collections: null });
    const run = await aRunToPlan(services, 'plex');

    await planImport(services, run.id, 'job');

    const codes = (await services.store.findRun(run.id))?.report?.notBroughtAcross.map(
      (said) => said.code,
    );

    expect(codes).toContain('server.imports.planImport.plexWatchlistsStayBehind');
    expect(codes).toContain('server.imports.planImport.collectionsAreOff');
    expect(codes).not.toContain('server.imports.planImport.likesStayBehind');
  });

  it('stops when the plan is cancelled, and plans nothing for a run that is not there', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const { services, asked } = someImportServices(db);
    const run = await aRunToPlan(services);

    asked.cancelled.add('job');

    expect(await planImport(services, run.id, 'job')).toBe(false);
    expect((await services.store.findRun(run.id))?.state).toBe('planning');
    expect(await planImport(services, 'missing', 'job')).toBe(false);
  });
});
