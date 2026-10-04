import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import {
  favourite,
  favouriteArtist,
  mediaSegment,
  rating,
  user,
  viewerProfile,
  watchHistory,
  watchProgress,
} from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aLibraryToImportInto } from './aLibraryToImportInto';
import { aSourceToImport } from './aSourceToImport';
import { planImport } from './planImport';
import { runImport } from './runImport';
import { someImportServices } from './someImportServices';
import type { ImportServices } from './ImportServices';

const MAPPINGS = [
  { from: '/data/tv', to: '/media/tv' },
  { from: '/data/movies', to: '/films' },
];

/**
 * A source connected and its import planned, ready to run.
 *
 * @param services - What the import works with.
 * @returns The run.
 */
const aPlannedRun = async (services: ImportServices) => {
  const source = await services.store.addSource({
    kind: 'jellyfin',
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
  const run = await services.store.addRun(source.id, {
    skipUserIds: [],
    meUserId: 'u-pat',
    by: 'account',
  });

  await planImport(services, run.id, 'plan-job');

  return run;
};

/**
 * The account an import made for somebody, by their name.
 *
 * @param db - The database.
 * @param name - Their name.
 * @returns The account.
 */
const accountNamed = async (db: AnyValenceDatabase, name: string) => {
  const [found] = await db.select().from(user).where(eq(user.name, name));

  if (found === undefined) {
    throw new Error(`no account for ${name}`);
  }

  return found;
};

/**
 * The profile an account's watching went onto.
 *
 * @param db - The database.
 * @param userId - The account.
 * @returns The profile's id.
 */
const profileOf = async (db: AnyValenceDatabase, userId: string): Promise<string> => {
  const [found] = await db
    .select({ id: viewerProfile.id })
    .from(viewerProfile)
    .where(eq(viewerProfile.userId, userId))
    .limit(1);

  return found?.id ?? '';
};

describe('runImport', { timeout: 60_000 }, () => {
  it('brings the people across: you as yourself, the others as new accounts, the disabled banned', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const { services, asked } = someImportServices(db);
    const run = await aPlannedRun(services);

    expect(await runImport(services, run.id, 'job')).toBe('completed');

    const sam = await accountNamed(db, 'Sam');
    const old = await accountNamed(db, 'Old Lodger');
    const finished = await services.store.findRun(run.id);
    const outcomes = Object.fromEntries(
      (finished?.report?.people ?? []).map((person) => [
        person.sourceUserId,
        [person.outcome, person.userId],
      ]),
    );

    expect(outcomes).toEqual({
      'u-pat': ['you', 'account'],
      'u-sam': ['created', sam.id],
      'u-old': ['created', old.id],
      'u-ash': [null, null],
    });
    expect(sam.username).toBe('sam');
    expect(old).toMatchObject({
      email: 'old@example.test',
      banned: true,
      banReason: 'Disabled on Den before it was imported.',
    });
    expect(asked.administrators).toEqual([]);
    expect(await services.store.links(run.sourceId, 'account')).toEqual(
      new Map([
        ['u-pat', 'account'],
        ['u-sam', sam.id],
        ['u-old', old.id],
      ]),
    );
    expect(finished).toMatchObject({ state: 'completed', cursor: { phase: 'done' }, jobId: 'job' });
  });

  it('sets what each person may see, with their age ceiling, as the old server had it', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const { services, asked } = someImportServices(db);
    const run = await aPlannedRun(services);

    await runImport(services, run.id, 'job');

    const sam = await accountNamed(db, 'Sam');

    expect(asked.refused).toEqual([[sam.id, 'shows']]);
    expect(asked.allowed.filter(([who]) => who === sam.id)).toEqual([[sam.id, 'films']]);
    expect(asked.ceilings).toEqual([[sam.id, 'films', 13, false]]);
  });

  it('brings watching across with its own dates: finished, stopped part way, every play, kept and rated', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const { services } = someImportServices(db);
    const run = await aPlannedRun(services);

    await runImport(services, run.id, 'job');

    const pat = await profileOf(db, 'account');
    const progress = await db.select().from(watchProgress).where(eq(watchProgress.profileId, pat));
    const plays = await db.select().from(watchHistory).where(eq(watchHistory.profileId, pat));

    expect(
      Object.fromEntries(
        progress.map((row) => [
          row.mediaItemId,
          [row.positionSeconds, row.isFinished, row.updatedAt.toISOString()],
        ]),
      ),
    ).toEqual({
      heat: [10200, true, '2026-03-04T21:00:00.000Z'],
      'wire-101': [3720, true, '2026-04-01T20:00:00.000Z'],
      'wire-102': [1200, false, '2026-04-02T20:30:00.000Z'],
    });
    expect(plays).toHaveLength(4);
    expect(plays.every((play) => play.importedFrom === 'jellyfin' && play.importKey !== null)).toBe(
      true,
    );
    expect(
      (await db.select().from(favourite).where(eq(favourite.profileId, pat))).map(
        (row) => row.mediaItemId,
      ),
    ).toEqual(['heat']);
    expect(
      (await db.select().from(favouriteArtist).where(eq(favouriteArtist.profileId, pat))).map(
        (row) => row.artistId,
      ),
    ).toEqual(['massive']);
    expect(
      (await db.select().from(rating).where(eq(rating.profileId, pat)))
        .map((row) => [row.mediaItemId ?? row.seriesId, row.stars])
        .sort(),
    ).toEqual([
      ['heat', 5],
      ['wire', 5],
    ]);
  });

  it('builds collections and playlists from what matched, and brings markers across', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const { services, asked } = someImportServices(db);
    const run = await aPlannedRun(services);

    await runImport(services, run.id, 'job');

    expect([...asked.collections.values()]).toEqual([
      { name: 'Heat Collection', entries: [{ mediaItemId: 'heat' }, { seriesId: 'wire' }] },
    ]);
    expect(
      [...asked.playlists.values()].map((playlist) => [
        playlist.ownerId,
        playlist.name,
        playlist.isShared,
        playlist.entries.map((entry) => entry.mediaItemId),
      ]),
    ).toEqual([['account', 'Sunday', true, ['wire-101', 'heat']]]);
    expect(
      await db
        .select({
          kind: mediaSegment.kind,
          source: mediaSegment.source,
          start: mediaSegment.startSeconds,
        })
        .from(mediaSegment)
        .where(eq(mediaSegment.mediaItemId, 'wire-101')),
    ).toEqual([{ kind: 'intro', source: 'imported', start: 30 }]);
    expect((await services.store.findRun(run.id))?.report?.written).toMatchObject({
      people: 3,
      watched: 2,
      resumes: 2,
      plays: 4,
      collections: 1,
      playlists: 1,
      markers: 1,
    });
  });

  it('changes rather than repeats when run again', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const { services, asked } = someImportServices(db);
    const run = await aPlannedRun(services);

    await runImport(services, run.id, 'job');
    await services.store.changeRun(run.id, { cursor: null });
    await runImport(services, run.id, 'job-again');

    const pat = await profileOf(db, 'account');

    expect(await db.select().from(user)).toHaveLength(3);
    expect(
      await db.select().from(watchHistory).where(eq(watchHistory.profileId, pat)),
    ).toHaveLength(4);
    expect(asked.collections.size).toBe(1);
    expect(asked.playlists.size).toBe(1);
    expect([...asked.playlists.values()][0]?.entries).toHaveLength(2);
    expect(
      (await services.store.findRun(run.id))?.report?.people.find(
        (person) => person.sourceUserId === 'u-sam',
      )?.outcome,
    ).toBe('linked');
  });

  it('carries on from where it had got to after a restart', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const { services } = someImportServices(db);
    const run = await aPlannedRun(services);

    await runImport(services, run.id, 'job');
    await db.delete(mediaSegment);
    await services.store.changeRun(run.id, { cursor: { phase: 'markers', index: 0 } });

    expect(await runImport(services, run.id, 'restarted')).toBe('completed');
    expect(await db.select().from(user)).toHaveLength(3);
    expect(await db.select().from(mediaSegment)).toHaveLength(1);
  });

  it('stops when cancelled, saying so', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const { services, asked } = someImportServices(db);
    const run = await aPlannedRun(services);

    asked.cancelled.add('job');

    expect(await runImport(services, run.id, 'job')).toBe('cancelled');
    expect((await services.store.findRun(run.id))?.state).toBe('cancelled');
    expect(await db.select().from(watchHistory)).toHaveLength(0);
  });

  it('records what could not be done and carries on', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const reader = aSourceToImport({ markers: () => Promise.reject(new Error('down')) });
    const { services, asked } = someImportServices(db, reader, {
      playlists: {
        ...someImportServices(db).services.playlists,
        create: () => Promise.resolve(null),
      },
    });
    const run = await aPlannedRun(services);

    expect(await runImport(services, run.id, 'job')).toBe('completed');
    expect(asked.issues.map((issue) => issue.reason.code).sort()).toEqual([
      'common.thatPlaylistCouldNotBeMade',
      'server.imports.runImport.itsMarkersCouldNotBeRead',
      'server.imports.runImport.itsMarkersCouldNotBeRead',
      'server.imports.runImport.itsMarkersCouldNotBeRead',
    ]);
  });

  it('leaves collections alone where they cannot be built, and runs nothing that was not planned', async () => {
    const { db } = await aLibraryToImportInto(await aHousehold());
    const { services } = someImportServices(db, aSourceToImport(), { collections: null });
    const run = await aPlannedRun(services);

    expect(await runImport(services, run.id, 'job')).toBe('completed');
    expect(await runImport(services, 'missing', 'job')).toBe('missing');
    expect(
      await db
        .select()
        .from(watchProgress)
        .where(and(eq(watchProgress.mediaItemId, 'heat'), eq(watchProgress.isFinished, false))),
    ).toHaveLength(1);
  });
});
