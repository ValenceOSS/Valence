import { describe, expect, it, vi } from 'vitest';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { AUTH_PROVIDER } from '#dialect/AUTH_PROVIDER';
import { account, authSchema, session, user } from '#dialect/Schema';
import { createAuth } from '@ValenceServer/auth/Auth';
import { readEnv } from '@ValenceServer/env/Env';
import { createMemorySettingsStore } from '@ValenceServer/settings/createMemorySettingsStore';
import { ServerSettingsSchema } from '@ValenceServer/settings/ServerSettings';
import { createAccountWithoutPassword } from './createAccountWithoutPassword';

const STARTING_POSTGRES_MS = 60_000;

/**
 * The real authentication layer over a fresh database, noting every account its creation hook
 * hears about.
 *
 * @returns What makes accounts, its database, and what the hook heard.
 */
const aMaker = async () => {
  const db = await aMigratedDatabase();
  const created = vi.fn<(userId: string) => Promise<void>>().mockResolvedValue(undefined);
  const made = vi.fn<(userId: string, by: string | null) => void>();
  const auth = createAuth({
    env: readEnv({ AUTH_RATE_LIMIT_ENABLED: 'false' }),
    database: drizzleAdapter(db, { provider: AUTH_PROVIDER, schema: authSchema }),
    settings: createMemorySettingsStore(
      ServerSettingsSchema.parse({
        trustedOrigins: [],
        cookieSecure: false,
        setupCompletedAt: null,
      }),
    ),
    cookieSecure: false,
    onUserCreated: created,
  });

  return { maker: { auth, db, onMade: made }, auth, db, created, made };
};

describe('createAccountWithoutPassword', () => {
  it(
    'makes an account from a name alone, with a placeholder address and a username of its own',
    async () => {
      const { maker, db, created, made } = await aMaker();

      const outcome = await createAccountWithoutPassword(maker, {
        name: 'Ada Lovelace',
        by: 'boss',
      });

      expect(outcome.kind).toBe('created');

      const userId = outcome.kind === 'created' ? outcome.userId : '';
      const [row] = await db.select().from(user).where(eq(user.id, userId));

      expect(row).toMatchObject({
        email: `${userId}@no-email.invalid`,
        username: 'ada.lovelace',
        displayUsername: 'ada.lovelace',
      });
      expect(created).toHaveBeenCalledWith(userId);
      expect(made).toHaveBeenCalledWith(userId, 'boss');
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'gives nobody a password or a session, so nobody can sign in to it',
    async () => {
      const { maker, db } = await aMaker();

      await createAccountWithoutPassword(maker, {
        name: 'Ada',
        email: 'ada@example.com',
        by: null,
      });

      expect(await db.select().from(account)).toEqual([]);
      expect(await db.select().from(session)).toEqual([]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'keeps the username and address it is given, the address folded as better-auth keeps it',
    async () => {
      const { maker, db } = await aMaker();

      const outcome = await createAccountWithoutPassword(maker, {
        name: 'Ada',
        username: 'Ada.L',
        email: 'Ada@Example.com',
        by: null,
      });
      const [row] = await db
        .select()
        .from(user)
        .where(eq(user.id, outcome.kind === 'created' ? outcome.userId : ''));

      expect(row).toMatchObject({
        email: 'ada@example.com',
        username: 'ada.l',
        displayUsername: 'Ada.L',
      });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'says which field is taken, whatever its case',
    async () => {
      const { maker } = await aMaker();

      await createAccountWithoutPassword(maker, {
        name: 'Ada',
        username: 'ada',
        email: 'ada@example.com',
        by: null,
      });

      await expect(
        createAccountWithoutPassword(maker, { name: 'Ada', username: 'ADA', by: null }),
      ).resolves.toEqual({ kind: 'taken', field: 'username' });
      await expect(
        createAccountWithoutPassword(maker, { name: 'Ada', email: 'ADA@example.com', by: null }),
      ).resolves.toEqual({ kind: 'taken', field: 'email' });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'numbers a username another account already holds rather than refusing',
    async () => {
      const { maker, db } = await aMaker();

      await createAccountWithoutPassword(maker, { name: 'Sam', by: null });
      await createAccountWithoutPassword(maker, { name: 'Sam', by: null });

      const names = (await db.select({ username: user.username }).from(user)).map(
        (row) => row.username,
      );

      expect(names.sort()).toEqual(['sam', 'sam1']);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'refuses the placeholder domain as an address',
    async () => {
      const { maker } = await aMaker();

      await expect(
        createAccountWithoutPassword(maker, {
          name: 'Ada',
          email: 'ada@no-email.invalid',
          by: null,
        }),
      ).resolves.toEqual({ kind: 'failed' });
    },
    STARTING_POSTGRES_MS,
  );
});
