import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { account, accountSetupLink, user } from '#dialect/Schema';
import { createDatabaseSetupLinkService } from './createDatabaseSetupLinkService';
import { hashSetupToken } from './hashSetupToken';

const STARTING_POSTGRES_MS = 60_000;

const DAY = 86_400_000;

const START = Date.UTC(2026, 9, 2);

/**
 * A database holding one account waiting to be set up, and the service over it on a clock the test
 * moves.
 *
 * @returns The service, its database and the clock's hand.
 */
const aService = async () => {
  const db = await aMigratedDatabase();
  const clock = { at: START };

  await db.insert(user).values([
    { id: 'ada', name: 'Ada Lovelace', email: 'ada@no-email.invalid', username: 'ada' },
    { id: 'sam', name: 'Sam', email: 'sam@example.com', username: 'sam', displayUsername: 'Sam' },
  ]);

  const links = createDatabaseSetupLinkService({
    db,
    address: 'http://valence.local:8420/',
    now: () => {
      clock.at += 1;

      return new Date(clock.at);
    },
  });

  return { links, db, clock };
};

describe('createDatabaseSetupLinkService', () => {
  it(
    'hands out a link on the given origin and keeps only a hash of its token',
    async () => {
      const { links, db } = await aService();

      const issued = await links.issue('ada', {
        lifetimeDays: 7,
        by: 'sam',
        origin: 'https://watch.example',
      });
      const rows = await db.select().from(accountSetupLink);

      expect(issued.url).toBe(`https://watch.example/welcome/${issued.token}`);
      expect(issued.token.length).toBeGreaterThanOrEqual(43);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.tokenHash).toBe(hashSetupToken(issued.token));
      expect(JSON.stringify(rows)).not.toContain(issued.token);
      expect(issued.expiresAt.getTime() - START).toBeCloseTo(7 * DAY, -2);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'falls back on the server’s own address',
    async () => {
      const { links } = await aService();

      const issued = await links.issue('ada', { lifetimeDays: 1, by: null });

      expect(issued.url).toBe(`http://valence.local:8420/welcome/${issued.token}`);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'says an account is waiting, then expired once its link runs out',
    async () => {
      const { links, clock } = await aService();

      await expect(links.stateOf('ada')).resolves.toBe('none');

      await links.issue('ada', { lifetimeDays: 1, by: null });

      await expect(links.stateOf('ada')).resolves.toBe('waiting');

      clock.at += 2 * DAY;

      await expect(links.stateOf('ada')).resolves.toBe('expired');
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'stops the earlier link working when a new one is made',
    async () => {
      const { links } = await aService();

      const first = await links.issue('ada', { lifetimeDays: 7, by: null });
      const second = await links.issue('ada', { lifetimeDays: 30, by: null });

      await expect(links.inspect(first.token)).resolves.toBeNull();
      await expect(links.inspect(second.token)).resolves.toMatchObject({ userId: 'ada' });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'stops a revoked link working',
    async () => {
      const { links } = await aService();

      const issued = await links.issue('ada', { lifetimeDays: 7, by: null });

      await links.revoke('ada');

      await expect(links.inspect(issued.token)).resolves.toBeNull();
      await expect(links.redeem(issued.token, {})).resolves.toEqual({ kind: 'gone' });
      await expect(links.stateOf('ada')).resolves.toBe('none');
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'says what the owner still has to choose, without the placeholder address',
    async () => {
      const { links } = await aService();

      const issued = await links.issue('ada', { lifetimeDays: 7, by: null });

      await expect(links.inspect(issued.token)).resolves.toMatchObject({
        userId: 'ada',
        name: 'Ada Lovelace',
        username: 'ada',
        suggestedUsername: 'ada',
        email: null,
        hasPassword: false,
      });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'works once, keeping the username and address chosen',
    async () => {
      const { links, db } = await aService();

      const issued = await links.issue('ada', { lifetimeDays: 7, by: null });

      await expect(
        links.redeem(issued.token, { username: 'Countess', email: 'Ada@Example.com' }),
      ).resolves.toEqual({ kind: 'redeemed', userId: 'ada', username: 'countess' });
      await expect(links.redeem(issued.token, {})).resolves.toEqual({ kind: 'gone' });
      await expect(links.stateOf('ada')).resolves.toBe('used');

      const [row] = await db.select().from(user).where(eq(user.id, 'ada'));

      expect(row).toMatchObject({
        username: 'countess',
        displayUsername: 'Countess',
        email: 'ada@example.com',
      });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'refuses a username or an address somebody else holds, and leaves the link working',
    async () => {
      const { links } = await aService();

      const issued = await links.issue('ada', { lifetimeDays: 7, by: null });

      await expect(links.redeem(issued.token, { username: 'SAM' })).resolves.toEqual({
        kind: 'taken',
        field: 'username',
      });
      await expect(links.redeem(issued.token, { email: 'sam@example.com' })).resolves.toEqual({
        kind: 'taken',
        field: 'email',
      });
      await expect(links.stateOf('ada')).resolves.toBe('waiting');
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps the username of an account that already signs in, using the link as a reset',
    async () => {
      const { links, db } = await aService();

      await db.insert(account).values({
        id: 'credential-sam',
        accountId: 'sam',
        providerId: 'credential',
        userId: 'sam',
        password: 'a-hash',
        updatedAt: new Date(START),
      });

      const issued = await links.issue('sam', { lifetimeDays: 1, by: null });

      await expect(links.inspect(issued.token)).resolves.toMatchObject({
        email: 'sam@example.com',
        hasPassword: true,
      });
      await expect(
        links.redeem(issued.token, { username: 'someone.else', email: 'other@example.com' }),
      ).resolves.toEqual({ kind: 'redeemed', userId: 'sam', username: 'sam' });

      const [row] = await db.select().from(user).where(eq(user.id, 'sam'));

      expect(row).toMatchObject({ username: 'sam', email: 'sam@example.com' });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'reports every account’s standing at once',
    async () => {
      const { links } = await aService();

      await links.issue('ada', { lifetimeDays: 7, by: null });

      const standings = await links.statesOf(['ada', 'sam']);

      expect(standings.get('ada')?.state).toBe('waiting');
      expect(standings.has('sam')).toBe(false);
      await expect(links.statesOf([])).resolves.toEqual(new Map());
    },
    STARTING_POSTGRES_MS,
  );
});
