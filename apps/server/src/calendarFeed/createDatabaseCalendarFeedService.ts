import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { countAffected } from '@ValenceDatabase/countAffected';
import { isUniqueViolation } from '@ValenceDatabase/isUniqueViolation';
import { ownerKeyOf } from '@ValenceServer/calendarFeed/ownerKeyOf';
import { calendarFeed } from '#dialect/Schema';
import { openSecret } from '@ValenceServer/plugins/openSecret';
import { sealSecret } from '@ValenceServer/plugins/sealSecret';
import { hashShareToken, makeShareToken } from '@ValenceServer/sharing/shareToken';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { CalendarFeed } from '@ValenceContracts/schemas/CalendarFeed';
import type { CalendarFeedOwner } from '@ValenceServer/calendarFeed/CalendarFeedOwner';
import type { CalendarFeedService } from '@ValenceServer/calendarFeed/CalendarFeedService';

/**
 * The links people subscribe to the release calendar by, held in the database: one for each person,
 * that is each face on an account, or the account itself where the server has no faces.
 *
 * A link is looked up by its token's hash, and the token itself is kept sealed, so its owner can be
 * handed the same link whenever they ask to add the calendar again — on another device, say —
 * without a copy of the database being a copy of everybody's calendars. A token sealed under a key
 * the server no longer has opens to nothing, and the link is then made afresh when next asked for.
 * Making a new link replaces the old one, which stops working at once. Each person has at most one
 * link, which the database holds to: where two requests to make the first link race, the one that
 * loses hands back the link the other stored, and so does one of two requests to replace it.
 *
 * @param db - The database.
 * @param sealingKey - The key the tokens are sealed with.
 * @returns The service.
 */
const createDatabaseCalendarFeedService = (
  db: AnyValenceDatabase,
  sealingKey: Buffer,
): CalendarFeedService => {
  const ownedBy = (owner: CalendarFeedOwner) => eq(calendarFeed.ownerKey, ownerKeyOf(owner));

  const read = async (owner: CalendarFeedOwner): Promise<CalendarFeed | null> => {
    const [held] = await db
      .select({
        sealedToken: calendarFeed.sealedToken,
        createdAt: calendarFeed.createdAt,
        lastReadAt: calendarFeed.lastReadAt,
      })
      .from(calendarFeed)
      .where(ownedBy(owner))
      .limit(1);

    return held === undefined
      ? null
      : {
          token: openSecret(sealingKey, held.sealedToken),
          createdAt: held.createdAt.toISOString(),
          lastReadAt: held.lastReadAt === null ? null : held.lastReadAt.toISOString(),
        };
  };

  /**
   * A new link for somebody, as the row that holds it and what is said of it.
   *
   * @param owner - Whose link it is.
   * @returns The row to store, and the link.
   */
  const aNewLink = (owner: CalendarFeedOwner) => {
    const token = makeShareToken();
    const createdAt = new Date();

    return {
      row: {
        id: randomUUID(),
        tokenHash: hashShareToken(token),
        sealedToken: sealSecret(sealingKey, token),
        ownerKey: ownerKeyOf(owner),
        accountId: owner.accountId,
        profileId: owner.profileId,
        createdAt,
        lastReadAt: null,
      },
      feed: { token, createdAt: createdAt.toISOString(), lastReadAt: null },
    };
  };

  /**
   * What somebody's link is after making one collided with another request making one at the same
   * moment: the link that request stored, which is as new as the one that lost.
   *
   * @param owner - Whose link it is.
   * @param error - Why storing the link failed.
   * @returns The stored link, or nothing where the failure was not such a collision.
   */
  const storedAfterACollision = async <Failure>(
    owner: CalendarFeedOwner,
    error: Failure,
  ): Promise<CalendarFeed | null> => {
    const stored = isUniqueViolation(error) ? await read(owner) : null;

    return stored === null || stored.token === null ? null : stored;
  };

  const renew = async (owner: CalendarFeedOwner): Promise<CalendarFeed> => {
    const made = aNewLink(owner);

    try {
      await db.transaction(async (tx) => {
        await tx.delete(calendarFeed).where(ownedBy(owner));
        await tx.insert(calendarFeed).values(made.row);
      });
    } catch (error) {
      const stored = await storedAfterACollision(owner, error);

      if (stored === null) {
        throw error;
      }

      return stored;
    }

    return made.feed;
  };

  return {
    read,

    ensure: async (owner) => {
      const held = await read(owner);

      if (held !== null && held.token !== null) {
        return held;
      }

      if (held !== null) {
        return renew(owner);
      }

      const made = aNewLink(owner);

      try {
        await db.insert(calendarFeed).values(made.row);

        return made.feed;
      } catch (error) {
        const stored = await storedAfterACollision(owner, error);

        if (stored === null) {
          throw error;
        }

        return stored;
      }
    },

    renew,

    stop: async (owner) => countAffected(await db.delete(calendarFeed).where(ownedBy(owner))) > 0,

    resolve: async (token) => {
      const tokenHash = hashShareToken(token);
      const [held] = await db
        .select({ accountId: calendarFeed.accountId, profileId: calendarFeed.profileId })
        .from(calendarFeed)
        .where(eq(calendarFeed.tokenHash, tokenHash))
        .limit(1);

      if (held === undefined) {
        return null;
      }

      await db
        .update(calendarFeed)
        .set({ lastReadAt: new Date() })
        .where(eq(calendarFeed.tokenHash, tokenHash));

      return held;
    },
  };
};

export { createDatabaseCalendarFeedService };
