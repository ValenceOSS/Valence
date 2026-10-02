import { randomBytes, randomUUID } from 'node:crypto';
import { and, desc, eq, gt, inArray, isNotNull, isNull, ne } from 'drizzle-orm';
import { countAffected } from '@ValenceDatabase/countAffected';
import { account, accountSetupLink, user } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { realEmailOf } from '@ValenceContracts/functions/realEmailOf';
import { deriveUsername } from '@ValenceServer/auth/deriveUsername';
import { hashSetupToken } from '@ValenceServer/accounts/setupLinks/hashSetupToken';
import { setupStateOf } from '@ValenceServer/accounts/setupLinks/setupStateOf';
import type {
  Redemption,
  SetupLinkService,
  SetupStanding,
} from '@ValenceServer/accounts/setupLinks/SetupLinkService';

type SetupLinkServiceOptions = {
  db: AnyValenceDatabase;
  address: string;
  now?: () => Date;
};

const TOKEN_BYTES = 32;

const DAY_MILLISECONDS = 86_400_000;

const CREDENTIAL = 'credential';

/**
 * Keeps the setup links that let somebody into an account an administrator made for them: one live
 * link per account at most, each a long random token of which only a hash is stored, working once
 * and only until it expires or is revoked.
 *
 * @param options - The database, the address the web app is served from, and the clock.
 * @returns The setup link service.
 */
