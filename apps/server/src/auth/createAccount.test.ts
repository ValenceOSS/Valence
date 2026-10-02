import { describe, expect, it, vi } from 'vitest';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { AUTH_PROVIDER } from '#dialect/AUTH_PROVIDER';
import { authSchema, session, user } from '#dialect/Schema';
import { createAuth } from '@ValenceServer/auth/Auth';
import { readEnv } from '@ValenceServer/env/Env';
import { createMemorySettingsStore } from '@ValenceServer/settings/createMemorySettingsStore';
import { ServerSettingsSchema } from '@ValenceServer/settings/ServerSettings';
import { createAccount } from './createAccount';

const STARTING_POSTGRES_MS = 60_000;

const PASSWORD = 'a long enough password';

/**
 * The real authentication layer over a fresh database, noting every account its creation hook
 * hears about.
 *
 * @returns The layer, its database, and what the hook heard.
 */
const anAuth = async () => {
  const db = await aMigratedDatabase();
  const created = vi.fn<(userId: string) => Promise<void>>().mockResolvedValue(undefined);
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

  return { auth, db, created };
};

describe('createAccount', () => {
  it(
    'makes an account whose address has a capital in it, as better-auth keeps it',
    async () => {
      const { auth, created } = await anAuth();

      const outcome = await createAccount(auth, {
        name: 'Ada',
        email: 'Ada@Example.com',
        password: PASSWORD,
      });

      expect(outcome).toMatchObject({
        kind: 'created',
        account: { name: 'Ada', email: 'ada@example.com' },
      });
      expect(created).toHaveBeenCalledWith(outcome.kind === 'created' ? outcome.account.id : '');
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'signs nobody in, so the new account has no session until its owner signs in',
    async () => {
      const { auth, db } = await anAuth();

      const outcome = await createAccount(auth, {
        name: 'Ada',
        email: 'ada@example.com',
        password: PASSWORD,
      });

      expect(outcome.kind).toBe('created');
      expect(await db.select().from(session)).toEqual([]);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'gives the account the password, so its owner can sign in with it',
    async () => {
      const { auth } = await anAuth();

      await createAccount(auth, { name: 'Ada', email: 'Ada@Example.com', password: PASSWORD });

      await expect(
        auth.api.signInEmail({ body: { email: 'ada@example.com', password: PASSWORD } }),
      ).resolves.toMatchObject({ user: { email: 'ada@example.com' } });
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'says the address is taken, whatever its case, and makes no second account',
    async () => {
      const { auth, db } = await anAuth();

      await createAccount(auth, { name: 'Ada', email: 'ada@example.com', password: PASSWORD });

      expect(
        await createAccount(auth, { name: 'Ada', email: 'ADA@example.com', password: PASSWORD }),
      ).toEqual({ kind: 'taken' });
      expect(await db.select().from(user).where(eq(user.email, 'ada@example.com'))).toHaveLength(1);
    },
    STARTING_POSTGRES_MS,
  );

  it(
    'says something else went wrong rather than that the address is taken',
    async () => {
      const { auth } = await anAuth();

      expect(
        await createAccount(auth, { name: 'Ada', email: 'not an address', password: PASSWORD }),
      ).toMatchObject({ kind: 'failed' });
    },
    STARTING_POSTGRES_MS,
  );
});
