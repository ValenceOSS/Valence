import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, user, viewerProfile } from '#dialect/Schema';
import { createDatabaseProfileLimits } from './createDatabaseProfileLimits';

const STARTING_POSTGRES_MS = 60_000;

const CEILING = { libraryId: 'films', maximumAge: 12, allowsUnrated: false };

/**
 * Profile limits over a fresh database holding one account, two profiles and three libraries.
 *
 * @returns The limits, and the database behind them.
 */
const aStore = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'dan', name: 'Dan', email: 'dan@example.com' });
  await db.insert(viewerProfile).values([
    { id: 'parent', userId: 'dan', name: 'Parent', colour: 'red', isOwner: true },
    { id: 'kid', userId: 'dan', name: 'Kid', colour: 'red' },
  ]);
  await db.insert(library).values([
    { id: 'films', name: 'Films', kind: 'movies', path: '/films' },
    { id: 'shows', name: 'Shows', kind: 'shows', path: '/shows' },
    { id: 'music', name: 'Music', kind: 'music', path: '/music' },
  ]);

  return { db, limits: createDatabaseProfileLimits(db) };
};

describe('createDatabaseProfileLimits', () => {
  it(
    'keeps a profile out of a library once, however often it is asked, and lets it back',
    async () => {
      const { limits } = await aStore();

      await expect(limits.refusedLibraries('kid')).resolves.toEqual([]);

      await limits.refuseLibrary('kid', 'films');
      await limits.refuseLibrary('kid', 'films');
      await limits.refuseLibrary('kid', 'music');

      expect([...(await limits.refusedLibraries('kid'))].sort()).toEqual(['films', 'music']);

      await limits.allowLibrary('kid', 'films');
      await limits.allowLibrary('kid', 'shows');

      await expect(limits.refusedLibraries('kid')).resolves.toEqual(['music']);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps one profile’s limits from another’s',
    async () => {
      const { limits } = await aStore();

      await limits.refuseLibrary('kid', 'films');
      await limits.setCeiling('kid', CEILING);

      await expect(limits.refusedLibraries('parent')).resolves.toEqual([]);
      await expect(limits.ceilingsFor('parent')).resolves.toEqual([]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps one cap per library, the latest, and lifts one without the others',
    async () => {
      const { limits } = await aStore();

      await expect(limits.ceilingsFor('kid')).resolves.toEqual([]);

      await limits.setCeiling('kid', CEILING);
      await limits.setCeiling('kid', { ...CEILING, maximumAge: 15, allowsUnrated: true });
      await limits.setCeiling('kid', { libraryId: 'shows', maximumAge: 7, allowsUnrated: false });

      expect(
        [...(await limits.ceilingsFor('kid'))].sort((one, other) =>
          one.libraryId.localeCompare(other.libraryId),
        ),
      ).toEqual([
        { libraryId: 'films', maximumAge: 15, allowsUnrated: true },
        { libraryId: 'shows', maximumAge: 7, allowsUnrated: false },
      ]);

      await limits.clearCeiling('kid', 'films');
      await limits.clearCeiling('kid', 'music');

      await expect(limits.ceilingsFor('kid')).resolves.toEqual([
        { libraryId: 'shows', maximumAge: 7, allowsUnrated: false },
      ]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'refuses a cap above the oldest age anything is certificated for',
    async () => {
      const { limits } = await aStore();

      await expect(limits.setCeiling('kid', { ...CEILING, maximumAge: 22 })).rejects.toThrow();
      await expect(limits.ceilingsFor('kid')).resolves.toEqual([]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'forgets a profile’s limits with the profile, and a library’s with the library',
    async () => {
      const { db, limits } = await aStore();

      await limits.refuseLibrary('kid', 'films');
      await limits.setCeiling('kid', { libraryId: 'shows', maximumAge: 7, allowsUnrated: false });
      await db.delete(library).where(eq(library.id, 'films'));

      await expect(limits.refusedLibraries('kid')).resolves.toEqual([]);

      await db.delete(viewerProfile).where(eq(viewerProfile.id, 'kid'));

      await expect(limits.ceilingsFor('kid')).resolves.toEqual([]);
    },
    STARTING_POSTGRES_MS,
  );
});
