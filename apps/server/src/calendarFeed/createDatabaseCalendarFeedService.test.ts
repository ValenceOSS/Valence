import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { calendarFeed, user, viewerProfile } from '#dialect/Schema';
import { sealingKeyFrom } from '@ValenceServer/plugins/sealingKeyFrom';
import { createDatabaseCalendarFeedService } from './createDatabaseCalendarFeedService';

const STARTING_POSTGRES_MS = 60_000;

const KEY = sealingKeyFrom('a-server-secret-that-is-long-enough-to-use', 'valence-calendar-feeds');

const ADA = { accountId: 'ada', profileId: 'ada-face' };

const ADA_WITHOUT_A_FACE = { accountId: 'ada', profileId: null };

/**
 * A calendar feed service over a fresh database holding one account with one face.
 *
 * @param key - The key the service seals tokens with.
 * @returns The service and the database under it.
 */
const aService = async (key = KEY) => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
  await db
    .insert(viewerProfile)
    .values({ id: 'ada-face', userId: 'ada', name: 'Ada', colour: '#336699' });

  return { db, service: createDatabaseCalendarFeedService(db, key) };
};

describe('createDatabaseCalendarFeedService', () => {
  it(
    'hands back the same link however often it is asked for, and finds its person by it',
    async () => {
      const { service } = await aService();

      expect(await service.read(ADA)).toBeNull();

      const first = await service.ensure(ADA);
      const again = await service.ensure(ADA);

      expect(again.token).toBe(first.token);
      expect(await service.resolve(first.token ?? '')).toEqual(ADA);
      expect((await service.read(ADA))?.lastReadAt).not.toBeNull();
      expect(await service.resolve('not-a-token')).toBeNull();
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps the token sealed and its hash, never the token itself',
    async () => {
      const { db, service } = await aService();
      const { token } = await service.ensure(ADA);
      const [row] = await db.select().from(calendarFeed).where(eq(calendarFeed.accountId, 'ada'));

      expect(row?.sealedToken).not.toContain(token ?? 'never');
      expect(row?.tokenHash).not.toBe(token);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'stops the old link working when a new one is made',
    async () => {
      const { service } = await aService();
      const first = await service.ensure(ADA);
      const second = await service.renew(ADA);

      expect(second.token).not.toBe(first.token);
      expect(await service.resolve(first.token ?? '')).toBeNull();
      expect(await service.resolve(second.token ?? '')).toEqual(ADA);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'makes a link afresh where the old one was sealed under a key the server no longer has',
    async () => {
      const { db, service } = await aService();
      const first = await service.ensure(ADA);
      const rekeyed = createDatabaseCalendarFeedService(
        db,
        sealingKeyFrom('another-server-secret-entirely-different', 'valence-calendar-feeds'),
      );

      expect((await rekeyed.read(ADA))?.token).toBeNull();

      const second = await rekeyed.ensure(ADA);

      expect(second.token).not.toBeNull();
      expect(second.token).not.toBe(first.token);
      expect(await service.resolve(first.token ?? '')).toBeNull();
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps a link for a face apart from the account’s own',
    async () => {
      const { service } = await aService();
      const faced = await service.ensure(ADA);
      const faceless = await service.ensure(ADA_WITHOUT_A_FACE);

      expect(await service.resolve(faced.token ?? '')).toEqual(ADA);
      expect(await service.resolve(faceless.token ?? '')).toEqual(ADA_WITHOUT_A_FACE);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'turns a link off, saying whether there was one',
    async () => {
      const { service } = await aService();
      const { token } = await service.ensure(ADA);

      expect(await service.stop(ADA)).toBe(true);
      expect(await service.resolve(token ?? '')).toBeNull();
      expect(await service.stop(ADA)).toBe(false);
    },
    STARTING_POSTGRES_MS,
  );
});
