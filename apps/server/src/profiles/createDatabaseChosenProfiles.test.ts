import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { apikey, session, user, viewerProfile } from '#dialect/Schema';
import { createDatabaseChosenProfiles } from './createDatabaseChosenProfiles';

const STARTING_POSTGRES_MS = 60_000;

/**
 * Chosen profiles over a fresh database holding one account with two profiles, two sessions and a
 * key.
 *
 * @returns The chosen profiles, and the database behind them.
 */
const aStore = async () => {
  const db = await aMigratedDatabase();
  const now = new Date();

  await db.insert(user).values({ id: 'dan', name: 'Dan', email: 'dan@example.com' });
  await db.insert(viewerProfile).values([
    { id: 'parent', userId: 'dan', name: 'Parent', colour: 'red', isOwner: true },
    { id: 'kid', userId: 'dan', name: 'Kid', colour: 'red' },
  ]);
  await db.insert(session).values([
    { id: 'session-1', token: 'token-1', userId: 'dan', expiresAt: now, updatedAt: now },
    { id: 'session-2', token: 'token-2', userId: 'dan', expiresAt: now, updatedAt: now },
  ]);
  await db.insert(apikey).values({
    id: 'key-1',
    configId: 'default',
    referenceId: 'dan',
    key: 'hashed',
    createdAt: now,
    updatedAt: now,
  });

  return { db, chosen: createDatabaseChosenProfiles(db) };
};

describe('createDatabaseChosenProfiles', () => {
  it(
    'remembers who a session chose, only the latest, and for that session alone',
    async () => {
      const { chosen } = await aStore();

      await expect(chosen.chosenFor('session-1')).resolves.toBeNull();

      await chosen.choose('session-1', 'kid');
      await chosen.choose('session-1', 'parent');

      await expect(chosen.chosenFor('session-1')).resolves.toBe('parent');
      await expect(chosen.chosenFor('session-2')).resolves.toBeNull();
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'takes the same choice made many times at once, as the first requests of a session do',
    async () => {
      const { chosen } = await aStore();

      await Promise.all(Array.from({ length: 12 }, () => chosen.choose('session-1', 'kid')));

      await expect(chosen.chosenFor('session-1')).resolves.toBe('kid');
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'forgets a session’s choice and leaves another’s',
    async () => {
      const { chosen } = await aStore();

      await chosen.choose('session-1', 'kid');
      await chosen.choose('session-2', 'parent');
      await chosen.forget('session-1');

      await expect(chosen.chosenFor('session-1')).resolves.toBeNull();
      await expect(chosen.chosenFor('session-2')).resolves.toBe('parent');
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'forgets the choice with the session, when the session ends',
    async () => {
      const { db, chosen } = await aStore();

      await chosen.choose('session-1', 'kid');
      await db.delete(session).where(eq(session.id, 'session-1'));

      await expect(chosen.chosenFor('session-1')).resolves.toBeNull();
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'forgets the choice with the profile, when the profile is removed',
    async () => {
      const { db, chosen } = await aStore();

      await chosen.choose('session-1', 'kid');
      await chosen.tieKey('key-1', 'kid');
      await db.delete(viewerProfile).where(eq(viewerProfile.id, 'kid'));

      await expect(chosen.chosenFor('session-1')).resolves.toBeNull();
      await expect(chosen.keyProfileOf('key-1')).resolves.toBeNull();
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'remembers which profile a key acts for, only the latest, until the key goes',
    async () => {
      const { db, chosen } = await aStore();

      await expect(chosen.keyProfileOf('key-1')).resolves.toBeNull();

      await chosen.tieKey('key-1', 'kid');
      await chosen.tieKey('key-1', 'parent');

      await expect(chosen.keyProfileOf('key-1')).resolves.toBe('parent');

      await db.delete(apikey).where(eq(apikey.id, 'key-1'));

      await expect(chosen.keyProfileOf('key-1')).resolves.toBeNull();
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'will not choose a profile that does not exist',
    async () => {
      const { chosen } = await aStore();

      await expect(chosen.choose('session-1', 'nobody')).rejects.toThrow();
      await expect(chosen.chosenFor('session-1')).resolves.toBeNull();
    },
    STARTING_POSTGRES_MS,
  );
});
