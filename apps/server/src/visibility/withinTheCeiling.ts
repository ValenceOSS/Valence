import { and, eq, exists, gt, isNull, notExists, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { ageCeiling, ageException, mediaItem } from '@ValenceServer/db/Schema';
import type { ValenceDatabase } from '@ValenceServer/db/Database';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const ALLOW = 'allow';

const DENY = 'deny';

/**
 * Whether an item is within the age an account is allowed, once every exception has had its say.
 *
 * Three rules in the order the permission model already uses, so there is only one order to
 * remember:
 *
 * 1. A **deny** always wins, whatever else says. It is what a parent relies on when they have looked
 *    at something themselves and decided, and a rule somebody can talk their way around is not one.
 * 2. An **allow** beats the ceiling. "She can watch this particular 15" is the request every
 *    household has, and without it a parent either lifts the ceiling for everything or says no.
 * 3. Otherwise the **ceiling** for the library the item sits in, which is where it is set — a
 *    children's library with none at all, the general one capped, and the one nobody's children
 *    should see missing entirely through per-library access rather than through this.
 *
 * An exception may name a programme as well as an item, because granting one episode of a series is
 * rarely what anybody means.
 *
 * Something nobody certificated is refused unless the account is allowed unrated things. That is the
 * one place this fails closed rather than open, and deliberately: an unrated item shown to a child
 * because a catalogue was missing a field is precisely the failure the whole feature exists to
 * prevent. The escape is a switch, per account, for a household whose library is mostly unmatched.
 *
 * Asks nothing of an administrator, of a share guest, or of the server itself, and nothing at all of
 * an account no ceiling was ever set for — which is every account until somebody says otherwise.
 *
 * @param db - The database the subqueries are built against.
 * @param viewer - Who is asking.
 * @returns The condition, or nothing where no ceiling applies.
 */
const withinTheCeiling = (db: ValenceDatabase, viewer: Viewer): SQL | undefined => {
  if (viewer.kind !== 'account' || viewer.isAdministrator) {
    return undefined;
  }

  const { accountId } = viewer;

  const named = (effect: string) =>
    db
      .select({ one: sql`1` })
      .from(ageException)
      .where(
        and(
          eq(ageException.userId, accountId),
          eq(ageException.effect, effect),
          or(
            eq(ageException.mediaItemId, mediaItem.id),
            eq(ageException.seriesId, mediaItem.seriesId),
          ),
        ),
      );

  const withinIt = notExists(
    db
      .select({ one: sql`1` })
      .from(ageCeiling)
      .where(
        and(
          eq(ageCeiling.userId, accountId),
          eq(ageCeiling.libraryId, mediaItem.libraryId),
          or(
            gt(mediaItem.certificationAge, ageCeiling.maximumAge),
            and(isNull(mediaItem.certificationAge), eq(ageCeiling.allowsUnrated, false)),
          ),
        ),
      ),
  );

  return and(notExists(named(DENY)), or(exists(named(ALLOW)), withinIt));
};

export { ALLOW, DENY, withinTheCeiling };