const createDatabaseSetupLinkService = ({
  db,
  address,
  now = () => new Date(),
}: SetupLinkServiceOptions): SetupLinkService => {
  /**
   * The address a token opens at.
   *
   * @param token - The token.
   * @param origin - Where the web app is served, if not the server's own address.
   * @returns The link.
   */
  const linkFor = (token: string, origin?: string): string =>
    `${(origin ?? address).replace(/\/+$/, '')}/welcome/${token}`;

  /**
   * Finds the live link a token belongs to, with the account it opens.
   *
   * @param token - The token from the link.
   * @returns The link and its account, or null when it is unknown, used, revoked or expired.
   */
  const findLive = async (token: string) => {
    const [found] = await db
      .select({
        linkId: accountSetupLink.id,
        userId: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        expiresAt: accountSetupLink.expiresAt,
      })
      .from(accountSetupLink)
      .innerJoin(user, eq(user.id, accountSetupLink.userId))
      .where(
        and(
          eq(accountSetupLink.tokenHash, hashSetupToken(token)),
          isNull(accountSetupLink.usedAt),
          isNull(accountSetupLink.revokedAt),
          gt(accountSetupLink.expiresAt, now()),
        ),
      )
      .limit(1);

    return found ?? null;
  };

  /**
   * Whether an account has a password to sign in with.
   *
   * @param userId - The account.
   * @returns Whether it has one.
   */
  const hasPassword = async (userId: string): Promise<boolean> => {
    const [credential] = await db
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, CREDENTIAL),
          isNotNull(account.password),
        ),
      )
      .limit(1);

    return credential !== undefined;
  };

  /**
   * Revokes every link for an account that could still be used.
   *
   * @param userId - The account.
   */
  const revoke = async (userId: string): Promise<void> => {
    await db
      .update(accountSetupLink)
      .set({ revokedAt: now() })
      .where(
        and(
          eq(accountSetupLink.userId, userId),
          isNull(accountSetupLink.usedAt),
          isNull(accountSetupLink.revokedAt),
        ),
      );
  };

  /**
   * Reads where each account stands with its setup links, from its latest link not revoked.
   *
   * @param userIds - The accounts.
   * @returns Each account's standing; an account without a link is absent.
   */
  const statesOf = async (userIds: readonly string[]): Promise<Map<string, SetupStanding>> => {
    const standings = new Map<string, SetupStanding>();

    if (userIds.length === 0) {
      return standings;
    }

    const rows = await db
      .select({
        userId: accountSetupLink.userId,
        expiresAt: accountSetupLink.expiresAt,
        usedAt: accountSetupLink.usedAt,
      })
      .from(accountSetupLink)
      .where(
        and(inArray(accountSetupLink.userId, [...userIds]), isNull(accountSetupLink.revokedAt)),
      )
      .orderBy(desc(accountSetupLink.createdAt));

    const at = now();

    for (const row of rows) {
      if (!standings.has(row.userId)) {
        standings.set(row.userId, {
          state: setupStateOf(row, at),
          expiresAt: row.usedAt === null ? row.expiresAt : null,
        });
      }
    }

    return standings;
  };

  return {
    issue: async (userId, { lifetimeDays, by, origin }) => {
      const token = randomBytes(TOKEN_BYTES).toString('base64url');
      const issuedAt = now();
      const expiresAt = new Date(issuedAt.getTime() + lifetimeDays * DAY_MILLISECONDS);

      await revoke(userId);
      await db.insert(accountSetupLink).values({
        id: randomUUID(),
        userId,
        tokenHash: hashSetupToken(token),
        expiresAt,
        createdBy: by,
        createdAt: issuedAt,
      });

      return { url: linkFor(token, origin), token, expiresAt };
    },

    linkFor,

    stateOf: async (userId) => (await statesOf([userId])).get(userId)?.state ?? 'none',

    statesOf,

    revoke,

    inspect: async (token) => {
      const found = await findLive(token);

      if (found === null) {
        return null;
      }

      const taken =
        found.username === null
          ? new Set(
              (
                await db
                  .select({ username: user.username })
                  .from(user)
                  .where(isNotNull(user.username))
              ).flatMap((row) => (row.username === null ? [] : [row.username.toLowerCase()])),
            )
          : new Set<string>();

      return {
        userId: found.userId,
        name: found.name,
        username: found.username,
        suggestedUsername:
          found.username ?? deriveUsername({ name: found.name, email: found.email }, taken),
        email: realEmailOf(found.email),
        hasPassword: await hasPassword(found.userId),
        expiresAt: found.expiresAt,
      };
    },

    redeem: async (token, changes): Promise<Redemption> => {
      const found = await findLive(token);

      if (found === null) {
        return { kind: 'gone' };
      }

      const mayRename = found.username === null || !(await hasPassword(found.userId));
      const asked = changes.username?.trim();
      const username =
        mayRename && asked !== undefined && asked.toLowerCase() !== found.username
          ? asked
          : undefined;

      if (found.username === null && (username === undefined || username === '')) {
        return { kind: 'needsUsername' };
      }

      if (username !== undefined) {
        const [holder] = await db
          .select({ id: user.id })
          .from(user)
          .where(and(eq(user.username, username.toLowerCase()), ne(user.id, found.userId)))
          .limit(1);

        if (holder !== undefined) {
          return { kind: 'taken', field: 'username' };
        }
      }

      const email =
        realEmailOf(found.email) === null ? changes.email?.trim().toLowerCase() : undefined;

      if (email !== undefined && email !== '') {
        const [holder] = await db
          .select({ id: user.id })
          .from(user)
          .where(and(eq(user.email, email), ne(user.id, found.userId)))
          .limit(1);

        if (holder !== undefined) {
          return { kind: 'taken', field: 'email' };
        }
      }

      return db.transaction(async (transaction): Promise<Redemption> => {
        const claimed = countAffected(
          await transaction
            .update(accountSetupLink)
            .set({ usedAt: now() })
            .where(
              and(
                eq(accountSetupLink.id, found.linkId),
                isNull(accountSetupLink.usedAt),
                isNull(accountSetupLink.revokedAt),
              ),
            ),
        );

        if (claimed === 0) {
          return { kind: 'gone' };
        }

        await transaction
          .update(user)
          .set({
            ...(username === undefined
              ? {}
              : { username: username.toLowerCase(), displayUsername: username }),
            ...(email === undefined || email === '' ? {} : { email }),
            updatedAt: now(),
          })
          .where(eq(user.id, found.userId));

        return {
          kind: 'redeemed',
          userId: found.userId,
          username: username?.toLowerCase() ?? found.username ?? '',
        };
      });
    },
  };
};

export { createDatabaseSetupLinkService };
